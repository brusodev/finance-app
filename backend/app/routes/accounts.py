"""Gerenciamento de Contas"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/accounts",
    tags=["accounts"],
)


@router.get("/", response_model=list[schemas.Account])
def list_accounts(db: Session = Depends(get_db)):
    """Listar todas as contas"""
    return crud.get_all_accounts(db)


@router.get("/{account_id}", response_model=schemas.Account)
def get_account(account_id: int, db: Session = Depends(get_db)):
    """Obter detalhes de uma conta"""
    db_account = crud.get_account(db, account_id)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    return db_account


@router.post("/", response_model=schemas.Account)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db)):
    """Criar nova conta"""
    return crud.create_account(db=db, account=account)


@router.put("/{account_id}", response_model=schemas.Account)
def update_account(
    account_id: int,
    account: schemas.AccountCreate,
    db: Session = Depends(get_db)
):
    """Atualizar conta"""
    db_account = crud.update_account(db, account_id, account)
    if not db_account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
    return db_account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Deletar conta"""
    success = crud.delete_account(db, account_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conta não encontrada"
        )
