"""
Script de migração para adicionar novos campos à tabela users
Execute este script para atualizar o banco de dados existente
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Obter URL do banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")

# Criar engine
engine = create_engine(DATABASE_URL)

# Definir comandos SQL para adicionar as novas colunas (SQLite não suporta IF NOT EXISTS em ALTER)
migrations = [
    "ALTER TABLE users ADD COLUMN cpf VARCHAR",
    "ALTER TABLE users ADD COLUMN phone VARCHAR",
    "ALTER TABLE users ADD COLUMN birth_date DATE",
    "ALTER TABLE users ADD COLUMN address VARCHAR",
]

print("Iniciando migracao do banco de dados...")

try:
    with engine.begin() as conn:  # Usar begin() ao invés de connect()
        for migration in migrations:
            try:
                conn.execute(text(migration))
                print(f"Executado: {migration}")
            except Exception as e:
                print(f"Aviso (coluna pode ja existir): {migration} - {str(e)}")

    print("Migracao concluida com sucesso!")

except Exception as e:
    print(f"Erro na migracao: {str(e)}")
    raise
