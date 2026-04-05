"""Utilitários para aplicação Finance App"""

import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash uma senha usando bcrypt."""
    return pwd_context.hash(password)


def _verify_legacy_pbkdf2(password: str, hashed: str) -> bool:
    """Verifica hash no formato legado: salt_hex(64) + hash_hex."""
    try:
        if len(hashed) < 65 or not all(c in '0123456789abcdef' for c in hashed):
            return False
        salt = bytes.fromhex(hashed[:64])
        stored = hashed[64:]
        computed = hashlib.pbkdf2_hmac(
            'sha256', password.encode('utf-8'), salt, 100000
        )
        return computed.hex() == stored
    except Exception:
        return False


def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica senha contra bcrypt (novo) ou PBKDF2 legado.
    Retorna (válido, é_legado) — se legado, o caller deve migrar o hash.
    """
    # Hashes bcrypt começam com $2b$ ou $2a$
    if hashed.startswith(('$2b$', '$2a$', '$2y$')):
        return pwd_context.verify(password, hashed)
    return _verify_legacy_pbkdf2(password, hashed)


def is_legacy_hash(hashed: str) -> bool:
    """Retorna True se o hash ainda está no formato PBKDF2 legado."""
    return not hashed.startswith(('$2b$', '$2a$', '$2y$'))
