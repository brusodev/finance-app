"""Gerenciamento de Categorias"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas
from ..database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


@router.get("/", response_model=List[schemas.Category])
def list_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Listar todas as categorias.
    
    - skip: número de registros a pular (padrão: 0)
    - limit: número máximo de registros (padrão: 100)
    """
    categories = crud.get_all_categories(db, skip=skip, limit=limit)
    return categories


@router.post(
    "/", response_model=schemas.Category,
    status_code=status.HTTP_201_CREATED
)
def create_category(
    category: schemas.Category,
    db: Session = Depends(get_db)
):
    """Criar uma nova categoria"""
    db_category = crud.get_category_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Categoria com esse nome já existe"
        )
    return crud.create_category(db=db, category=category)


@router.get("/{category_id}", response_model=schemas.Category)
def get_category(category_id: int, db: Session = Depends(get_db)):
    """Obter dados de uma categoria específica"""
    db_category = crud.get_category(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    return db_category


@router.put("/{category_id}", response_model=schemas.Category)
def update_category(
    category_id: int,
    category: schemas.Category,
    db: Session = Depends(get_db)
):
    """Atualizar uma categoria"""
    db_category = crud.get_category(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    return crud.update_category(
        db=db, category_id=category_id, category=category
    )


@router.delete("/{category_id}", response_model=schemas.Category)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Deletar uma categoria"""
    db_category = crud.get_category(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada"
        )
    return crud.delete_category(db=db, category_id=category_id)
