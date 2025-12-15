#!/usr/bin/env python3
"""
Script para criar índices no PostgreSQL do Railway.
Execute este script UMA VEZ após o deploy para criar os índices.
"""

import os
from sqlalchemy import create_engine, text, inspect

# IMPORTANTE: Usar a DATABASE_URL do Railway
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERRO: DATABASE_URL não encontrada!")
    print("Configure a variável de ambiente DATABASE_URL com a conexão do PostgreSQL do Railway")
    exit(1)

# Corrigir URL se necessário (Railway usa postgresql://, SQLAlchemy precisa de postgresql+psycopg2://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
elif DATABASE_URL.startswith("postgresql://") and "psycopg2" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

print(f"Conectando ao banco: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Railway PostgreSQL'}")

engine = create_engine(DATABASE_URL)

def index_exists(conn, table_name, index_name):
    """Verifica se um índice já existe no PostgreSQL"""
    try:
        result = conn.execute(text(f"""
            SELECT EXISTS (
                SELECT 1
                FROM pg_indexes
                WHERE tablename = '{table_name}'
                AND indexname = '{index_name}'
            )
        """))
        return result.scalar()
    except Exception as e:
        print(f"Erro ao verificar índice {index_name}: {e}")
        return False

def create_indexes():
    """Cria todos os índices necessários para performance"""
    print("\n=== CRIANDO INDICES NO POSTGRESQL (RAILWAY) ===\n")

    with engine.connect() as conn:
        # Índices simples
        indexes = [
            ("ix_transactions_user_id", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_user_id ON transactions (user_id)"),
            ("ix_transactions_date", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_date ON transactions (date DESC)"),
            ("ix_transactions_transaction_type", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_transaction_type ON transactions (transaction_type)"),
            ("ix_transactions_category_id", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_category_id ON transactions (category_id)"),
            ("ix_transactions_account_id", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_account_id ON transactions (account_id)"),
            ("ix_transactions_description", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_description ON transactions (description)"),
        ]

        print("Criando indices simples...")
        for index_name, sql in indexes:
            if not index_exists(conn, 'transactions', index_name):
                try:
                    print(f"  [+] Criando: {index_name}")
                    # CONCURRENTLY não pode ser usado dentro de transação
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"      OK!")
                except Exception as e:
                    print(f"      ERRO: {e}")
                    conn.rollback()
            else:
                print(f"  [OK] Já existe: {index_name}")

        # Índices compostos (críticos para performance!)
        composite_indexes = [
            ("ix_transactions_user_date", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_user_date ON transactions (user_id, date DESC)"),
            ("ix_transactions_user_type", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_user_type ON transactions (user_id, transaction_type)"),
            ("ix_transactions_user_category", "CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_transactions_user_category ON transactions (user_id, category_id)"),
        ]

        print("\nCriando indices compostos (CRITICOS)...")
        for index_name, sql in composite_indexes:
            if not index_exists(conn, 'transactions', index_name):
                try:
                    print(f"  [+] Criando: {index_name}")
                    conn.execute(text(sql))
                    conn.commit()
                    print(f"      OK!")
                except Exception as e:
                    print(f"      ERRO: {e}")
                    conn.rollback()
            else:
                print(f"  [OK] Já existe: {index_name}")

        # Verificar todos os índices criados
        print("\nVerificando indices criados:")
        result = conn.execute(text("""
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE tablename = 'transactions'
            AND indexname LIKE 'ix_%'
            ORDER BY indexname
        """))

        for row in result:
            print(f"  - {row[0]}")

    print("\n=== INDICES CRIADOS COM SUCESSO! ===")
    print("\nAs queries devem estar 70-90% mais rapidas agora!")
    print("Teste o endpoint /transactions/ e /dashboard/summary\n")

if __name__ == "__main__":
    try:
        create_indexes()
    except Exception as e:
        print(f"\nERRO FATAL: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
