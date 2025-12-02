"""Gerenciamento de Categorias"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


@router.get("/suggestions", response_model=List[str])
def get_category_suggestions(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
    limit: int = 10
):
    """
    Obter sugestões de nomes de categorias baseadas em categorias populares de outros usuários.

    - limit: número máximo de sugestões (padrão: 10)
    """
    suggestions = crud.get_category_suggestions(db, user_id=current_user.id, limit=limit)
    return suggestions


@router.get("/", response_model=List[schemas.Category])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Listar todas as categorias do usuário logado.

    - skip: número de registros a pular (padrão: 0)
    - limit: número máximo de registros (padrão: 100)
    """
    categories = crud.get_user_categories(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return categories


@router.post(
    "/", response_model=schemas.Category,
    status_code=status.HTTP_201_CREATED
)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Criar uma nova categoria"""
    # Verificar se já existe uma categoria com esse nome para este usuário
    db_category = crud.get_category_by_name_and_user(
        db, name=category.name, user_id=current_user.id
    )
    if db_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já possui uma categoria com esse nome"
        )
    return crud.create_category(
        db=db, category=category, user_id=current_user.id
    )


@router.get("/{category_id}", response_model=schemas.Category)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Obter dados de uma categoria específica"""
    db_category = crud.get_category(db, category_id=category_id)
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
    return db_category


@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Atualizar uma categoria"""
    db_category = crud.get_category(db, category_id=category_id)
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

    # Verificar se já existe outra categoria com esse nome para este usuário
    existing_category = crud.get_category_by_name_and_user(
        db, name=category.name, user_id=current_user.id
    )
    if existing_category and existing_category.id != category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Você já possui outra categoria com esse nome"
        )

    return crud.update_category(
        db=db, category_id=category_id, category=category
    )


@router.delete("/{category_id}", response_model=schemas.Category)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Deletar uma categoria"""
    db_category = crud.get_category(db, category_id=category_id)
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
    return crud.delete_category(db=db, category_id=category_id)
