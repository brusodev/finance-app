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


@router.post("/", response_model=schemas.Account)
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
    account: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Atualizar conta"""
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
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Deletar conta"""
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
    success = crud.delete_account(db, account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
