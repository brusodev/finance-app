#!/usr/bin/env python
"""Script para verificar e criar usuários de teste"""

import sys
sys.path.insert(0, '.')

from app.database import SessionLocal
from app import models, crud, schemas
from app.utils import hash_password

db = SessionLocal()

# Listar usuários existentes
print("=== USUÁRIOS EXISTENTES ===")
users = db.query(models.User).all()
if users:
    for u in users:
        print(f"ID: {u.id}, Username: {u.username}, Email: {u.email}")
else:
    print("Nenhum usuário encontrado")

# Criar usuário de teste se não existir
print("\n=== CRIANDO USUÁRIO DE TESTE ===")
test_user = db.query(models.User).filter(models.User.username == "bruno").first()
if test_user:
    print(f"Usuário 'bruno' já existe (ID: {test_user.id})")
else:
    print("Criando usuário 'bruno'...")
    user_data = schemas.UserCreate(
        username="bruno",
        password="123456",
        email="bruno@example.com",
        full_name="Bruno Soares"
    )
    new_user = crud.create_user(db, user_data)
    print(f"Usuário criado: {new_user.username} (ID: {new_user.id})")

db.close()
print("\n✅ Operação concluída!")
