from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env
load_dotenv()

# SQLite para desenvolvimento local
# Sem necessidade de senha ou servidor externo
# Coloca o banco na pasta backend/ (onde este arquivo está)
BACKEND_DIR = Path(__file__).parent.parent
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR}/finance.db")

if "sqlite" in DATABASE_URL:
    # Para SQLite
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Para PostgreSQL (Railway ou outro servidor remoto)
    # Railway exige SSL
    engine = create_engine(
        DATABASE_URL,
        connect_args={"sslmode": "require"}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """
    Dependency para injetar a sessao do banco de dados
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
