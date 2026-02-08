"""
Script de teste rápido - Testa endpoints principais rapidamente
"""

import requests
import json
from datetime import datetime
import sys

# Configurar URL
API_URL = input("Digite a URL da API (deixe vazio para http://localhost:8000): ").strip()
if not API_URL:
    API_URL = "http://localhost:8000"

print(f"\n🔗 Testando: {API_URL}\n")

def test_endpoint(method, endpoint, data=None, headers=None, name=""):
    """Testa um endpoint e mostra resultado"""
    url = f"{API_URL}{endpoint}"

    try:
        if method == "GET":
            r = requests.get(url, headers=headers)
        elif method == "POST":
            r = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            r = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers)

        status = "✅" if r.status_code < 400 else "❌"
        print(f"{status} {method:6} {endpoint:40} [{r.status_code}] {name}")

        if r.status_code >= 400:
            try:
                print(f"   Erro: {r.json()}")
            except:
                print(f"   Erro: {r.text}")

        return r
    except Exception as e:
        print(f"❌ {method:6} {endpoint:40} [ERRO] {str(e)}")
        return None

print("=" * 80)
print("TESTE RÁPIDO DE ENDPOINTS")
print("=" * 80)

# 1. AUTENTICAÇÃO
print("\n1️⃣  AUTENTICAÇÃO")
print("-" * 80)

# Tentar criar novo usuário para teste
timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
test_username = f"quicktest_{timestamp}"
test_password = "Test@123"

print("Criando usuário de teste temporário...")
r = test_endpoint("POST", "/auth/register",
    {
        "username": test_username,
        "password": test_password,
        "email": f"{test_username}@test.com",
        "full_name": "Quick Test User"
    },
    name="Registro")

# Login com usuário criado
r = test_endpoint("POST", "/auth/login",
    {"username": test_username, "password": test_password},
    name="Login")

if r and r.status_code == 200:
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"   ✅ Token obtido: {token[:20]}...")
else:
    print("\n⚠️  Não conseguiu criar usuário de teste.")
    print("   Tentando com credenciais padrão (bruno/123456)...")

    r = test_endpoint("POST", "/auth/login",
        {"username": "bruno", "password": "123456"},
        name="Login (credenciais padrão)")

    if r and r.status_code == 200:
        token = r.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print(f"   ✅ Token obtido: {token[:20]}...")
    else:
        print("\n❌ Não foi possível autenticar. Abortando testes.")
        print("   Execute o servidor primeiro: uvicorn app.main:app --reload\n")
        sys.exit(1)

# 2. USUÁRIOS
print("\n2️⃣  USUÁRIOS")
print("-" * 80)
test_endpoint("GET", "/users/profile", headers=headers, name="Obter perfil")

# 3. CATEGORIAS
print("\n3️⃣  CATEGORIAS")
print("-" * 80)
test_endpoint("GET", "/categories/", headers=headers, name="Listar categorias")
test_endpoint("GET", "/categories/suggestions", headers=headers, name="Sugestões de categorias")

# 4. CONTAS
print("\n4️⃣  CONTAS")
print("-" * 80)
test_endpoint("GET", "/accounts/", headers=headers, name="Listar contas")
test_endpoint("GET", "/accounts/suggestions", headers=headers, name="Sugestões de contas")
test_endpoint("GET", "/accounts/audit/all", headers=headers, name="Auditoria geral")

# 5. TRANSAÇÕES
print("\n5️⃣  TRANSAÇÕES")
print("-" * 80)
test_endpoint("GET", "/transactions/", headers=headers, name="Listar transações")
test_endpoint("GET", "/transactions/suggestions/descriptions", headers=headers, name="Sugestões de descrições")
test_endpoint("GET", "/transactions/suggestions/descriptions?transaction_type=expense", headers=headers, name="Sugestões (despesas)")
test_endpoint("GET", "/transactions/suggestions/descriptions?transaction_type=income", headers=headers, name="Sugestões (receitas)")

# 6. SEGURANÇA
print("\n6️⃣  SEGURANÇA")
print("-" * 80)
test_endpoint("GET", "/accounts/", name="Acesso sem token (deve falhar)")
test_endpoint("GET", "/accounts/", headers={"Authorization": "Bearer token_invalido"}, name="Token inválido (deve falhar)")

print("\n" + "=" * 80)
print("✅ TESTE RÁPIDO CONCLUÍDO")
print("=" * 80)
print("\nPara teste completo, execute: python test_all_apis.py\n")
