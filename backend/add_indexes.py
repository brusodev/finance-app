#!/usr/bin/env python3
"""
Script para adicionar índices ao banco de dados existente.
Este script adiciona índices nas colunas críticas para melhorar performance.
"""

from sqlalchemy import create_engine, text, inspect
import os

# Configurar banco de dados
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./finance.db")
engine = create_engine(DATABASE_URL)

def index_exists(inspector, table_name, index_name):
    """Verifica se um índice já existe"""
    try:
        indexes = inspector.get_indexes(table_name)
        return any(idx['name'] == index_name for idx in indexes)
    except Exception:
        return False

def add_indexes():
    """Adiciona índices ao banco de dados"""
    print("Adicionando indices ao banco de dados...")

    inspector = inspect(engine)

    with engine.connect() as conn:
        # Índices para tabela transactions
        indexes = [
            ("ix_transactions_user_id", "CREATE INDEX IF NOT EXISTS ix_transactions_user_id ON transactions (user_id)"),
            ("ix_transactions_date", "CREATE INDEX IF NOT EXISTS ix_transactions_date ON transactions (date)"),
            ("ix_transactions_transaction_type", "CREATE INDEX IF NOT EXISTS ix_transactions_transaction_type ON transactions (transaction_type)"),
            ("ix_transactions_category_id", "CREATE INDEX IF NOT EXISTS ix_transactions_category_id ON transactions (category_id)"),
            ("ix_transactions_account_id", "CREATE INDEX IF NOT EXISTS ix_transactions_account_id ON transactions (account_id)"),
            ("ix_transactions_description", "CREATE INDEX IF NOT EXISTS ix_transactions_description ON transactions (description)"),
        ]

        for index_name, sql in indexes:
            try:
                if not index_exists(inspector, 'transactions', index_name):
                    print(f"  + Criando indice: {index_name}")
                    conn.execute(text(sql))
                    conn.commit()
                else:
                    print(f"  OK Indice ja existe: {index_name}")
            except Exception as e:
                print(f"  ERRO ao criar {index_name}: {e}")

        # Índices compostos para melhor performance em queries comuns
        composite_indexes = [
            ("ix_transactions_user_date", "CREATE INDEX IF NOT EXISTS ix_transactions_user_date ON transactions (user_id, date DESC)"),
            ("ix_transactions_user_type", "CREATE INDEX IF NOT EXISTS ix_transactions_user_type ON transactions (user_id, transaction_type)"),
            ("ix_transactions_user_category", "CREATE INDEX IF NOT EXISTS ix_transactions_user_category ON transactions (user_id, category_id)"),
        ]

        print("\nAdicionando indices compostos...")
        for index_name, sql in composite_indexes:
            try:
                if not index_exists(inspector, 'transactions', index_name):
                    print(f"  + Criando indice composto: {index_name}")
                    conn.execute(text(sql))
                    conn.commit()
                else:
                    print(f"  OK Indice composto ja existe: {index_name}")
            except Exception as e:
                print(f"  ERRO ao criar {index_name}: {e}")

    print("\nIndices adicionados com sucesso!")
    print("Performance das queries deve melhorar significativamente.")

if __name__ == "__main__":
    add_indexes()
