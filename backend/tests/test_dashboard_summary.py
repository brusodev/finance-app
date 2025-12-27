"""
Teste específico do endpoint /dashboard/summary
"""
from sqlalchemy import create_engine, func
from sqlalchemy.orm import Session, sessionmaker, joinedload
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Transaction, Category, Account, User
from app import schemas

# Conectar ao banco Railway
DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("=" * 60)
print("TESTE: /dashboard/summary")
print("=" * 60)

with SessionLocal() as db:
    user_id = 1

    try:
        # Stats
        print("\n1. Buscando stats...")
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

        # Recent transactions SEM joinedload (como está no código atual)
        print("\n2. Buscando transações recentes SEM joinedload...")
        recent_transactions = db.query(Transaction).filter(
            Transaction.user_id == user_id
        ).order_by(Transaction.date.desc()).limit(10).all()
        print(f"   Transações encontradas: {len(recent_transactions)}")

        # Serializar
        print("\n3. Serializando com schemas.Transaction.model_validate()...")
        transactions_data = []
        for i, t in enumerate(recent_transactions):
            try:
                serialized = schemas.Transaction.model_validate(t)
                transactions_data.append(serialized)
                print(f"   [{i+1}] OK - ID: {t.id}, Amount: {t.amount}")
            except Exception as e:
                print(f"   [{i+1}] ERRO ao serializar transaction {t.id}: {e}")
                print(f"        Category: {t.category}, Account: {t.account}")
                import traceback
                traceback.print_exc()

        print(f"\n   Total serializado: {len(transactions_data)}/{len(recent_transactions)}")

        # Montar resposta final
        print("\n4. Montando resposta final...")
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
        print("   ✅ Resposta montada com sucesso!")
        print(f"   Stats keys: {list(response['stats'].keys())}")
        print(f"   Recent transactions: {len(response['recent_transactions'])} items")

    except Exception as e:
        print(f"\n   ❌ ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("TESTE CONCLUÍDO")
print("=" * 60)
