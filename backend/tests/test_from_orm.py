"""
Teste usando from_orm em vez de model_validate
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker, joinedload
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.models import Transaction
from app import schemas

DATABASE_URL = "postgresql://postgres:AipgyavIuQtKDvlGfycpkIgiVCYqkSxo@switchback.proxy.rlwy.net:25835/railway"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

print("="*60)
print("TESTE: from_orm() vs model_validate()")
print("="*60)

with SessionLocal() as db:
    user_id = 1

    print("\n1. Buscando transacoes COM joinedload...")
    recent_transactions = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.user)
    ).filter(
        Transaction.user_id == user_id
    ).order_by(Transaction.date.desc()).limit(10).all()

    print(f"   Encontradas: {len(recent_transactions)}")

    print("\n2. Serializando com from_orm()...")
    try:
        transactions_data = [
            schemas.Transaction.from_orm(t) for t in recent_transactions
        ]
        print(f"   SUCESSO! Serializadas: {len(transactions_data)} transacoes")

        for i, t_data in enumerate(transactions_data[:3]):
            print(f"   [{i+1}] ID: {t_data.id}, Amount: R$ {t_data.amount:.2f}, Category: {t_data.category.name}")

    except Exception as e:
        print(f"   ERRO: {e}")
        import traceback
        traceback.print_exc()

print("\n" + "="*60)
print("TESTE CONCLUIDO")
print("="*60)
