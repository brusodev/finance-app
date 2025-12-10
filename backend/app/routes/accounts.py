"""Gerenciamento de Contas"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
)


@router.get("/suggestions", response_model=list[str])
def get_account_suggestions(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
    limit: int = 10
):
    """
    Obter sugestões de nomes de contas baseadas em contas populares de outros usuários.

    - limit: número máximo de sugestões (padrão: 10)
    """
    suggestions = crud.get_account_suggestions(db, user_id=current_user.id, limit=limit)
    return suggestions


@router.get("/", response_model=list[schemas.Account])
def list_accounts(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Listar todas as contas do usuário logado"""
    return crud.get_user_accounts(db, current_user.id)


@router.get("/{account_id}", response_model=schemas.Account)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Obter detalhes de uma conta"""
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    return db_account


@router.post("/", response_model=schemas.Account, status_code=status.HTTP_201_CREATED)
def create_account(
    account: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Criar nova conta"""
    return crud.create_account(db=db, account=account, user_id=current_user.id)


@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    account_id: int,
    account: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Atualizar conta (não altera saldos diretamente)"""
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    db_account = crud.update_account(db, account_id, account)
    return db_account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    hard_delete: bool = False,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Deletar conta (soft delete por padrão)
    - hard_delete=False: apenas marca como inativa (padrão)
    - hard_delete=True: remove permanentemente do banco
    """
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    success = crud.delete_account(db, account_id, soft_delete=not hard_delete)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )


@router.get("/{account_id}/audit", response_model=schemas.AccountBalanceAudit)
def audit_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Auditar saldo da conta
    Compara o saldo armazenado com o saldo calculado a partir das transações
    """
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    audit_result = crud.audit_account_balance(db, account_id)
    if not audit_result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao auditar conta"
        )

    return audit_result


@router.post("/{account_id}/recalculate")
def recalculate_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Recalcular e corrigir o saldo da conta
    Útil para corrigir inconsistências detectadas pela auditoria
    """
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    if db_account.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    result = crud.recalculate_account_balance(db, account_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao recalcular saldo"
        )

    return result


@router.get("/audit/all", response_model=list[schemas.AccountBalanceAudit])
def audit_all_accounts(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Auditar todas as contas do usuário
    Retorna lista com status de integridade de cada conta
    """
    audits = crud.audit_all_user_accounts(db, current_user.id)
    return audits
