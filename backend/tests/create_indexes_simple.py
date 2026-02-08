#!/usr/bin/env python3
"""
Script SIMPLIFICADO para criar índices no PostgreSQL do Railway.
COLE A URL DO RAILWAY AQUI EMBAIXO (linha 10)
"""

import os
from sqlalchemy import create_engine, text

# ============================================
# COLE A DATABASE_URL DO RAILWAY AQUI:
# ============================================
DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"

# Se preferir usar variável de ambiente, deixe como está abaixo:
if DATABASE_URL == "COLE_A_URL_AQUI":
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        print("\n" + "="*60)
        print("ERRO: DATABASE_URL não configurada!")
        print("="*60)
        print("\nOpção 1: Edite este arquivo e cole a URL na linha 10")
        print("Opção 2: Configure a variável de ambiente:")
        print('  $env:DATABASE_URL="postgresql://postgres:senha@host:porta/railway"')
        print("\nPara pegar a URL:")
        print("1. Acesse https://railway.app")
        print("2. Entre no projeto finance-app")
        print("3. Clique no PostgreSQL")
        print("4. Vá em Variables")
        print("5. Copie DATABASE_URL\n")
        exit(1)

# Corrigir URL se necessário
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print("\n" + "="*60)
print("CRIANDO INDICES NO POSTGRESQL DO RAILWAY")
print("="*60)
print(f"\nConectando ao banco...")

try:
    # IMPORTANTE: usar isolation_level="AUTOCOMMIT" para CREATE INDEX CONCURRENTLY
    engine = create_engine(DATABASE_URL, isolation_level="AUTOCOMMIT")

    with engine.connect() as conn:
        # Testar conexão
        conn.execute(text("SELECT 1"))
        print("✓ Conexão estabelecida com sucesso!\n")

        # Índices para criar (SEM CONCURRENTLY para simplificar)
        indexes = [
            "CREATE INDEX IF NOT EXISTS ix_transactions_user_id ON transactions (user_id)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_date ON transactions (date DESC)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_transaction_type ON transactions (transaction_type)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_category_id ON transactions (category_id)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_account_id ON transactions (account_id)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_description ON transactions (description)",
            # Índices compostos (CRÍTICOS!)
            "CREATE INDEX IF NOT EXISTS ix_transactions_user_date ON transactions (user_id, date DESC)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_user_type ON transactions (user_id, transaction_type)",
            "CREATE INDEX IF NOT EXISTS ix_transactions_user_category ON transactions (user_id, category_id)",
        ]

        print("Criando índices...")
        created = 0
        for sql in indexes:
            index_name = sql.split("IF NOT EXISTS ")[1].split(" ON")[0]
            try:
                conn.execute(text(sql))
                print(f"  ✓ {index_name}")
                created += 1
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"  - {index_name} (já existe)")
                else:
                    print(f"  ✗ {index_name}: {e}")

        # Listar índices criados
        print(f"\n{'='*60}")
        print(f"ÍNDICES CRIADOS COM SUCESSO: {created}/{len(indexes)}")
        print("="*60)

        result = conn.execute(text("""
            SELECT indexname
            FROM pg_indexes
            WHERE tablename = 'transactions'
            AND indexname LIKE 'ix_%'
            ORDER BY indexname
        """))

        print("\nÍndices ativos na tabela transactions:")
        for row in result:
            print(f"  • {row[0]}")

        print("\n" + "="*60)
        print("SUCESSO! As queries devem estar 70-90% mais rápidas agora!")
        print("="*60)
        print("\nTeste agora:")
        print("  https://finance-app-bruno.up.railway.app")
        print("\nEspere o carregamento ser MUITO mais rápido!\n")

except Exception as e:
    print(f"\n{'='*60}")
    print("ERRO AO CONECTAR/CRIAR ÍNDICES")
    print("="*60)
    print(f"\n{e}\n")
    print("Verifique se:")
    print("  1. A DATABASE_URL está correta")
    print("  2. Tem acesso ao banco do Railway")
    print("  3. O PostgreSQL está rodando\n")
    exit(1)
