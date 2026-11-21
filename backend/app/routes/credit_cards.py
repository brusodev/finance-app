"""Rotas de Cartão de Crédito — config, importação e revisão."""

import logging

from fastapi import (
    APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File,
    status, Query
)
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from .. import crud, schemas, classify_jobs
from ..database import get_db, SessionLocal
from .auth import get_current_user
from ..parsers import (
    parse_uploaded_file, parse_ofx_period, parse_ofx_balance,
)
from ..ai_classifier import MissingGroqKey

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/credit-cards",
    tags=["credit-cards"],
)


# ============================================================
# CONFIGURAÇÃO DO CARTÃO
# ============================================================

@router.post(
    "/{account_id}/config",
    response_model=schemas.CreditCardConfig,
    status_code=status.HTTP_201_CREATED,
)
def create_config(
    account_id: int,
    config_in: schemas.CreditCardConfigCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Cria ou substitui a configuração do cartão de crédito."""
    if config_in.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="account_id na URL e no body devem ser iguais",
        )
    try:
        return crud.create_credit_card_config(
            db, config_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.get(
    "/{account_id}/config",
    response_model=schemas.CreditCardConfig,
)
def get_config(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Retorna a configuração do cartão de crédito."""
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    config = crud.get_credit_card_config(db, account_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração de cartão não encontrada",
        )
    return config


@router.put(
    "/{account_id}/config",
    response_model=schemas.CreditCardConfig,
)
def update_config(
    account_id: int,
    config_in: schemas.CreditCardConfigUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Atualiza a configuração do cartão de crédito."""
    try:
        return crud.update_credit_card_config(
            db, account_id, config_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


# ============================================================
# PARCELAMENTOS
# ============================================================

@router.get("/{account_id}/installments")
def list_active_installments(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Parcelamentos ativos do cartão, consolidados entre faturas."""
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    items = crud.get_active_installments(db, current_user.id, account_id)
    return {
        "items": items,
        "total_remaining": sum(i["remaining_amount"] for i in items),
        "count": len(items),
    }


def _own_account(db, account_id, user_id):
    account = crud.get_account(db, account_id)
    if not account or account.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    return account


def _own_statement(db, account_id, statement_id, user_id):
    stmt = crud.get_statement(db, statement_id, user_id)
    if not stmt or stmt.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fatura não encontrada",
        )
    return stmt


@router.get("/{account_id}/installments/schedule")
def installment_schedule(
    account_id: int,
    months_ahead: int = Query(12, ge=1, le=60),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Parcelas futuras projetadas por mês de vencimento (sem lançar nada)."""
    _own_account(db, account_id, current_user.id)
    months = crud.get_installment_schedule(
        db, current_user.id, account_id, months_ahead=months_ahead,
    )
    return {
        "months": months,
        "total": round(sum(m["total"] for m in months), 2),
    }


# ============================================================
# FATURAS (uma por mês de vencimento)
# ============================================================

@router.get("/{account_id}/statements")
def statement_timeline(
    account_id: int,
    months_back: int = Query(12, ge=0, le=36),
    months_ahead: int = Query(6, ge=0, le=24),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Linha do tempo: faturas passadas, a atual e as futuras projetadas."""
    _own_account(db, account_id, current_user.id)
    return crud.get_statement_timeline(
        db, current_user.id, account_id,
        months_back=months_back, months_ahead=months_ahead,
    )


@router.get("/{account_id}/statements/{statement_id}")
def statement_detail(
    account_id: int,
    statement_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Fatura com os itens de todos os lotes que a compõem."""
    stmt = _own_statement(db, account_id, statement_id, current_user.id)
    return crud.get_statement_detail(db, stmt)


@router.post(
    "/{account_id}/statements/{statement_id}/payments",
    status_code=status.HTTP_201_CREATED,
)
def pay_statement(
    account_id: int,
    statement_id: int,
    payment_in: schemas.CreditCardStatementPaymentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Registra pagamento total ou parcial de uma fatura."""
    _own_statement(db, account_id, statement_id, current_user.id)
    try:
        stmt = crud.register_statement_payment(
            db, statement_id, payment_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return crud.get_statement_detail(db, stmt)


@router.get("/{account_id}/import-coverage")
def import_coverage(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Períodos já importados da conta e buracos (dias ou meses) entre eles."""
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    return crud.get_import_coverage(db, account_id, current_user.id)


# ============================================================
# LOTES DE IMPORTAÇÃO
# ============================================================

@router.get(
    "/{account_id}/batches",
    response_model=list[schemas.ImportBatchSummary],
)
def list_batches(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Lista todos os lotes de importação do cartão."""
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    batches = crud.list_import_batches(
        db, current_user.id, account_id=account_id
    )
    result = []
    for b in batches:
        pending_items = [
            i for i in b.items
            if i.status != 'ignored'
        ]
        total = sum(abs(i.amount) for i in pending_items)
        stmt = crud.get_credit_card_statement_by_batch(db, b.id, current_user.id)
        statement_info = None
        if stmt:
            statement_info = schemas.ImportBatchStatementInfo(
                id=stmt.id,
                total_amount=stmt.total_amount,
                paid_amount=stmt.paid_amount,
                status=stmt.status.value if hasattr(stmt.status, 'value') else stmt.status,
                due_date=stmt.due_date,
                reference_month=stmt.reference_month,
            )
        result.append(schemas.ImportBatchSummary(
            id=b.id,
            account_id=b.account_id,
            reference_month=b.reference_month,
            file_name=b.file_name,
            file_type=b.file_type,
            status=b.status.value if hasattr(b.status, 'value') else b.status,
            created_at=b.created_at,
            updated_at=b.updated_at or b.created_at,
            item_count=len(b.items),
            total_amount=total,
            statement=statement_info,
        ))
    return result


@router.post(
    "/{account_id}/batches/manual",
    response_model=schemas.ImportBatch,
    status_code=status.HTTP_201_CREATED,
)
def create_manual_batch(
    account_id: int,
    batch_in: schemas.ImportBatchCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Cria um lote vazio para lançamentos manuais."""
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )
    batch = crud.create_import_batch(
        db,
        account_id=account_id,
        reference_month=batch_in.reference_month,
        file_type='manual',
        user_id=current_user.id,
    )
    return batch


@router.post(
    "/{account_id}/batches/upload",
    response_model=schemas.ImportBatch,
    status_code=status.HTTP_201_CREATED,
)
async def upload_batch(
    account_id: int,
    reference_month: Optional[date] = Query(
        None,
        description=(
            "Mês de referência (YYYY-MM-DD). Em cartão, é o mês de "
            "vencimento da fatura; se omitido, é detectado pelas datas."
        ),
    ),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """
    Faz upload de um arquivo CSV ou OFX e cria um lote com os
    itens extraídos para revisão.
    """
    account = crud.get_account(db, account_id)
    if not account or account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada",
        )

    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ("csv", "ofx"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Formato não suportado. Use CSV ou OFX.",
        )

    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Arquivo muito grande. Tamanho máximo: 5 MB.",
        )

    try:
        items_data = parse_uploaded_file(content, ext)
    except ValueError as e:
        # Mensagens dos parsers, escritas para o usuário.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao processar arquivo: {e}",
        )
    except Exception:
        logger.exception("Falha inesperada ao ler arquivo importado")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Não foi possível ler o arquivo. Confira se é um CSV ou OFX válido.",
        )

    period_start = period_end = None
    bank_balance = bank_balance_date = None
    if ext.lower().strip('.') in ('ofx', 'qfx'):
        period_start, period_end = parse_ofx_period(content)
        bank_balance, bank_balance_date = parse_ofx_balance(content)

    if reference_month is None:
        reference_month = crud.suggest_reference_month(
            db, account_id, items_data, period_end=period_end,
        )

    duplicate_batch = crud.find_duplicate_import_batch(
        db,
        account_id=account_id,
        user_id=current_user.id,
        reference_month=reference_month,
        items_data=items_data,
    )
    if duplicate_batch:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Importação equivalente já existe para esta conta e mês. "
                f"Revise o lote #{duplicate_batch.id} em vez de duplicar."
            ),
        )

    batch = crud.create_import_batch(
        db,
        account_id=account_id,
        reference_month=reference_month,
        file_name=filename,
        file_type=ext,
        user_id=current_user.id,
        period_start=period_start,
        period_end=period_end,
        statement_balance=bank_balance,
        statement_balance_date=bank_balance_date,
    )

    if items_data:
        crud.add_import_items(db, batch.id, items_data, current_user.id)
        db.refresh(batch)

    return _batch_response(db, batch)


def _batch_response(db, batch):
    data = schemas.ImportBatch.model_validate(batch)
    return data.model_copy(update={"cycle": crud.batch_cycle_info(db, batch)})


@router.put(
    "/{account_id}/batches/{batch_id}/reference-month",
    response_model=schemas.ImportBatch,
)
def set_batch_reference_month(
    account_id: int,
    batch_id: int,
    body: schemas.ImportBatchReferenceMonthUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Muda a fatura (mês de vencimento) de um lote ainda não confirmado."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    try:
        batch = crud.update_batch_reference_month(
            db, batch_id, current_user.id, body.reference_month
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
    return _batch_response(db, batch)


@router.get("/{account_id}/batches/{batch_id}/balance-check")
def batch_balance_check(
    account_id: int,
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Compara o saldo final do extrato com o saldo do app na mesma data."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    return crud.get_balance_check(db, batch)


@router.get(
    "/{account_id}/batches/{batch_id}",
    response_model=schemas.ImportBatch,
)
def get_batch(
    account_id: int,
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Retorna um lote com todos os seus itens."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    return _batch_response(db, batch)


@router.delete(
    "/{account_id}/batches/{batch_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def cancel_batch(
    account_id: int,
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Cancela um lote pendente ou revisado."""
    try:
        crud.cancel_import_batch(db, batch_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


# ============================================================
# ITENS DO LOTE
# ============================================================

@router.post(
    "/{account_id}/batches/{batch_id}/items",
    response_model=schemas.ImportItem,
    status_code=status.HTTP_201_CREATED,
)
def add_manual_item(
    account_id: int,
    batch_id: int,
    item_in: schemas.ImportItemCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Adiciona um item manual a um lote existente."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    try:
        return crud.add_manual_import_item(
            db, batch_id, item_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.put(
    "/{account_id}/batches/{batch_id}/items/{item_id}",
    response_model=schemas.ImportItem,
)
def update_item(
    account_id: int,
    batch_id: int,
    item_id: int,
    item_in: schemas.ImportItemUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Edita um item importado (descrição, valor, data, categoria)."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    try:
        return crud.update_import_item(
            db, item_id, item_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


# ============================================================
# CLASSIFICAÇÃO POR IA
# ============================================================

def _run_classify_job(job_id: str, batch_id: int, user_id: int):
    """
    Roda a classificação em background com sessão de DB própria.
    A request HTTP já retornou; aqui só atualizamos o job store.
    """
    db = SessionLocal()
    try:
        def on_progress(processed: int, total: int):
            classify_jobs.set_progress(job_id, processed, total)

        result = crud.classify_import_batch(
            db, batch_id, user_id, on_progress=on_progress
        )
        # Serializa enquanto a sessão está aberta (items são ORM).
        payload = schemas.ClassifyResult.model_validate(result).model_dump()
        classify_jobs.set_done(job_id, payload)
    except MissingGroqKey:
        classify_jobs.set_error(
            job_id,
            "Classificação por IA indisponível: GROQ_API_KEY não "
            "configurada no servidor.",
        )
    except ValueError as e:
        classify_jobs.set_error(job_id, str(e))
    except Exception:
        classify_jobs.set_error(job_id, "Erro inesperado ao classificar.")
    finally:
        db.close()


@router.post(
    "/{account_id}/batches/{batch_id}/classify",
    response_model=schemas.ClassifyJobCreated,
    status_code=status.HTTP_202_ACCEPTED,
)
def classify_batch(
    account_id: int,
    batch_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """
    Inicia, em background, a classificação por IA dos itens pendentes do
    lote. Retorna um job_id; o frontend acompanha o andamento por polling
    em GET .../classify/{job_id}. Roda assíncrono porque a IA pode levar
    dezenas de segundos e a request síncrona estourava o timeout do proxy.
    """
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )

    job_id = classify_jobs.create_job(batch_id, current_user.id)
    background_tasks.add_task(
        _run_classify_job, job_id, batch_id, current_user.id
    )
    return {"job_id": job_id, "status": "pending"}


@router.get(
    "/{account_id}/batches/{batch_id}/classify/{job_id}",
    response_model=schemas.ClassifyJobStatus,
)
def classify_batch_status(
    account_id: int,
    batch_id: int,
    job_id: str,
    current_user: schemas.User = Depends(get_current_user),
):
    """Andamento de um job de classificação (polling)."""
    job = classify_jobs.get_job(job_id)
    if (
        not job
        or job["batch_id"] != batch_id
        or job["user_id"] != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job não encontrado",
        )
    return {
        "job_id": job["id"],
        "status": job["status"],
        "processed": job["processed"],
        "total": job["total"],
        "error": job["error"],
        "result": job["result"],
    }


# ============================================================
# CONFIRMAÇÃO
# ============================================================

@router.post(
    "/{account_id}/batches/{batch_id}/confirm",
    response_model=schemas.ConfirmImportResponse,
)
def confirm_batch(
    account_id: int,
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """
    Confirma o lote: converte todos os itens não-ignorados em
    transactions oficiais e atualiza o saldo do cartão.
    """
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    try:
        result = crud.confirm_import_batch(db, batch_id, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )


@router.post(
    "/{account_id}/batches/{batch_id}/payments",
    response_model=schemas.CreditCardStatement,
    status_code=status.HTTP_201_CREATED,
)
def register_payment(
    account_id: int,
    batch_id: int,
    payment_in: schemas.CreditCardStatementPaymentCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
):
    """Registra um pagamento total ou parcial da fatura do lote."""
    batch = crud.get_import_batch(db, batch_id, current_user.id)
    if not batch or batch.account_id != account_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote não encontrado",
        )
    try:
        return crud.register_credit_card_statement_payment(
            db, batch_id, payment_in, current_user.id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )
