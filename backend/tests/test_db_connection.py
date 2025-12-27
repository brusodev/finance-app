# -*- coding: utf-8 -*-
"""
Script para testar conexao com o banco de dados
Verifica se consegue conectar ao PostgreSQL do Railway
"""

import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Garantir encoding UTF-8 no Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Carregar variaveis de ambiente
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("=" * 80)
print("TESTE DE CONEXAO COM BANCO DE DADOS")
print("=" * 80)

if not DATABASE_URL:
    print("\n[ERRO] DATABASE_URL nao encontrada no arquivo .env")
    print("\nCrie um arquivo .env com:")
    print("DATABASE_URL=postgresql://user:password@host:port/database")
    sys.exit(1)

# Ocultar senha no print
try:
    safe_url = DATABASE_URL.replace(DATABASE_URL.split("@")[0].split("//")[1], "***:***")
    print(f"\n[INFO] Database URL: {safe_url}")
except:
    print(f"\n[INFO] Conectando ao banco de dados...")

# Tentar conectar
print("\n[INFO] Tentando estabelecer conexao...")

try:
    # Criar engine com SSL para PostgreSQL
    if "postgresql" in DATABASE_URL:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"sslmode": "require"}
        )
    else:
        engine = create_engine(DATABASE_URL)

    # Testar conexao
    with engine.connect() as connection:
        # Executar query simples
        result = connection.execute(text("SELECT version();"))
        version = result.fetchone()[0]

        print("\n[OK] CONEXAO ESTABELECIDA COM SUCESSO!")
        print(f"\n[INFO] Versao do PostgreSQL:")
        print(f"   {version}")

        # Verificar tabelas existentes
        result = connection.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """))

        tables = [row[0] for row in result.fetchall()]

        print(f"\n[INFO] Tabelas encontradas: {len(tables)}")
        if tables:
            for table in tables:
                print(f"   - {table}")
        else:
            print("   (Nenhuma tabela encontrada - banco novo)")

        # Contar registros em cada tabela
        if tables:
            print(f"\n[INFO] Contagem de registros:")
            for table in tables:
                try:
                    result = connection.execute(text(f"SELECT COUNT(*) FROM {table};"))
                    count = result.fetchone()[0]
                    print(f"   {table}: {count} registros")
                except Exception as e:
                    print(f"   {table}: Erro ao contar - {str(e)[:50]}")

        # Verificar colunas da tabela accounts (se existir)
        if "accounts" in tables:
            print(f"\n[INFO] Estrutura da tabela 'accounts':")
            result = connection.execute(text("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'accounts'
                ORDER BY ordinal_position;
            """))

            for row in result.fetchall():
                nullable = "NULL" if row[2] == "YES" else "NOT NULL"
                print(f"   - {row[0]:20} {row[1]:20} {nullable}")

        # Verificar usuarios
        if "users" in tables:
            result = connection.execute(text("SELECT COUNT(*) FROM users;"))
            user_count = result.fetchone()[0]
            print(f"\n[INFO] Total de usuarios cadastrados: {user_count}")

        print(f"\n{'='*80}")
        print("[OK] TUDO FUNCIONANDO! Voce pode usar o banco de dados.")
        print("="*80)
        print("\n[NEXT] Para usar localmente:")
        print("   1. Certifique-se que o .env esta configurado")
        print("   2. Execute: uvicorn app.main:app --reload")
        print("   3. Seu backend local usara o banco do Railway\n")

except OperationalError as e:
    print("\n[ERRO] ERRO DE CONEXAO!")
    print(f"\nDetalhes: {str(e)}")
    print("\n[FIX] Possiveis solucoes:")
    print("   1. Verifique se a DATABASE_URL esta correta no .env")
    print("   2. Verifique sua conexao com a internet")
    print("   3. Verifique se o Railway esta online")
    print("   4. Verifique se o IP nao esta bloqueado")
    print("\n[INFO] Formato esperado da DATABASE_URL:")
    print("   postgresql://user:password@host:port/database\n")
    sys.exit(1)

except Exception as e:
    print(f"\n[ERRO] ERRO INESPERADO: {str(e)}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)
