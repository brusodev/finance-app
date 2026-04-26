"""Rotas de Cartão de Crédito — config, importação e revisão."""

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File,
    status, Query
)
from sqlalchemy.orm import Session
from datetime import date

from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user
from ..parsers import parse_uploaded_file

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
            )
        result.append(schemas.ImportBatchSummary(
            id=b.id,
            account_id=b.account_id,
            reference_month=b.reference_month,
            file_name=b.file_name,
            file_type=b.file_type,
            status=b.status.value if hasattr(b.status, 'value') else b.status,
            created_at=b.created_at,
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
    reference_month: date = Query(
        ..., description="Mês de referência (YYYY-MM-DD)"
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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao processar arquivo: {e}",
        )

    batch = crud.create_import_batch(
        db,
        account_id=account_id,
        reference_month=reference_month,
        file_name=filename,
        file_type=ext,
        user_id=current_user.id,
    )

    if items_data:
        crud.add_import_items(db, batch.id, items_data, current_user.id)
        db.refresh(batch)

    return batch


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
    return batch


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
