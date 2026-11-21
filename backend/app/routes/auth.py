"""Autenticação - Rotas de registro e login"""

import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Response, Request
import jwt
from jwt import PyJWTError as JWTError
from sqlalchemy.orm import Session
from .. import crud, models, schemas
from ..database import get_db
from ..utils import verify_password, hash_password, is_legacy_hash
from ..security import login_limiter, client_ip
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
# Cadastro público desligado por padrão; ligue com REGISTRATION_ENABLED=true.
REGISTRATION_ENABLED = os.getenv("REGISTRATION_ENABLED", "false").lower() in ("1", "true", "yes")
MIN_PASSWORD_LENGTH = 8


def create_access_token(user_id: int, token_version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "jti": uuid.uuid4().hex,       # permite revogar este token (logout)
        "ver": int(token_version or 0),  # troca de senha invalida os antigos
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def _is_revoked(db: Session, jti) -> bool:
    if not jti:
        return False
    return db.get(models.RevokedToken, jti) is not None


def revoke_token(db: Session, payload: dict) -> None:
    """Põe o token na lista de bloqueio até ele expirar sozinho."""
    jti = payload.get("jti")
    if not jti or _is_revoked(db, jti):
        return
    exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc).replace(tzinfo=None)
    db.add(models.RevokedToken(jti=jti, expires_at=exp))
    # Limpa entradas vencidas (o token já não seria aceito mesmo).
    db.query(models.RevokedToken).filter(
        models.RevokedToken.expires_at < datetime.utcnow()
    ).delete(synchronize_session=False)
    db.commit()


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
        payload = _decode(access_token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = crud.get_user(db, user_id=int(user_id))
    if not user:
        raise credentials_exception
    if int(payload.get("ver", 0)) != int(user.token_version or 0):
        raise credentials_exception
    if _is_revoked(db, payload.get("jti")):
        raise credentials_exception

    return user


@router.post(
    "/register",
    response_model=schemas.User,
    status_code=status.HTTP_201_CREATED,
)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registrar novo usuário (só se REGISTRATION_ENABLED=true).

    - username: nome de usuário único
    - password: senha (será criptografada com bcrypt)
    """
    if not REGISTRATION_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cadastro de novos usuários está desativado"
        )
    if len(user.password or "") < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A senha deve ter pelo menos {MIN_PASSWORD_LENGTH} caracteres"
        )
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
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login de usuário. Define cookie httpOnly com JWT válido por 24 horas.
    Muitas falhas seguidas (por usuário ou IP) bloqueiam por um tempo.
    """
    ip = client_ip(request)
    wait = login_limiter.retry_after(user.username, ip)
    if wait:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas de login. Tente de novo em {max(wait // 60, 1)} min.",
            headers={"Retry-After": str(wait)},
        )

    db_user = crud.get_user_by_username(db, username=user.username)
    valid = db_user and verify_password(user.password, db_user.hashed_password)
    if not valid:
        login_limiter.record_failure(user.username, ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username ou password inválidos"
        )
    login_limiter.record_success(user.username, ip)

    # Migração automática: se o hash ainda é PBKDF2 legado, atualiza para bcrypt
    if is_legacy_hash(db_user.hashed_password):
        db_user.hashed_password = hash_password(user.password)
        db.commit()

    token = create_access_token(user_id=db_user.id, token_version=db_user.token_version)
    _set_auth_cookie(response, token)

    return db_user


@router.post("/logout")
def logout(
    response: Response,
    access_token: str = Cookie(default=None),
    db: Session = Depends(get_db),
):
    """Encerra a sessão: revoga o token no servidor e remove o cookie."""
    if access_token:
        try:
            revoke_token(db, _decode(access_token))
        except JWTError:
            pass  # token inválido/expirado: nada a revogar
    response.delete_cookie(
        key=COOKIE_NAME, path="/", samesite="lax",
        secure=IS_PRODUCTION, httponly=True,
    )
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
    if len(new_pw) < MIN_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A nova senha deve ter pelo menos {MIN_PASSWORD_LENGTH} caracteres"
        )
    db_user.hashed_password = hash_password(new_pw)
    # Derruba todas as sessões abertas (outros aparelhos, tokens copiados).
    db_user.token_version = int(db_user.token_version or 0) + 1
    db.commit()

    # Rota o token após troca de senha
    new_token = create_access_token(user_id=current_user.id, token_version=db_user.token_version)
    _set_auth_cookie(response, new_token)

    return {"message": "Senha alterada com sucesso"}
