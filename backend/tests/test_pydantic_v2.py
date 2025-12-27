"""
Teste final com Pydantic v2 from_attributes
"""
from sqlalchemy import create_engine, func
from sqlalchemy.orm import Session, sessionmaker, joinedload
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Transaction, Category, Account
from app import schemas

DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("="*60)
print("TESTE FINAL: /dashboard/summary COM PYDANTIC V2")
print("="*60)

with SessionLocal() as db:
    user_id = 1

    print("\n1. Buscando stats...")
    total_accounts = db.query(func.count(Account.id)).filter(
        Account.user_id == user_id,
        Account.is_active == True
    ).scalar() or 0

    total_balance = db.query(func.sum(Account.balance)).filter(
        Account.user_id == user_id,
        Account.is_active == True
    ).scalar() or 0.0

    total_categories = db.query(func.count(Category.id)).filter(
        Category.user_id == user_id
    ).scalar() or 0

    total_transactions = db.query(func.count(Transaction.id)).filter(
        Transaction.user_id == user_id
    ).scalar() or 0

    income_result = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'income'
    ).scalar() or 0.0

    expense_result = db.query(func.sum(func.abs(Transaction.amount))).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'expense'
    ).scalar() or 0.0

    print(f"   Accounts: {total_accounts}")
    print(f"   Balance: R$ {total_balance:.2f}")
    print(f"   Categories: {total_categories}")
    print(f"   Transactions: {total_transactions}")
    print(f"   Income: R$ {income_result:.2f}")
    print(f"   Expense: R$ {expense_result:.2f}")

    print("\n2. Buscando transacoes recentes COM joinedload...")
    recent_transactions = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.user)
    ).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc()).limit(10).all()

    print(f"   Encontradas: {len(recent_transactions)}")

    print("\n3. Serializando com model_validate() + from_attributes=True...")
    try:
        transactions_data = [
            schemas.Transaction.model_validate(t) for t in recent_transactions
        ]
        print(f"   SUCESSO! Serializadas: {len(transactions_data)} transacoes")

        for i, t_data in enumerate(transactions_data[:3]):
            print(f"   [{i+1}] ID: {t_data.id}, Amount: R$ {t_data.amount:.2f}, Category: {t_data.category.name}")

    except Exception as e:
        print(f"   ERRO: {e}")
        import traceback
        traceback.print_exc()

    print("\n4. Montando resposta final...")
    try:
        response = {
            "stats": {
                "total_accounts": total_accounts,
                "total_categories": total_categories,
                "total_transactions": total_transactions,
                "total_balance": float(total_balance),
                "total_income": float(income_result),
                "total_expense": float(expense_result),
                "net_balance": float(income_result) - float(expense_result)
            },
            "recent_transactions": transactions_data
        }
        print(f"   SUCESSO! Response keys: {list(response.keys())}")
        print(f"   Stats: {len(response['stats'])} campos")
        print(f"   Recent transactions: {len(response['recent_transactions'])} items")
        print("\n   OK - /dashboard/summary funciona perfeitamente!")

    except Exception as e:
        print(f"   ERRO: {e}")

print("\n" + "="*60)
print("TESTE CONCLUIDO")
print("="*60)
