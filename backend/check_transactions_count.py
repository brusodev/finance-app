#!/usr/bin/env python3
"""Script para verificar quantas transações existem no banco"""

import os
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    # Contar transações
    result = conn.execute(text("SELECT COUNT(*) FROM transactions"))
    total = result.scalar()
    print(f"\nTotal de transações no banco: {total}")

    # Contar por usuário
    result = conn.execute(text("""
        SELECT user_id, COUNT(*) as count
        FROM transactions
        GROUP BY user_id
        ORDER BY count DESC
        LIMIT 5
    """))

    print("\nTop 5 usuários com mais transações:")
    for row in result:
        print(f"  User {row[0]}: {row[1]} transações")

    # Verificar tamanho médio
    result = conn.execute(text("""
        SELECT
            pg_size_pretty(pg_total_relation_size('transactions')) as table_size,
            COUNT(*) as row_count,
            pg_size_pretty(pg_total_relation_size('transactions')::numeric / COUNT(*)) as avg_row_size
        FROM transactions
    """))

    row = result.first()
    print(f"\nTamanho da tabela: {row[0]}")
    print(f"Total de linhas: {row[1]}")
    print(f"Tamanho médio por linha: {row[2]}")

    # Verificar índices
    result = conn.execute(text("""
        SELECT
            indexname,
            pg_size_pretty(pg_relation_size(indexname::regclass)) as size
        FROM pg_indexes
        WHERE tablename = 'transactions'
        ORDER BY indexname
    """))

    print("\nÍndices e seus tamanhos:")
    for row in result:
        print(f"  {row[0]}: {row[1]}")
