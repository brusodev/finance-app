"""Utilitários para aplicação Finance App"""

import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash uma senha usando bcrypt."""
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    """Verificar se uma senha corresponde ao hash bcrypt."""
    return pwd_context.verify(password, hashed)
