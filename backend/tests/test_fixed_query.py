"""
Teste da query corrigida com case() em vez de func.case()
"""
from sqlalchemy import create_engine, func, case
from sqlalchemy.orm import Session, sessionmaker
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Transaction, Category

# Conectar ao banco Railway
DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("=" * 60)
print("TESTE DA QUERY CORRIGIDA")
print("=" * 60)

with SessionLocal() as db:
    print("\n1. TESTE: /transactions/totals/by-category (CORRIGIDO)")
    print("-" * 60)
    try:
        user_id = 1

        results = db.query(
            Transaction.category_id,
            Category.name.label('category_name'),
            func.sum(
                case(
                    (Transaction.transaction_type == 'income',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                case(
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

        print(f"   SUCESSO! Categorias encontradas: {len(results)}")
        for row in results[:5]:
            print(f"   - {row.category_name}: Income=R$ {row.total_income:.2f}, Expense=R$ {row.total_expense:.2f}")

    except Exception as e:
        print(f"   ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

    print("\n2. TESTE: /transactions/totals/by-period (CORRIGIDO)")
    print("-" * 60)
    try:
        from datetime import date
        from sqlalchemy import and_

        user_id = 1
        start_date = date(2025, 12, 1)
        end_date = date(2025, 12, 31)

        result = db.query(
            func.sum(
                case(
                    (Transaction.transaction_type == 'income',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_income'),
            func.sum(
                case(
                    (Transaction.transaction_type == 'expense',
                     func.abs(Transaction.amount)),
                    else_=0
                )
            ).label('total_expense'),
            func.count(Transaction.id).label('transaction_count')
        ).filter(
            and_(
                Transaction.user_id == user_id,
                Transaction.date >= start_date,
                Transaction.date <= end_date
            )
        ).first()

        print(f"   SUCESSO!")
        print(f"   Income: R$ {result.total_income:.2f}")
        print(f"   Expense: R$ {result.total_expense:.2f}")
        print(f"   Transactions: {result.transaction_count}")

    except Exception as e:
        print(f"   ERRO: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "=" * 60)
print("TESTES CONCLUIDOS")
print("=" * 60)
