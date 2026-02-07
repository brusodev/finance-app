"""Gerenciamento de Transferências entre Contas"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/transfers",
    tags=["transfers"],
)


@router.post("/", response_model=schemas.TransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(
    transfer: schemas.TransferCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Criar uma transferência entre duas contas do usuário.

    A transferência cria dois lançamentos vinculados:
    - Um débito (saída) da conta de origem
    - Um crédito (entrada) na conta de destino

    Parâmetros:
    - from_account_id: ID da conta de origem
    - to_account_id: ID da conta de destino
    - amount: Valor da transferência (deve ser positivo)
    - date: Data da transferência
    - description: Descrição opcional
    - category_id: ID da categoria (opcional, usa categoria "Transferência" por padrão)
    """
    try:
        result = crud.create_transfer(db=db, transfer=transfer, user_id=current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar transferência: {str(e)}"
        )


@router.get("/{transfer_id}/transactions", response_model=List[schemas.Transaction])
def get_transfer_transactions(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Obter as duas transações vinculadas a uma transferência.

    Retorna a transação de débito e a de crédito.
    """
    transactions = crud.get_transfer_transactions(db, transfer_id, current_user.id)
    if not transactions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transferência não encontrada"
        )
    return transactions


@router.delete("/{transfer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transfer(
    transfer_id: str,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Deletar uma transferência.

    Remove as duas transações vinculadas e reverte os saldos das contas.
    """
    try:
        crud.delete_transfer(db, transfer_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar transferência: {str(e)}"
        )
