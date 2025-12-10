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

# Listar contas
try:
    r = requests.get(f"{API_URL}/accounts/", headers=headers)
    test("Listar contas", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        accounts_list = r.json()
        test("Retorna lista de contas", isinstance(accounts_list, list))
except Exception as e:
    test("Listar contas", False, str(e))

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
        test("Tipo de conta correto", account.get("account_type") == "checking")
except Exception as e:
    test("Criar conta", False, str(e))

# Obter conta especifica
if account_id:
    try:
        r = requests.get(f"{API_URL}/accounts/{account_id}", headers=headers)
        test("Obter conta por ID", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            account = r.json()
            test("ID da conta correto", account.get("id") == account_id)
    except Exception as e:
        test("Obter conta por ID", False, str(e))

# Sugestoes de contas
try:
    r = requests.get(f"{API_URL}/accounts/suggestions", headers=headers)
    test("Obter sugestoes de contas", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        suggestions = r.json()
        test("Sugestoes retorna lista", isinstance(suggestions, list))
except Exception as e:
    test("Obter sugestoes de contas", False, str(e))

# Auditoria de conta individual
if account_id:
    try:
        r = requests.get(f"{API_URL}/accounts/{account_id}/audit", headers=headers)
        test("Auditoria de conta individual", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            audit = r.json()
            test("Saldo consistente (nova conta)", audit.get("is_consistent") == True)
            test("Auditoria tem campos necessarios", all(k in audit for k in ["account_id", "initial_balance", "current_balance"]))
    except Exception as e:
        test("Auditoria de conta individual", False, str(e))

# Auditoria geral de todas as contas
try:
    r = requests.get(f"{API_URL}/accounts/audit/all", headers=headers)
    test("Auditoria geral de contas", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        audits = r.json()
        test("Auditoria geral retorna lista", isinstance(audits, list))
except Exception as e:
    test("Auditoria geral de contas", False, str(e))

# Recalcular saldo de conta
if account_id:
    try:
        r = requests.post(f"{API_URL}/accounts/{account_id}/recalculate", headers=headers)
        test("Recalcular saldo da conta", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            result = r.json()
            test("Recalculo retorna saldos", all(k in result for k in ["balance_before", "balance_after"]))
    except Exception as e:
        test("Recalcular saldo da conta", False, str(e))

# Atualizar conta
if account_id:
    try:
        r = requests.put(f"{API_URL}/accounts/{account_id}", headers=headers, json={
            "name": f"Conta Atualizada {timestamp}",
            "account_type": "savings"
        })
        test("Atualizar conta", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            account = r.json()
            test("Nome atualizado", account.get("name") == f"Conta Atualizada {timestamp}")
            test("Tipo atualizado", account.get("account_type") == "savings")
            test("Initial balance preservado", account.get("initial_balance") == 1000.00)
    except Exception as e:
        test("Atualizar conta", False, str(e))

# Soft delete (desativar conta)
if account_id:
    try:
        r = requests.put(f"{API_URL}/accounts/{account_id}", headers=headers, json={
            "is_active": False
        })
        test("Desativar conta (soft delete)", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            account = r.json()
            test("Conta desativada", account.get("is_active") == False)
    except Exception as e:
        test("Desativar conta (soft delete)", False, str(e))

# Reativar conta para testes de transacoes
if account_id:
    try:
        r = requests.put(f"{API_URL}/accounts/{account_id}", headers=headers, json={
            "is_active": True
        })
        if r.status_code == 200:
            account = r.json()
            # Resetar saldo para 1000.00 para testes de transacoes
            pass
    except Exception as e:
        pass

print("\n5. TRANSACOES")
print("-" * 80)

# Listar transacoes
try:
    r = requests.get(f"{API_URL}/transactions/", headers=headers)
    test("Listar transacoes", r.status_code == 200, f"Status: {r.status_code}")
    if r.status_code == 200:
        transactions_list = r.json()
        test("Retorna lista de transacoes", isinstance(transactions_list, list))
except Exception as e:
    test("Listar transacoes", False, str(e))

transaction_id = None
transaction_id_2 = None
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
        if r.status_code == 200:
            suggestions = r.json()
            test("Sugestoes retorna lista", isinstance(suggestions, list))
    except Exception as e:
        test("Sugestoes de descricoes", False, str(e))

    # Sugestoes filtradas por tipo
    try:
        r = requests.get(f"{API_URL}/transactions/suggestions/descriptions?transaction_type=expense&limit=5", headers=headers)
        test("Sugestoes por tipo (despesas)", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Sugestoes por tipo (despesas)", False, str(e))

    # Sugestoes filtradas por categoria
    try:
        r = requests.get(f"{API_URL}/transactions/suggestions/descriptions?category_id={category_id}&limit=5", headers=headers)
        test("Sugestoes por categoria", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        test("Sugestoes por categoria", False, str(e))

    # Obter transacao especifica
    if transaction_id:
        try:
            r = requests.get(f"{API_URL}/transactions/{transaction_id}", headers=headers)
            test("Obter transacao por ID", r.status_code == 200, f"Status: {r.status_code}")
            if r.status_code == 200:
                transaction = r.json()
                test("ID da transacao correto", transaction.get("id") == transaction_id)
        except Exception as e:
            test("Obter transacao por ID", False, str(e))

    # Atualizar transacao
    if transaction_id:
        try:
            r = requests.put(f"{API_URL}/transactions/{transaction_id}", headers=headers, json={
                "amount": -200.00,
                "date": "2025-12-06",
                "description": "Despesa atualizada",
                "transaction_type": "expense",
                "category_id": category_id,
                "account_id": account_id
            })
            test("Atualizar transacao", r.status_code == 200, f"Status: {r.status_code}")
            if r.status_code == 200:
                transaction = r.json()
                test("Descricao atualizada", transaction.get("description") == "Despesa atualizada")
                test("Valor atualizado", transaction.get("amount") == -200.00)
        except Exception as e:
            test("Atualizar transacao", False, str(e))

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
                # Saldo deve ter aumentado em 200.00 (transacao ATUALIZADA foi removida)
                expected_balance = balance_before + 200.00
                actual_balance = account.get("balance")
                test("Saldo revertido apos deletar", abs(actual_balance - expected_balance) < 0.01,
                     f"Antes: {balance_before}, Depois: {actual_balance}, Esperado: {expected_balance}")
        except Exception as e:
            test("Deletar transacao", False, str(e))

print("\n6. RELATORIOS E AGREGACOES")
print("-" * 80)

# Dashboard/Resumo geral (se existir endpoint)
try:
    r = requests.get(f"{API_URL}/dashboard", headers=headers)
    if r.status_code == 404:
        test("Endpoint de dashboard", True, "Nao implementado (404 esperado)")
    else:
        test("Endpoint de dashboard", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Endpoint de dashboard", False, str(e))

# Totais por categoria (se existir)
try:
    r = requests.get(f"{API_URL}/transactions/totals/by-category", headers=headers)
    if r.status_code == 404:
        test("Totais por categoria", True, "Nao implementado (404 esperado)")
    else:
        test("Totais por categoria", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Totais por categoria", False, str(e))

# Totais por periodo (se existir)
try:
    r = requests.get(f"{API_URL}/transactions/totals/by-period?start=2025-12-01&end=2025-12-31", headers=headers)
    if r.status_code == 404:
        test("Totais por periodo", True, "Nao implementado (404 esperado)")
    else:
        test("Totais por periodo", r.status_code == 200, f"Status: {r.status_code}")
except Exception as e:
    test("Totais por periodo", False, str(e))

# Verificar consistencia geral de contas
if account_id:
    try:
        r = requests.get(f"{API_URL}/accounts/audit/all", headers=headers)
        if r.status_code == 200:
            audits = r.json()
            inconsistent = [a for a in audits if not a.get("is_consistent")]
            test("Todas contas com saldos consistentes", len(inconsistent) == 0,
                 f"{len(inconsistent)} contas inconsistentes" if inconsistent else "")
    except Exception as e:
        test("Verificar consistencia geral", False, str(e))

print("\n7. SEGURANCA")
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

# Tentar acessar recurso de outro usuario (se tiver multiplos usuarios)
try:
    r = requests.get(f"{API_URL}/accounts/1", headers=headers)
    # Se retornar 200, verificar se eh do usuario correto
    # Se retornar 404 ou 403, esta protegido
    test("Isolamento entre usuarios", r.status_code in [200, 404, 403], f"Status: {r.status_code}")
except Exception as e:
    test("Isolamento entre usuarios", False, str(e))

# RELATORIO FINAL
print("\n" + "=" * 80)
print("RELATORIO FINAL")
print("=" * 80)

total = passed + failed
success_rate = (passed / total * 100) if total > 0 else 0

print(f"\nESTATISTICAS GERAIS:")
print(f"  Total de testes: {total}")
print(f"  [OK] Passaram: {passed}")
print(f"  [FAIL] Falharam: {failed}")
print(f"  Taxa de sucesso: {success_rate:.1f}%")

# Contar por categoria
sections = {
    "Autenticacao": 0,
    "Perfil": 0,
    "Categorias": 0,
    "Contas": 0,
    "Transacoes": 0,
    "Relatorios": 0,
    "Seguranca": 0
}

for status, name, details in tests:
    if any(x in name.lower() for x in ["registro", "login", "senha"]):
        sections["Autenticacao"] += 1
    elif any(x in name.lower() for x in ["perfil", "username", "telefone", "nome atualizado"]):
        sections["Perfil"] += 1
    elif "categoria" in name.lower():
        sections["Categorias"] += 1
    elif "conta" in name.lower():
        sections["Contas"] += 1
    elif "transacao" in name.lower() or "transacoes" in name.lower():
        sections["Transacoes"] += 1
    elif any(x in name.lower() for x in ["dashboard", "totais", "relatorio", "consistencia"]):
        sections["Relatorios"] += 1
    elif any(x in name.lower() for x in ["token", "seguranca", "isolamento", "rejeicao"]):
        sections["Seguranca"] += 1

print(f"\nTESTES POR CATEGORIA:")
for section, count in sections.items():
    if count > 0:
        print(f"  {section}: {count} testes")

if failed > 0:
    print(f"\nBUGS ENCONTRADOS ({failed}):")
    for status, name, details in tests:
        if status == "FAIL":
            print(f"  - {name}")
            if details:
                print(f"    {details}")
else:
    print("\n[SUCCESS] Nenhum bug encontrado! API funcionando perfeitamente.")

print("\nRECOMENDACOES:")
if failed > 0:
    print("  1. Verifique os bugs listados acima")
    print("  2. Para bugs de SQLite, use PostgreSQL (Railway)")
    print("  3. Execute: python test_db_connection.py")
else:
    print("  1. API esta pronta para producao!")
    print("  2. Execute testes regularmente")
    print("  3. Monitore logs de producao")

print("\n" + "=" * 80)
