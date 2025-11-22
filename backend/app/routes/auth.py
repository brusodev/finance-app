"""Autenticação - Rotas de registro e login"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..utils import verify_password

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registrar novo usuário.
    
    - username: nome de usuário único
    - password: senha (será criptografada)
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username já está em uso"
        )
    return crud.create_user(db=db, user=user)


@router.post("/login", response_model=schemas.User)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Login de usuário.
    
    Retorna dados do usuário se credenciais forem válidas.
    Em produção, retornaria JWT token.
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou password inválidos"
        )
    
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou password inválidos"
        )
    
    return db_user
