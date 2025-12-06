"""
Script completo para testar todas as APIs do Finance App
Testa todos os endpoints e identifica bugs
"""

import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Configuração
API_URL = input("Digite a URL da API (deixe vazio para http://localhost:8000): ").strip()
if not API_URL:
    API_URL = "http://localhost:8000"

print(f"\n🌐 Testando API: {API_URL}\n")

# Cores para output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# Variáveis globais para armazenar dados de teste
test_data = {
    'token': None,
    'user_id': None,
    'category_id': None,
    'account_id': None,
    'transaction_id': None,
}

bugs_found = []
tests_passed = 0
tests_failed = 0

def print_section(title: str):
    """Imprime uma seção formatada"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}  {title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.RESET}\n")

def print_test(name: str, status: str, details: str = ""):
    """Imprime resultado de um teste"""
    global tests_passed, tests_failed

    if status == "PASS":
        print(f"{Colors.GREEN}✅ PASS{Colors.RESET} - {name}")
        tests_passed += 1
    elif status == "FAIL":
        print(f"{Colors.RED}❌ FAIL{Colors.RESET} - {name}")
        if details:
            print(f"   {Colors.YELLOW}Detalhes: {details}{Colors.RESET}")
        tests_failed += 1
        bugs_found.append(f"{name}: {details}")
    elif status == "WARN":
        print(f"{Colors.YELLOW}⚠️  WARN{Colors.RESET} - {name}")
        if details:
            print(f"   Detalhes: {details}")

def make_request(
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    token: Optional[str] = None,
    expected_status: int = 200
) -> tuple[bool, Any, int]:
    """Faz uma requisição HTTP e valida o resultado"""
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{API_URL}{endpoint}"

    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return False, f"Método {method} não suportado", 0

        status_ok = response.status_code == expected_status

        try:
            response_data = response.json()
        except:
            response_data = response.text

        return status_ok, response_data, response.status_code

    except Exception as e:
        return False, str(e), 0

# ============================================================================
# TESTES DE AUTENTICAÇÃO
# ============================================================================

def test_auth():
    """Testa endpoints de autenticação"""
    print_section("TESTES DE AUTENTICAÇÃO")

    # Gerar username único
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    username = f"testuser_{timestamp}"
    password = "Test@1234"
    email = f"{username}@test.com"

    # 1. Registro
    print(f"\n📝 Testando registro de usuário...")
    success, data, status = make_request(
        "POST",
        "/auth/register",
        {
            "username": username,
            "password": password,
            "email": email,
            "full_name": "Test User"
        },
        expected_status=201
    )

    if success:
        print_test("Registro de usuário", "PASS")
        test_data['token'] = data.get('access_token')
        test_data['user_id'] = data.get('user', {}).get('id')
    else:
        print_test("Registro de usuário", "FAIL", f"Status {status}: {data}")
        return False

    # 2. Login
    print(f"\n🔑 Testando login...")
    success, data, status = make_request(
        "POST",
        "/auth/login",
        {"username": username, "password": password}
    )

    if success:
        print_test("Login de usuário", "PASS")
        if data.get('access_token'):
            test_data['token'] = data['access_token']
        else:
            print_test("Token no login", "FAIL", "Token não retornado")
    else:
        print_test("Login de usuário", "FAIL", f"Status {status}: {data}")

    # 3. Login com credenciais inválidas
    print(f"\n🚫 Testando login com senha incorreta...")
    success, data, status = make_request(
        "POST",
        "/auth/login",
        {"username": username, "password": "senhaerrada"},
        expected_status=401
    )

    if success:
        print_test("Rejeição de senha incorreta", "PASS")
    else:
        print_test("Rejeição de senha incorreta", "FAIL", f"Deveria retornar 401, retornou {status}")

    # 4. Registro duplicado
    print(f"\n🔄 Testando registro duplicado...")
    success, data, status = make_request(
        "POST",
        "/auth/register",
        {
            "username": username,
            "password": password,
            "email": email,
            "full_name": "Test User"
        },
        expected_status=400
    )

    if success:
        print_test("Rejeição de username duplicado", "PASS")
    else:
        print_test("Rejeição de username duplicado", "FAIL", f"Deveria retornar 400, retornou {status}")

    return True

# ============================================================================
# TESTES DE USUÁRIOS
# ============================================================================

def test_users():
    """Testa endpoints de usuários"""
    print_section("TESTES DE USUÁRIOS")

    token = test_data['token']
    if not token:
        print_test("Token disponível", "FAIL", "Sem token de autenticação")
        return False

    # 1. Obter perfil
    print(f"\n👤 Testando obter perfil...")
    success, data, status = make_request("GET", "/users/profile", token=token)

    if success:
        print_test("Obter perfil", "PASS")
        print(f"   Username: {data.get('username')}")
        print(f"   Email: {data.get('email')}")
    else:
        print_test("Obter perfil", "FAIL", f"Status {status}: {data}")

    # 2. Atualizar perfil
    print(f"\n✏️  Testando atualizar perfil...")
    success, data, status = make_request(
        "PUT",
        "/users/profile",
        {
            "full_name": "Test User Updated",
            "phone": "+55 11 99999-9999",
            "cpf": "123.456.789-00"
        },
        token=token
    )

    if success:
        print_test("Atualizar perfil", "PASS")
        if data.get('full_name') == "Test User Updated":
            print_test("Dados atualizados corretamente", "PASS")
        else:
            print_test("Dados atualizados corretamente", "FAIL", "Nome não foi atualizado")
    else:
        print_test("Atualizar perfil", "FAIL", f"Status {status}: {data}")

    # 3. Trocar senha
    print(f"\n🔐 Testando trocar senha...")
    success, data, status = make_request(
        "POST",
        "/auth/change-password",
        {
            "current_password": "Test@1234",
            "new_password": "NewTest@1234"
        },
        token=token
    )

    if success:
        print_test("Trocar senha", "PASS")

        # Testar login com nova senha
        success2, data2, status2 = make_request(
            "POST",
            "/auth/login",
            {"username": data.get('username', ''), "password": "NewTest@1234"}
        )
        if success2:
            print_test("Login com nova senha", "PASS")
            test_data['token'] = data2.get('access_token', token)
        else:
            print_test("Login com nova senha", "FAIL", "Não conseguiu logar com nova senha")
    else:
        print_test("Trocar senha", "FAIL", f"Status {status}: {data}")

    return True

# ============================================================================
# TESTES DE CATEGORIAS
# ============================================================================

def test_categories():
    """Testa endpoints de categorias"""
    print_section("TESTES DE CATEGORIAS")

    token = test_data['token']
    if not token:
        print_test("Token disponível", "FAIL", "Sem token de autenticação")
        return False

    # 1. Listar categorias
    print(f"\n📋 Testando listar categorias...")
    success, data, status = make_request("GET", "/categories/", token=token)

    if success:
        print_test("Listar categorias", "PASS")
        print(f"   Total: {len(data)} categorias")
    else:
        print_test("Listar categorias", "FAIL", f"Status {status}: {data}")
        return False

    # 2. Criar categoria
    print(f"\n➕ Testando criar categoria...")
    success, data, status = make_request(
        "POST",
        "/categories/",
        {
            "name": "Categoria Teste",
            "icon": "🧪",
            "color": "#FF5733"
        },
        token=token,
        expected_status=201
    )

    if success:
        print_test("Criar categoria", "PASS")
        test_data['category_id'] = data.get('id')
        print(f"   ID: {data.get('id')}")
        print(f"   Nome: {data.get('name')}")
    else:
        print_test("Criar categoria", "FAIL", f"Status {status}: {data}")
        return False

    # 3. Obter sugestões de categorias
    print(f"\n💡 Testando sugestões de categorias...")
    success, data, status = make_request("GET", "/categories/suggestions", token=token)

    if success:
        print_test("Sugestões de categorias", "PASS")
        print(f"   Total de sugestões: {len(data)}")
        if len(data) > 0:
            print(f"   Primeira sugestão: {data[0]}")
    else:
        print_test("Sugestões de categorias", "FAIL", f"Status {status}: {data}")

    # 4. Atualizar categoria
    print(f"\n✏️  Testando atualizar categoria...")
    success, data, status = make_request(
        "PUT",
        f"/categories/{test_data['category_id']}",
        {
            "name": "Categoria Teste Atualizada",
            "icon": "🔬",
            "color": "#00FF00"
        },
        token=token
    )

    if success:
        print_test("Atualizar categoria", "PASS")
        if data.get('name') == "Categoria Teste Atualizada":
            print_test("Dados atualizados corretamente", "PASS")
        else:
            print_test("Dados atualizados corretamente", "FAIL", "Nome não foi atualizado")
    else:
        print_test("Atualizar categoria", "FAIL", f"Status {status}: {data}")

    # 5. Criar categoria duplicada
    print(f"\n🔄 Testando criar categoria duplicada...")
    success, data, status = make_request(
        "POST",
        "/categories/",
        {
            "name": "Categoria Teste Atualizada",
            "icon": "🧪",
            "color": "#FF5733"
        },
        token=token,
        expected_status=400
    )

    if success:
        print_test("Rejeição de categoria duplicada", "PASS")
    else:
        print_test("Rejeição de categoria duplicada", "FAIL", f"Deveria retornar 400, retornou {status}")

    return True

# ============================================================================
# TESTES DE CONTAS
# ============================================================================

def test_accounts():
    """Testa endpoints de contas"""
    print_section("TESTES DE CONTAS")

    token = test_data['token']
    if not token:
        print_test("Token disponível", "FAIL", "Sem token de autenticação")
        return False

    # 1. Listar contas
    print(f"\n📋 Testando listar contas...")
    success, data, status = make_request("GET", "/accounts/", token=token)

    if success:
        print_test("Listar contas", "PASS")
        print(f"   Total: {len(data)} contas")
    else:
        print_test("Listar contas", "FAIL", f"Status {status}: {data}")
        return False

    # 2. Criar conta
    print(f"\n➕ Testando criar conta...")
    success, data, status = make_request(
        "POST",
        "/accounts/",
        {
            "name": "Conta Teste",
            "account_type": "checking",
            "initial_balance": 1000.00,
            "currency": "BRL"
        },
        token=token,
        expected_status=201
    )

    if success:
        print_test("Criar conta", "PASS")
        test_data['account_id'] = data.get('id')
        print(f"   ID: {data.get('id')}")
        print(f"   Nome: {data.get('name')}")
        print(f"   Saldo inicial: R$ {data.get('initial_balance')}")
        print(f"   Saldo atual: R$ {data.get('balance')}")

        # Verificar se initial_balance == balance para nova conta
        if data.get('initial_balance') == data.get('balance'):
            print_test("Saldo inicial = Saldo atual (conta nova)", "PASS")
        else:
            print_test("Saldo inicial = Saldo atual (conta nova)", "FAIL",
                      f"Initial: {data.get('initial_balance')}, Balance: {data.get('balance')}")
    else:
        print_test("Criar conta", "FAIL", f"Status {status}: {data}")
        return False

    # 3. Obter sugestões de contas
    print(f"\n💡 Testando sugestões de contas...")
    success, data, status = make_request("GET", "/accounts/suggestions", token=token)

    if success:
        print_test("Sugestões de contas", "PASS")
        print(f"   Total de sugestões: {len(data)}")
        if len(data) > 0:
            print(f"   Primeira sugestão: {data[0]}")
    else:
        print_test("Sugestões de contas", "FAIL", f"Status {status}: {data}")

    # 4. Atualizar conta
    print(f"\n✏️  Testando atualizar conta...")
    success, data, status = make_request(
        "PUT",
        f"/accounts/{test_data['account_id']}",
        {
            "name": "Conta Teste Atualizada",
            "account_type": "savings"
        },
        token=token
    )

    if success:
        print_test("Atualizar conta", "PASS")
        if data.get('name') == "Conta Teste Atualizada":
            print_test("Dados atualizados corretamente", "PASS")
        else:
            print_test("Dados atualizados corretamente", "FAIL", "Nome não foi atualizado")

        # Verificar se saldos foram preservados
        if data.get('initial_balance') == 1000.00:
            print_test("Initial balance preservado na atualização", "PASS")
        else:
            print_test("Initial balance preservado na atualização", "FAIL",
                      f"Era 1000.00, agora é {data.get('initial_balance')}")
    else:
        print_test("Atualizar conta", "FAIL", f"Status {status}: {data}")

    # 5. Tentar atualizar balance diretamente (deve falhar)
    print(f"\n🚫 Testando proteção contra alteração direta de balance...")
    success, data, status = make_request(
        "PUT",
        f"/accounts/{test_data['account_id']}",
        {
            "balance": 99999.00
        },
        token=token
    )

    # Verificar se o balance não mudou
    success2, data2, status2 = make_request("GET", f"/accounts/{test_data['account_id']}", token=token)
    if success2:
        if data2.get('balance') != 99999.00:
            print_test("Proteção contra alteração de balance", "PASS")
        else:
            print_test("Proteção contra alteração de balance", "FAIL",
                      "Balance foi alterado diretamente!")

    # 6. Auditoria de conta
    print(f"\n🔍 Testando auditoria de conta...")
    success, data, status = make_request("GET", f"/accounts/{test_data['account_id']}/audit", token=token)

    if success:
        print_test("Auditoria de conta", "PASS")
        print(f"   Initial balance: R$ {data.get('initial_balance')}")
        print(f"   Current balance: R$ {data.get('current_balance')}")
        print(f"   Calculated balance: R$ {data.get('calculated_balance')}")
        print(f"   Total transactions: {data.get('total_transactions')}")
        print(f"   Consistente: {data.get('is_consistent')}")

        if data.get('is_consistent'):
            print_test("Consistência de saldo", "PASS")
        else:
            print_test("Consistência de saldo", "WARN",
                      f"Diferença: R$ {data.get('difference')}")
    else:
        print_test("Auditoria de conta", "FAIL", f"Status {status}: {data}")

    return True

# ============================================================================
# TESTES DE TRANSAÇÕES
# ============================================================================

def test_transactions():
    """Testa endpoints de transações"""
    print_section("TESTES DE TRANSAÇÕES")

    token = test_data['token']
    category_id = test_data['category_id']
    account_id = test_data['account_id']

    if not token or not category_id:
        print_test("Dados disponíveis", "FAIL", "Faltam token ou categoria")
        return False

    # 1. Listar transações
    print(f"\n📋 Testando listar transações...")
    success, data, status = make_request("GET", "/transactions/", token=token)

    if success:
        print_test("Listar transações", "PASS")
        print(f"   Total: {len(data)} transações")
    else:
        print_test("Listar transações", "FAIL", f"Status {status}: {data}")
        return False

    # 2. Criar transação de despesa
    print(f"\n➕ Testando criar transação de despesa...")
    success, data, status = make_request(
        "POST",
        "/transactions/",
        {
            "amount": -150.50,
            "date": "2025-12-06",
            "description": "Teste de despesa",
            "transaction_type": "expense",
            "category_id": category_id,
            "account_id": account_id
        },
        token=token,
        expected_status=201
    )

    if success:
        print_test("Criar transação de despesa", "PASS")
        test_data['transaction_id'] = data.get('id')
        print(f"   ID: {data.get('id')}")
        print(f"   Valor: R$ {data.get('amount')}")
        print(f"   Descrição: {data.get('description')}")

        # Verificar se o saldo da conta foi atualizado
        success2, account_data, status2 = make_request("GET", f"/accounts/{account_id}", token=token)
        if success2:
            expected_balance = 1000.00 - 150.50  # initial_balance - despesa
            if abs(account_data.get('balance', 0) - expected_balance) < 0.01:
                print_test("Saldo da conta atualizado após despesa", "PASS")
            else:
                print_test("Saldo da conta atualizado após despesa", "FAIL",
                          f"Esperado: {expected_balance}, Atual: {account_data.get('balance')}")
    else:
        print_test("Criar transação de despesa", "FAIL", f"Status {status}: {data}")
        return False

    # 3. Criar transação de receita
    print(f"\n➕ Testando criar transação de receita...")
    success, data, status = make_request(
        "POST",
        "/transactions/",
        {
            "amount": 500.00,
            "date": "2025-12-06",
            "description": "Teste de receita",
            "transaction_type": "income",
            "category_id": category_id,
            "account_id": account_id
        },
        token=token,
        expected_status=201
    )

    if success:
        print_test("Criar transação de receita", "PASS")

        # Verificar saldo atualizado
        success2, account_data, status2 = make_request("GET", f"/accounts/{account_id}", token=token)
        if success2:
            expected_balance = 1000.00 - 150.50 + 500.00
            if abs(account_data.get('balance', 0) - expected_balance) < 0.01:
                print_test("Saldo da conta atualizado após receita", "PASS")
            else:
                print_test("Saldo da conta atualizado após receita", "FAIL",
                          f"Esperado: {expected_balance}, Atual: {account_data.get('balance')}")
    else:
        print_test("Criar transação de receita", "FAIL", f"Status {status}: {data}")

    # 4. Atualizar transação
    print(f"\n✏️  Testando atualizar transação...")
    success, data, status = make_request(
        "PUT",
        f"/transactions/{test_data['transaction_id']}",
        {
            "amount": -200.00,
            "date": "2025-12-06",
            "description": "Teste de despesa atualizada",
            "transaction_type": "expense",
            "category_id": category_id,
            "account_id": account_id
        },
        token=token
    )

    if success:
        print_test("Atualizar transação", "PASS")
        if data.get('description') == "Teste de despesa atualizada":
            print_test("Dados atualizados corretamente", "PASS")
        else:
            print_test("Dados atualizados corretamente", "FAIL", "Descrição não foi atualizada")
    else:
        print_test("Atualizar transação", "FAIL", f"Status {status}: {data}")

    # 5. Sugestões de descrições
    print(f"\n💡 Testando sugestões de descrições...")
    success, data, status = make_request(
        "GET",
        "/transactions/suggestions/descriptions?limit=10",
        token=token
    )

    if success:
        print_test("Sugestões de descrições", "PASS")
        print(f"   Total de sugestões: {len(data)}")
        if len(data) > 0:
            print(f"   Exemplos: {data[:3]}")
    else:
        print_test("Sugestões de descrições", "FAIL", f"Status {status}: {data}")

    # 6. Sugestões filtradas por tipo
    print(f"\n💡 Testando sugestões filtradas por tipo...")
    success, data, status = make_request(
        "GET",
        "/transactions/suggestions/descriptions?transaction_type=expense&limit=5",
        token=token
    )

    if success:
        print_test("Sugestões filtradas por tipo", "PASS")
        print(f"   Total: {len(data)}")
    else:
        print_test("Sugestões filtradas por tipo", "FAIL", f"Status {status}: {data}")

    # 7. Deletar transação
    print(f"\n🗑️  Testando deletar transação...")

    # Salvar saldo antes da deleção
    success_before, account_before, _ = make_request("GET", f"/accounts/{account_id}", token=token)
    balance_before = account_before.get('balance', 0) if success_before else 0

    success, data, status = make_request(
        "DELETE",
        f"/transactions/{test_data['transaction_id']}",
        token=token,
        expected_status=204
    )

    if success or status == 204:
        print_test("Deletar transação", "PASS")

        # Verificar se saldo foi revertido
        success2, account_data, status2 = make_request("GET", f"/accounts/{account_id}", token=token)
        if success2:
            print(f"   Saldo antes: R$ {balance_before}")
            print(f"   Saldo depois: R$ {account_data.get('balance')}")

            # O saldo deve ter aumentado em 200 (transação de -200 foi removida)
            expected_balance = balance_before + 200.00
            if abs(account_data.get('balance', 0) - expected_balance) < 0.01:
                print_test("Saldo revertido após deletar transação", "PASS")
            else:
                print_test("Saldo revertido após deletar transação", "FAIL",
                          f"Esperado: {expected_balance}, Atual: {account_data.get('balance')}")
    else:
        print_test("Deletar transação", "FAIL", f"Status {status}: {data}")

    # 8. Criar transação sem conta (opcional)
    print(f"\n➕ Testando criar transação sem conta...")
    success, data, status = make_request(
        "POST",
        "/transactions/",
        {
            "amount": -50.00,
            "date": "2025-12-06",
            "description": "Transação sem conta",
            "transaction_type": "expense",
            "category_id": category_id
        },
        token=token,
        expected_status=201
    )

    if success:
        print_test("Criar transação sem conta", "PASS")
    else:
        print_test("Criar transação sem conta", "FAIL", f"Status {status}: {data}")

    return True

# ============================================================================
# TESTES DE SEGURANÇA
# ============================================================================

def test_security():
    """Testa aspectos de segurança da API"""
    print_section("TESTES DE SEGURANÇA")

    token = test_data['token']

    # 1. Acesso sem autenticação
    print(f"\n🔒 Testando acesso sem token...")
    success, data, status = make_request(
        "GET",
        "/accounts/",
        expected_status=401
    )

    if success:
        print_test("Rejeição sem token", "PASS")
    else:
        print_test("Rejeição sem token", "FAIL", f"Deveria retornar 401, retornou {status}")

    # 2. Token inválido
    print(f"\n🔒 Testando token inválido...")
    success, data, status = make_request(
        "GET",
        "/accounts/",
        token="token_invalido_12345",
        expected_status=401
    )

    if success:
        print_test("Rejeição de token inválido", "PASS")
    else:
        print_test("Rejeição de token inválido", "FAIL", f"Deveria retornar 401, retornou {status}")

    # 3. Acesso a recurso de outro usuário (se possível)
    print(f"\n🔒 Testando acesso a recurso inexistente...")
    success, data, status = make_request(
        "GET",
        "/accounts/99999",
        token=token,
        expected_status=404
    )

    if success:
        print_test("Rejeição de recurso inexistente", "PASS")
    else:
        print_test("Rejeição de recurso inexistente", "FAIL", f"Deveria retornar 404, retornou {status}")

    return True

# ============================================================================
# TESTES DE INTEGRIDADE
# ============================================================================

def test_data_integrity():
    """Testa integridade dos dados"""
    print_section("TESTES DE INTEGRIDADE DE DADOS")

    token = test_data['token']
    account_id = test_data['account_id']

    if not account_id:
        print_test("Conta disponível", "FAIL", "Sem conta para testar")
        return False

    # 1. Recalcular saldo
    print(f"\n🔄 Testando recálculo de saldo...")
    success, data, status = make_request(
        "POST",
        f"/accounts/{account_id}/recalculate",
        token=token
    )

    if success:
        print_test("Recálculo de saldo", "PASS")
        print(f"   Saldo antes: R$ {data.get('balance_before')}")
        print(f"   Saldo depois: R$ {data.get('balance_after')}")
        print(f"   Diferença: R$ {data.get('difference')}")
    else:
        print_test("Recálculo de saldo", "FAIL", f"Status {status}: {data}")

    # 2. Auditoria geral
    print(f"\n🔍 Testando auditoria geral...")
    success, data, status = make_request(
        "GET",
        "/accounts/audit/all",
        token=token
    )

    if success:
        print_test("Auditoria geral", "PASS")
        print(f"   Total de contas auditadas: {len(data)}")

        inconsistent = [acc for acc in data if not acc.get('is_consistent')]
        if inconsistent:
            print_test("Contas com inconsistência", "WARN",
                      f"{len(inconsistent)} contas com problemas")
            for acc in inconsistent[:3]:  # Mostrar até 3 exemplos
                print(f"      - {acc.get('account_name')}: Diferença R$ {acc.get('difference')}")
        else:
            print_test("Todas as contas consistentes", "PASS")
    else:
        print_test("Auditoria geral", "FAIL", f"Status {status}: {data}")

    return True

# ============================================================================
# RELATÓRIO FINAL
# ============================================================================

def print_final_report():
    """Imprime relatório final dos testes"""
    print_section("RELATÓRIO FINAL")

    total_tests = tests_passed + tests_failed
    success_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0

    print(f"\n📊 Estatísticas:")
    print(f"   Total de testes: {total_tests}")
    print(f"   {Colors.GREEN}✅ Passaram: {tests_passed}{Colors.RESET}")
    print(f"   {Colors.RED}❌ Falharam: {tests_failed}{Colors.RESET}")
    print(f"   Taxa de sucesso: {success_rate:.1f}%")

    if bugs_found:
        print(f"\n{Colors.RED}{Colors.BOLD}🐛 BUGS ENCONTRADOS ({len(bugs_found)}):{Colors.RESET}")
        for i, bug in enumerate(bugs_found, 1):
            print(f"   {i}. {bug}")
    else:
        print(f"\n{Colors.GREEN}{Colors.BOLD}✨ Nenhum bug encontrado! API está funcionando perfeitamente.{Colors.RESET}")

    print(f"\n{Colors.BLUE}{'='*70}{Colors.RESET}\n")

# ============================================================================
# MAIN
# ============================================================================

def main():
    """Executa todos os testes"""
    print(f"\n{Colors.BOLD}🧪 INICIANDO TESTES DA API FINANCE APP{Colors.RESET}")
    print(f"{Colors.BOLD}📅 {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}{Colors.RESET}")

    try:
        # Executar testes na ordem
        if not test_auth():
            print(f"\n{Colors.RED}❌ Testes de autenticação falharam. Abortando.{Colors.RESET}")
            return

        test_users()
        test_categories()
        test_accounts()
        test_transactions()
        test_security()
        test_data_integrity()

    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Testes interrompidos pelo usuário.{Colors.RESET}")
    except Exception as e:
        print(f"\n{Colors.RED}❌ Erro fatal: {e}{Colors.RESET}")
    finally:
        print_final_report()

if __name__ == "__main__":
    main()
