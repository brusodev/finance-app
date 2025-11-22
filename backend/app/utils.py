"""Utilitários para aplicação Finance App"""

import hashlib
import os


def hash_password(password: str) -> str:
    """
    Hash uma senha usando SHA-256.
    
    NOTA: Em produção, usar bcrypt ou argon2!
    Esta é apenas para desenvolvimento.
    """
    salt = os.urandom(32)
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), salt, 100000
    )
    return salt.hex() + pwd_hash.hex()


def verify_password(password: str, hashed: str) -> bool:
    """
    Verificar se uma senha corresponde ao hash.
    
    NOTA: Em produção, usar bcrypt ou argon2!
    """
    salt = bytes.fromhex(hashed[:64])
    stored_hash = hashed[64:]
    pwd_hash = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), salt, 100000
    )
    return pwd_hash.hex() == stored_hash
