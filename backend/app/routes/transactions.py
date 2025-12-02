"""Gerenciamento de Transações"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)


@router.get("/suggestions/descriptions", response_model=list[str])
def get_transaction_description_suggestions(
    transaction_type: str = None,
    category_id: int = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Obter sugestões de descrições baseadas em transações populares de outros usuários.

    Parâmetros opcionais:
    - transaction_type: Filtrar por tipo ('income' ou 'expense')
    - category_id: Filtrar por categoria específica
    - limit: Número máximo de sugestões (padrão: 10)

    Exemplos:
    - GET /transactions/suggestions/descriptions
    - GET /transactions/suggestions/descriptions?transaction_type=expense
    - GET /transactions/suggestions/descriptions?category_id=5
    - GET /transactions/suggestions/descriptions?transaction_type=income&category_id=3&limit=20
    """
    suggestions = crud.get_transaction_description_suggestions(
        db,
        user_id=current_user.id,
        transaction_type=transaction_type,
        category_id=category_id,
        limit=limit
    )
    return suggestions


@router.get("/", response_model=List[schemas.Transaction])
def list_transactions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Listar todas as transações do usuário logado.

    - skip: número de registros a pular (padrão: 0)
    - limit: número máximo de registros (padrão: 100)
    """
    transactions = crud.get_user_transactions(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return transactions


@router.post(
    "/", response_model=schemas.Transaction,
    status_code=status.HTTP_201_CREATED
)
def create_transaction(
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Criar uma nova transação.

    - amount: valor da transação
    - date: data da transação
    - description: descrição (opcional)
    - category_id: ID da categoria
    - transaction_type: 'income' ou 'expense'
    """
    # Validar categoria pertence ao usuário
    db_category = crud.get_category(db, transaction.category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    if db_category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    return crud.create_transaction(
        db=db, transaction=transaction, user_id=current_user.id
    )


@router.get("/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Obter dados de uma transação específica"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )
    if db_transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    return db_transaction


@router.put("/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(
    transaction_id: int,
    transaction: schemas.TransactionCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Atualizar uma transação"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )
    if db_transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    # Validar categoria
    db_category = crud.get_category(db, transaction.category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    if db_category.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )

    return crud.update_transaction(
        db=db, transaction_id=transaction_id, transaction=transaction
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Deletar uma transação"""
    db_transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transação não encontrada"
        )
    if db_transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado"
        )
    crud.delete_transaction(db=db, transaction_id=transaction_id)
    return None
