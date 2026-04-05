"""Autenticação - Rotas de registro e login"""

from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Response
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from .. import crud, schemas
from ..database import get_db
from ..utils import verify_password, hash_password, is_legacy_hash
import os

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY não definida. "
        "Configure a variável de ambiente SECRET_KEY."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas

COOKIE_NAME = "access_token"
IS_PRODUCTION = os.getenv("ENVIRONMENT", "production") == "production"


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=IS_PRODUCTION,   # HTTPS only em produção
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )


def get_current_user(
    access_token: str = Cookie(default=None),
    db: Session = Depends(get_db)
) -> schemas.User:
    """
    Extrair usuário atual do cookie httpOnly 'access_token'.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Não autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user(db, user_id=int(user_id))
    if not user:
        raise credentials_exception

    return user


@router.post(
    "/register",
    response_model=schemas.User,
    status_code=status.HTTP_201_CREATED,
)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registrar novo usuário.

    - username: nome de usuário único
    - password: senha (será criptografada com bcrypt)
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username já está em uso"
        )
    return crud.create_user(db=db, user=user)


@router.post("/login", response_model=schemas.UserOnly)
def login(
    user: schemas.UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login de usuário. Define cookie httpOnly com JWT válido por 24 horas.
    """
    db_user = crud.get_user_by_username(db, username=user.username)
    valid = db_user and verify_password(user.password, db_user.hashed_password)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou password inválidos"
        )

    # Migração automática: se o hash ainda é PBKDF2 legado, atualiza para bcrypt
    if is_legacy_hash(db_user.hashed_password):
        db_user.hashed_password = hash_password(user.password)
        db.commit()

    token = create_access_token(user_id=db_user.id)
    _set_auth_cookie(response, token)

    return db_user


@router.post("/logout")
def logout(response: Response):
    """Encerra a sessão removendo o cookie de autenticação."""
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="strict")
    return {"message": "Logout realizado com sucesso"}


@router.get("/me", response_model=schemas.User)
def me(current_user: schemas.User = Depends(get_current_user)):
    """Retorna os dados do usuário autenticado via cookie."""
    return current_user


@router.post("/change-password")
def change_password(
    password_data: dict,
    response: Response,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """
    Alterar senha do usuário autenticado.

    Requer: current_password, new_password
    """
    if not verify_password(
        password_data.get("current_password", ""),
        current_user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha atual incorreta"
        )

    db_user = crud.get_user(db, user_id=current_user.id)
    new_pw = password_data.get("new_password", "")
    db_user.hashed_password = hash_password(new_pw)
    db.commit()

    # Rota o token após troca de senha
    new_token = create_access_token(user_id=current_user.id)
    _set_auth_cookie(response, new_token)

    return {"message": "Senha alterada com sucesso"}
