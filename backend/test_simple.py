# -*- coding: utf-8 -*-
"""
Script simples de teste - compativel com Windows
"""

import requests
import json
from datetime import datetime

API_URL = "http://localhost:8000"

print("=" * 80)
print("TESTE DAS FUNCIONALIDADES DA API")
print("=" * 80)

# Contadores
passed = 0
failed = 0
tests = []

def test(name, condition, details=""):
    global passed, failed
    if condition:
        print(f"[OK] {name}")
        passed += 1
        tests.append(("PASS", name, ""))
    else:
        print(f"[FAIL] {name}")
        if details:
            print(f"  -> {details}")
        failed += 1
        tests.append(("FAIL", name, details))

# Criar usuario de teste
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
username = f"test_{timestamp}"
password = "Test123!"

print("\n1. AUTENTICACAO")
print("-" * 80)

# Registro
token = None
try:
    r = requests.post(f"{API_URL}/auth/register", json={
        "username": username,
        "password": password,
        "email": f"{username}@test.com",
        "full_name": "Test User"
    })
    test("Registro de usuario", r.status_code == 201, f"Status: {r.status_code}")
except Exception as e:
    test("Registro de usuario", False, str(e))

# Login
try:
    r = requests.post(f"{API_URL}/auth/login", json={
        "username": username,
        "password": password
    })
    test("Login com credenciais corretas", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        token = r.json().get("token")  # Campo correto é "token" não "access_token"
except Exception as e:
    test("Login com credenciais corretas", False, str(e))

# Login com senha errada
try:
    r = requests.post(f"{API_URL}/auth/login", json={
        "username": username,
        "password": "senhaerrada"
    })
    test("Rejeicao de senha incorreta", r.status_code == 401, f"Status: {r.status_code}")
except Exception as e:
    test("Rejeicao de senha incorreta", False, str(e))

if not token:
    print("\n[ERRO] Nao foi possivel obter token. Abortando testes.")
    exit(1)

headers = {"Authorization": f"Bearer {token}"}

print("\n2. PERFIL DE USUARIO")
print("-" * 80)

# Obter perfil
try:
    r = requests.get(f"{API_URL}/users/profile", headers=headers)
    test("Obter perfil do usuario", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        profile = r.json()
        test("Username correto no perfil", profile.get("username") == username)
except Exception as e:
    test("Obter perfil do usuario", False, str(e))

# Atualizar perfil
try:
    r = requests.put(f"{API_URL}/users/profile", headers=headers, json={
        "full_name": "Test User Updated",
        "phone": "+5511999999999"
    })
    test("Atualizar perfil", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        profile = r.json()
        test("Nome atualizado corretamente", profile.get("full_name") == "Test User Updated")
        test("Telefone atualizado corretamente", profile.get("phone") == "+5511999999999")
except Exception as e:
    test("Atualizar perfil", False, str(e))

print("\n3. CATEGORIAS")
print("-" * 80)

# Listar categorias
try:
    r = requests.get(f"{API_URL}/categories/", headers=headers)
    test("Listar categorias", r.status_code == 200, f"Status: {r.status_code}")
    categories = r.json() if r.status_code == 200 else []
except Exception as e:
    test("Listar categorias", False, str(e))
    categories = []

# Criar categoria
category_id = None
try:
    r = requests.post(f"{API_URL}/categories/", headers=headers, json={
        "name": f"Categoria Teste {timestamp}",
        "icon": "🧪",
        "color": "#FF5733"
    })
    test("Criar categoria", r.status_code == 201, f"Status: {r.status_code}")
    if r.status_code == 201:
        category = r.json()
        category_id = category.get("id")
        test("Categoria tem ID", category_id is not None)
        test("Nome da categoria correto", category.get("name") == f"Categoria Teste {timestamp}")
except Exception as e:
    test("Criar categoria", False, str(e))

# Sugestoes de categorias
try:
    r = requests.get(f"{API_URL}/categories/suggestions", headers=headers)
    test("Obter sugestoes de categorias", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Obter sugestoes de categorias", False, str(e))

# Atualizar categoria
if category_id:
    try:
        r = requests.put(f"{API_URL}/categories/{category_id}", headers=headers, json={
            "name": f"Categoria Atualizada {timestamp}",
            "icon": "🔬",
            "color": "#00FF00"
        })
        test("Atualizar categoria", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            category = r.json()
            test("Nome atualizado corretamente", category.get("name") == f"Categoria Atualizada {timestamp}")
    except Exception as e:
        test("Atualizar categoria", False, str(e))

print("\n4. CONTAS")
print("-" * 80)

# Criar conta
account_id = None
try:
    r = requests.post(f"{API_URL}/accounts/", headers=headers, json={
        "name": f"Conta Teste {timestamp}",
        "account_type": "checking",
        "initial_balance": 1000.00,
        "currency": "BRL"
    })
    test("Criar conta", r.status_code == 201, f"Status: {r.status_code}")
    if r.status_code == 201:
        account = r.json()
        account_id = account.get("id")
        test("Conta tem ID", account_id is not None)
        test("Initial balance correto", account.get("initial_balance") == 1000.00)
        test("Balance inicial = Initial balance", account.get("balance") == account.get("initial_balance"))
except Exception as e:
    test("Criar conta", False, str(e))

# Sugestoes de contas
try:
    r = requests.get(f"{API_URL}/accounts/suggestions", headers=headers)
    test("Obter sugestoes de contas", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Obter sugestoes de contas", False, str(e))

# Auditoria de conta
if account_id:
    try:
        r = requests.get(f"{API_URL}/accounts/{account_id}/audit", headers=headers)
        test("Auditoria de conta", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            audit = r.json()
            test("Saldo consistente", audit.get("is_consistent") == True)
    except Exception as e:
        test("Auditoria de conta", False, str(e))

# Atualizar conta
if account_id:
    try:
        r = requests.put(f"{API_URL}/accounts/{account_id}", headers=headers, json={
            "name": f"Conta Atualizada {timestamp}"
        })
        test("Atualizar conta", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            account = r.json()
            test("Nome atualizado", account.get("name") == f"Conta Atualizada {timestamp}")
            test("Initial balance preservado", account.get("initial_balance") == 1000.00)
    except Exception as e:
        test("Atualizar conta", False, str(e))

print("\n5. TRANSACOES")
print("-" * 80)

transaction_id = None
if category_id and account_id:
    # Criar transacao de despesa
    try:
        r = requests.post(f"{API_URL}/transactions/", headers=headers, json={
            "amount": -150.50,
            "date": "2025-12-06",
            "description": "Teste de despesa",
            "transaction_type": "expense",
            "category_id": category_id,
            "account_id": account_id
        })
        test("Criar transacao de despesa", r.status_code == 201, f"Status: {r.status_code}")
        if r.status_code == 201:
            transaction = r.json()
            transaction_id = transaction.get("id")

            # Verificar saldo atualizado
            r2 = requests.get(f"{API_URL}/accounts/{account_id}", headers=headers)
            if r2.status_code == 200:
                account = r2.json()
                expected_balance = 1000.00 - 150.50
                actual_balance = account.get("balance")
                test("Saldo atualizado apos despesa", abs(actual_balance - expected_balance) < 0.01,
                     f"Esperado: {expected_balance}, Atual: {actual_balance}")
    except Exception as e:
        test("Criar transacao de despesa", False, str(e))

    # Criar transacao de receita
    try:
        r = requests.post(f"{API_URL}/transactions/", headers=headers, json={
            "amount": 500.00,
            "date": "2025-12-06",
            "description": "Teste de receita",
            "transaction_type": "income",
            "category_id": category_id,
            "account_id": account_id
        })
        test("Criar transacao de receita", r.status_code == 201, f"Status: {r.status_code}")
        if r.status_code == 201:
            # Verificar saldo atualizado
            r2 = requests.get(f"{API_URL}/accounts/{account_id}", headers=headers)
            if r2.status_code == 200:
                account = r2.json()
                expected_balance = 1000.00 - 150.50 + 500.00
                actual_balance = account.get("balance")
                test("Saldo atualizado apos receita", abs(actual_balance - expected_balance) < 0.01,
                     f"Esperado: {expected_balance}, Atual: {actual_balance}")
    except Exception as e:
        test("Criar transacao de receita", False, str(e))

    # Sugestoes de descricoes
    try:
        r = requests.get(f"{API_URL}/transactions/suggestions/descriptions?limit=10", headers=headers)
        test("Sugestoes de descricoes", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Sugestoes de descricoes", False, str(e))

    # Deletar transacao
    if transaction_id:
        try:
            # Salvar saldo antes
            r = requests.get(f"{API_URL}/accounts/{account_id}", headers=headers)
            balance_before = r.json().get("balance") if r.status_code == 200 else 0

            r = requests.delete(f"{API_URL}/transactions/{transaction_id}", headers=headers)
            test("Deletar transacao", r.status_code in [200, 204], f"Status: {r.status_code}")

            # Verificar saldo revertido
            r2 = requests.get(f"{API_URL}/accounts/{account_id}", headers=headers)
            if r2.status_code == 200:
                account = r2.json()
                # Saldo deve ter aumentado em 150.50 (transacao removida)
                expected_balance = balance_before + 150.50
                actual_balance = account.get("balance")
                test("Saldo revertido apos deletar", abs(actual_balance - expected_balance) < 0.01,
                     f"Antes: {balance_before}, Depois: {actual_balance}, Esperado: {expected_balance}")
        except Exception as e:
            test("Deletar transacao", False, str(e))

print("\n6. SEGURANCA")
print("-" * 80)

# Acesso sem token
try:
    r = requests.get(f"{API_URL}/accounts/")
    test("Rejeicao sem token", r.status_code == 401, f"Status: {r.status_code}")
except Exception as e:
    test("Rejeicao sem token", False, str(e))

# Token invalido
try:
    r = requests.get(f"{API_URL}/accounts/", headers={"Authorization": "Bearer token_invalido"})
    test("Rejeicao de token invalido", r.status_code == 401, f"Status: {r.status_code}")
except Exception as e:
    test("Rejeicao de token invalido", False, str(e))

# Recurso inexistente
try:
    r = requests.get(f"{API_URL}/accounts/99999", headers=headers)
    test("Rejeicao de recurso inexistente", r.status_code == 404, f"Status: {r.status_code}")
except Exception as e:
    test("Rejeicao de recurso inexistente", False, str(e))

# RELATORIO FINAL
print("\n" + "=" * 80)
print("RELATORIO FINAL")
print("=" * 80)

total = passed + failed
success_rate = (passed / total * 100) if total > 0 else 0

print(f"\nTotal de testes: {total}")
print(f"[OK] Passaram: {passed}")
print(f"[FAIL] Falharam: {failed}")
print(f"Taxa de sucesso: {success_rate:.1f}%")

if failed > 0:
    print(f"\nBUGS ENCONTRADOS ({failed}):")
    for status, name, details in tests:
        if status == "FAIL":
            print(f"  - {name}")
            if details:
                print(f"    {details}")
else:
    print("\nNenhum bug encontrado! API funcionando perfeitamente.")

print("\n" + "=" * 80)
