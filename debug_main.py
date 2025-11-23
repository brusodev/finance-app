#!/usr/bin/env python
"""
Debug script - Verificar por que o servidor está fechando
"""
import sys
import os
import traceback

sys.path.insert(0, os.path.abspath('.'))
os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')

print("=" * 70)
print("DEBUG: Testando importação do main.py")
print("=" * 70)

try:
    print("\n1. Importando FastAPI...", flush=True)
    from fastapi import FastAPI
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n2. Importando CORSMiddleware...", flush=True)
    from fastapi.middleware.cors import CORSMiddleware
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n3. Importando rotas (auth)...", flush=True)
    from backend.app.routes import auth
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n4. Importando rotas (users)...", flush=True)
    from backend.app.routes import users
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n5. Importando rotas (categories)...", flush=True)
    from backend.app.routes import categories
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n6. Importando rotas (transactions)...", flush=True)
    from backend.app.routes import transactions
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n7. Importando database...", flush=True)
    from backend.app.database import engine, Base
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n8. Criando tabelas...", flush=True)
    Base.metadata.create_all(bind=engine)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n9. Criando app FastAPI...", flush=True)
    app = FastAPI(
        title='Finance App API',
        description='API para gerenciamento de finanças pessoais',
        version='0.1.0'
    )
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n10. Adicionando CORS middleware...", flush=True)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001'
        ],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n11. Incluindo rota auth...", flush=True)
    app.include_router(auth.router)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n12. Incluindo rota users...", flush=True)
    app.include_router(users.router)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n13. Incluindo rota categories...", flush=True)
    app.include_router(categories.router)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

try:
    print("\n14. Incluindo rota transactions...", flush=True)
    app.include_router(transactions.router)
    print("   ✓ OK", flush=True)
except Exception as e:
    print(f"   ✗ ERROR: {e}", flush=True)
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 70)
print("✅ TODOS OS IMPORTS E SETUP OK!")
print("=" * 70)
print("\nApp routes:")
for route in app.routes:
    print(f"  - {route.path} {route.methods if hasattr(route, 'methods') else 'N/A'}")
