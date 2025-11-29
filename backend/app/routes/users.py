"""Gerenciamento de Usuários"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user
import json

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


@router.get("/", response_model=List[schemas.User])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Listar todos os usuários.

    - skip: número de registros a pular (padrão: 0)
    - limit: número máximo de registros (padrão: 100)
    """
    users = crud.get_all_users(db, skip=skip, limit=limit)
    return users


@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Obter dados de um usuário específico"""
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return db_user


@router.put("/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Atualizar dados de um usuário"""
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return crud.update_user(db=db, user_id=user_id, user=user)


@router.delete("/{user_id}", response_model=schemas.User)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Deletar um usuário"""
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return crud.delete_user(db=db, user_id=user_id)


@router.post("/profile/debug")
def debug_profile_update(
    data: Dict[Any, Any] = Body(...),
    current_user: schemas.User = Depends(get_current_user)
):
    """Endpoint de debug para ver dados brutos recebidos"""
    return {
        "received_data": data,
        "current_user_id": current_user.id,
        "data_types": {k: str(type(v).__name__) for k, v in data.items()}
    }


@router.put("/profile", response_model=schemas.User)
def update_profile(
    user: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Atualizar perfil do usuário autenticado"""
    print(f"Dados recebidos: {user.dict()}")
    print(f"Usuário autenticado: {current_user.id}")

    db_user = crud.get_user(db, user_id=current_user.id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    try:
        updated_user = crud.update_user_profile(db=db, user_id=current_user.id, user=user)
        return updated_user
    except Exception as e:
        print(f"Erro ao atualizar perfil: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar perfil: {str(e)}"
        )


@router.get("/profile", response_model=schemas.User)
def get_profile(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Obter perfil do usuário autenticado"""
    return current_user
