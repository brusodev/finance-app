"""Gerenciamento de Usuários"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db

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


@router.put("/profile", response_model=schemas.User)
def update_profile(user: schemas.UserUpdate, db: Session = Depends(get_db)):
    """Atualizar perfil do usuário autenticado"""
    # Em um caso real, você pegaria o user_id do token JWT
    # Por enquanto, vamos usar user_id = 1 como exemplo
    user_id = 1
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    return crud.update_user_profile(db=db, user_id=user_id, user=user)

