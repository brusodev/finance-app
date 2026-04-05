from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente do arquivo .env apenas fora do Docker
if os.getenv("ENVIRONMENT", "production") != "production":
    load_dotenv()

# SQLite para desenvolvimento local
# Sem necessidade de senha ou servidor externo
# Coloca o banco na pasta backend/ (onde este arquivo está)
BACKEND_DIR = Path(__file__).parent.parent

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR}/finance.db")

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10
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
