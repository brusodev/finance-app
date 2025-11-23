"""Gerenciamento de Transações"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)


@router.get("/", response_model=List[schemas.Transaction])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Listar todas as transações.

    - skip: número de registros a pular (padrão: 0)
    - limit: número máximo de registros (padrão: 100)
    """
    transactions = crud.get_all_transactions(db, skip=skip, limit=limit)
    return transactions


@router.post(
    "/", response_model=schemas.Transaction,
    status_code=status.HTTP_201_CREATED
)
def create_transaction(
    transaction: schemas.TransactionCreate,
    user_id: int = 1,  # Em produção, extrair do JWT
    db: Session = Depends(get_db)
):
    """
    Criar uma nova transação.

    - user_id: ID do usuário (padrão: 1 para testes)
    - amount: valor da transação
    - date: data da transação
    - description: descrição (opcional)
    - category_id: ID da categoria
    """
    # Validar categoria
    db_category = crud.get_category(db, transaction.category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )

    return crud.create_transaction(
        db=db, transaction=transaction, user_id=user_id
    )


@router.get("/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    """Obter dados de uma transação específica"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )
    return db_transaction


@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db)
):
    """Atualizar uma transação"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )

    # Validar categoria
    db_category = crud.get_category(db, transaction.category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )

    return crud.update_transaction(
        db=db, transaction_id=transaction_id, transaction=transaction
    )


@router.delete("/{transaction_id}", response_model=schemas.Transaction)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db)
):
    """Deletar uma transação"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )
    return crud.delete_transaction(db=db, transaction_id=transaction_id)
