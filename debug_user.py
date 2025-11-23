#!/usr/bin/env python
"""Debug script para testar criação de usuário"""
import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))

print("=" * 60, flush=True)
print("DEBUG: Testando criação de usuário", flush=True)
print("=" * 60, flush=True)

try:
    print("\n1. Importando database...", flush=True)
    from backend.app.database import SessionLocal, Base, engine
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n2. Importando schemas e CRUD...", flush=True)
    from backend.app import schemas, crud
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n3. Criando tabelas...", flush=True)
    Base.metadata.create_all(bind=engine)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n4. Criando sessão...", flush=True)
    db = SessionLocal()
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n5. Criando schema UserCreate...", flush=True)
    user_create = schemas.UserCreate(
        username="testuser_debug123",
        password="Password123"
    )
    print(f"   ✓ OK: {user_create.username}", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n6. Chamando crud.create_user()...", flush=True)
    user = crud.create_user(db=db, user=user_create)
    print(f"   ✓ OK: Usuário {user.username} criado", flush=True)
except Exception as e:
    print(f"   ✗ ERRO: {e}", flush=True)
    traceback.print_exc()
finally:
    db.close()

print("\n" + "=" * 60, flush=True)
print("✅ DEBUG CONCLUÍDO", flush=True)
print("=" * 60, flush=True)
