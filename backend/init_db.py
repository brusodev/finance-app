# Script para inicializar o banco de dados SQLite
from app.database import engine, Base
import os
import sys
import traceback

sys.path.insert(0, os.path.dirname(__file__))

from app import models  # noqa: F401


def init_db():
    """Criar todas as tabelas no banco de dados"""
    print("[INFO] Iniciando banco de dados...")

    try:
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        print("[OK] Banco de dados criado com sucesso!")
        print("[OK] Arquivo: finance.db (na pasta backend/)")
        return True
    except Exception as e:
        print(f"[ERRO] Falha ao criar banco de dados: {e}")
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
