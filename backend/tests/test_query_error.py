"""
Teste especifico das queries que estao falhando no Railway
"""
from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import Session
import sys
import os

# Adicionar o diretorio app ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.database import SessionLocal
from app.models import Transaction, Category, Account, User
from app import crud

# Conectar ao banco Railway
DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)

print("=" * 60)
print("TESTE DAS QUERIES QUE ESTAO FALHANDO")
print("=" * 60)

# Usar Session do SQLAlchemy ORM
from sqlalchemy.orm import sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

with SessionLocal() as db:
    print("\n1. TESTE: /dashboard/summary")
    print("-" * 60)
    try:
        # Simular exatamente o codigo do endpoint
        user_id = 1

        total_accounts = db.query(func.count(Account.id)).filter(
            Account.user_id == user_id,
            Account.is_active == True
        ).scalar() or 0
        print(f"   Total Accounts: {total_accounts}")

        total_balance = db.query(func.sum(Account.balance)).filter(
            Account.user_id == user_id,
            Account.is_active == True
        ).scalar() or 0.0
        print(f"   Total Balance: R$ {total_balance:.2f}")

        total_categories = db.query(func.count(Category.id)).filter(
            Category.user_id == user_id
        ).scalar() or 0
        print(f"   Total Categories: {total_categories}")

        total_transactions = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user_id
        ).scalar() or 0
        print(f"   Total Transactions: {total_transactions}")

        income_result = db.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == 'income'
        ).scalar() or 0.0
        print(f"   Total Income: R$ {income_result:.2f}")

        expense_result = db.query(func.sum(func.abs(Transaction.amount))).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == 'expense'
        ).scalar() or 0.0
        print(f"   Total Expense: R$ {expense_result:.2f}")

        # Buscar ultimas 10 transacoes
        from sqlalchemy.orm import joinedload
        recent_transactions = db.query(Transaction).options(
            joinedload(Transaction.category),
            joinedload(Transaction.account)
        ).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.date.desc()).limit(10).all()

        print(f"   Recent Transactions: {len(recent_transactions)} encontradas")

        print("   OK - Dashboard Summary funciona!")

    except Exception as e:
        print(f"   ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    print("\n2. TESTE: /transactions/totals/by-category")
    print("-" * 60)
    try:
        user_id = 1

        results = db.query(
            Transaction.category_id,
            Category.name.label('category_name'),
            func.sum(
                func.case(
                    (Transaction.transaction_type == 'income',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                func.case(
                    (Transaction.transaction_type == 'expense',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_expense'),
            func.count(Transaction.id).label('transaction_count')
        ).join(
            Category, Transaction.category_id == Category.id
        ).filter(
            Transaction.user_id == user_id
        ).group_by(
            Transaction.category_id, Category.name
        ).all()

        print(f"   Categorias encontradas: {len(results)}")
        for row in results[:5]:
            print(f"   - {row.category_name}: Income=R$ {row.total_income:.2f}, Expense=R$ {row.total_expense:.2f}")

        print("   OK - By Category funciona!")

    except Exception as e:
        print(f"   ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    print("\n3. TESTE: /transactions/totals/by-period")
    print("-" * 60)
    try:
        from datetime import date
        user_id = 1
        start_date = date(2025, 12, 1)
        end_date = date(2025, 12, 31)

        results = db.query(
            func.date_trunc('month', Transaction.date).label('period'),
            func.sum(
                func.case(
                    (Transaction.transaction_type == 'income',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                func.case(
                    (Transaction.transaction_type == 'expense',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_expense'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            Transaction.user_id == user_id,
            Transaction.date >= start_date,
            Transaction.date <= end_date
        ).group_by(
            func.date_trunc('month', Transaction.date)
        ).order_by(
            func.date_trunc('month', Transaction.date)
        ).all()

        print(f"   Periodos encontrados: {len(results)}")
        for row in results:
            print(f"   - {row.period}: Income=R$ {row.total_income:.2f}, Expense=R$ {row.total_expense:.2f}")

        print("   OK - By Period funciona!")

    except Exception as e:
        print(f"   ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("TESTE COMPLETO")
print("=" * 60)
