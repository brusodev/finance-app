"""
Script para testar endpoints do Railway e diagnosticar problemas
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Conectar ao banco Railway
DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)

print("=" * 60)
print("DIAGNÓSTICO DO BANCO DE DADOS RAILWAY")
print("=" * 60)

with Session(engine) as db:
    # Verificar usuários
    print("\n1. USUÁRIOS NO BANCO:")
    result = db.execute(text("SELECT id, username, email FROM users")).fetchall()
    for row in result:
        print(f"   ID: {row[0]}, Username: {row[1]}, Email: {row[2]}")

    # Verificar transações
    print("\n2. TOTAL DE TRANSAÇÕES:")
    count = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar()
    print(f"   Total: {count} transações")

    # Verificar categorias
    print("\n3. CATEGORIAS:")
    categories = db.execute(text("SELECT id, name, user_id FROM categories LIMIT 10")).fetchall()
    for cat in categories:
        print(f"   ID: {cat[0]}, Nome: {cat[1]}, User ID: {cat[2]}")

    # Verificar contas
    print("\n4. CONTAS:")
    accounts = db.execute(text("SELECT id, name, user_id, balance FROM accounts LIMIT 10")).fetchall()
    for acc in accounts:
        print(f"   ID: {acc[0]}, Nome: {acc[1]}, User ID: {acc[2]}, Saldo: {acc[3]}")

    # Verificar índices criados
    print("\n5. ÍNDICES CRIADOS:")
    indexes = db.execute(text("""
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'transactions'
        AND indexname LIKE 'ix_%'
        ORDER BY indexname
    """)).fetchall()
    for idx in indexes:
        print(f"   ✓ {idx[0]}")

    # Testar query que está dando erro
    print("\n6. TESTE DE QUERY AGREGADA (by-category):")
    try:
        result = db.execute(text("""
            SELECT
                t.category_id,
                c.name as category_name,
                SUM(CASE WHEN t.transaction_type = 'income' THEN ABS(t.amount) ELSE 0 END) as total_income,
                SUM(CASE WHEN t.transaction_type = 'expense' THEN ABS(t.amount) ELSE 0 END) as total_expense,
                COUNT(t.id) as transaction_count
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = 1
            GROUP BY t.category_id, c.name
            LIMIT 5
        """)).fetchall()
        for row in result:
            print(f"   Categoria: {row[1]}, Income: R$ {row[2]:.2f}, Expense: R$ {row[3]:.2f}")
    except Exception as e:
        print(f"   ❌ ERRO: {e}")

    # Testar query do dashboard
    print("\n7. TESTE DE QUERY DO DASHBOARD:")
    try:
        result = db.execute(text("""
            SELECT
                COUNT(DISTINCT a.id) as total_accounts,
                COUNT(DISTINCT c.id) as total_categories,
                COUNT(DISTINCT t.id) as total_transactions
            FROM accounts a
            CROSS JOIN categories c
            CROSS JOIN transactions t
            WHERE a.user_id = 1 AND c.user_id = 1 AND t.user_id = 1
        """)).fetchone()
        print(f"   Contas: {result[0]}, Categorias: {result[1]}, Transações: {result[2]}")
    except Exception as e:
        print(f"   ❌ ERRO: {e}")

print("\n" + "=" * 60)
print("DIAGNÓSTICO COMPLETO")
print("=" * 60)
