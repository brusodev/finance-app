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


@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Login de usuário.

    Retorna token e dados do usuário se credenciais forem válidas.
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

    # Gerar token simples (em produção seria JWT)
    token = f"token_{db_user.id}_{db_user.username}"

    return {
        "token": token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/change-password")
def change_password(
    password_data: dict,
    db: Session = Depends(get_db)
):
    """
    Alterar senha do usuário.

    Requer: current_password, new_password
    """
    # Em um caso real, você pegaria o user_id do token JWT
    user_id = 1

    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )

    if not verify_password(
        password_data.get('current_password'),
        db_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha atual incorreta"
        )

    # Atualizar com nova senha
    from ..utils import hash_password
    db_user.hashed_password = hash_password(password_data.get('new_password'))
    db.commit()

    return {"message": "Senha alterada com sucesso"}
