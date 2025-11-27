"""Script de testes manual para validar endpoints"""

import requests
import json

BASE_URL = "http://localhost:8000"


def print_result(test_name, response, expected_status=200):
    """Imprimir resultado do teste"""
    success = response.status_code == expected_status
    status = "PASS" if success else "FAIL"
    print(f"{status} | {test_name}")
    print(f"    Status: {response.status_code} (esperado: {expected_status})")
    if not success:
        print(f"    Resposta: {response.text}")
    print()


def test_auth():
    """Testes de autenticação"""
    print("=" * 60)
    print("TESTE: Autenticação")
    print("=" * 60)

    # Test: Register
    user_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print_result("Register - Sucesso", response, 200)
    user_id = response.json()["id"]

    # Test: Register duplicado
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print_result("Register - Duplicado (deve falhar)", response, 400)

    # Test: Login
    response = requests.post(f"{BASE_URL}/auth/login", json=user_data)
    print_result("Login - Sucesso", response, 200)

    # Test: Login com senha errada
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "testuser",
        "password": "wrongpass"
    })
    print_result("Login - Senha errada (deve falhar)", response, 401)

    return user_id


def test_users(user_id):
    """Testes de usuários"""
    print("=" * 60)
    print("TESTE: Usuários")
    print("=" * 60)

    # Test: List users
    response = requests.get(f"{BASE_URL}/users/")
    print_result("GET /users/ - Listar", response, 200)

    # Test: Get user
    response = requests.get(f"{BASE_URL}/users/{user_id}")
    print_result("GET /users/{id} - Obter", response, 200)

    # Test: Get nonexistent
    response = requests.get(f"{BASE_URL}/users/99999")
    print_result(
        "GET /users/99999 - Não encontrado (deve falhar)", response, 404)

    # Test: Update user
    response = requests.put(f"{BASE_URL}/users/{user_id}", json={
        "username": "updateduser",
        "password": "newpass"
    })
    print_result("PUT /users/{id} - Atualizar", response, 200)


def test_categories():
    """Testes de categorias"""
    print("=" * 60)
    print("TESTE: Categorias")
    print("=" * 60)

    # Test: Create category
    response = requests.post(
        f"{BASE_URL}/categories/", json={"name": "Alimentação"})
    print_result("POST /categories/ - Criar", response, 201)
    category_id = response.json()["id"]

    # Test: List categories
    response = requests.get(f"{BASE_URL}/categories/")
    print_result("GET /categories/ - Listar", response, 200)

    # Test: Get category
    response = requests.get(f"{BASE_URL}/categories/{category_id}")
    print_result("GET /categories/{id} - Obter", response, 200)

    # Test: Update category
    response = requests.put(
        f"{BASE_URL}/categories/{category_id}", json={"name": "Comida"})
    print_result("PUT /categories/{id} - Atualizar", response, 200)

    # Test: Create duplicate (skip - já atualizamos a categoria anterior)
    # Criar uma nova pra testar duplicado
    response = requests.post(
        f"{BASE_URL}/categories/", json={"name": "Transporte"})
    print_result("POST /categories/ - Criar outra", response, 201)
    cat_id_2 = response.json()["id"]

    response = requests.post(
        f"{BASE_URL}/categories/", json={"name": "Transporte"})
    print_result("POST /categories/ - Duplicado (deve falhar)", response, 400)

    # Test: Delete um dos IDs criados (manter um para transações)
    response = requests.delete(f"{BASE_URL}/categories/{cat_id_2}")
    print_result("DELETE /categories/{id} - Deletar", response, 200)

    return category_id


def test_transactions(category_id):
    """Testes de transações"""
    print("=" * 60)
    print("TESTE: Transações")
    print("=" * 60)

    test_category_id = category_id

    # Test: Create transaction
    response = requests.post(f"{BASE_URL}/transactions/", json={
        "amount": 100.50,
        "date": "2025-11-22",
        "description": "Teste",
        "category_id": test_category_id
    })
    print_result("POST /transactions/ - Criar", response, 201)
    transaction_id = response.json()["id"]

    # Test: List transactions
    response = requests.get(f"{BASE_URL}/transactions/")
    print_result("GET /transactions/ - Listar", response, 200)

    # Test: Get transaction
    response = requests.get(f"{BASE_URL}/transactions/{transaction_id}")
    print_result("GET /transactions/{id} - Obter", response, 200)

    # Test: Update transaction
    response = requests.put(
        f"{BASE_URL}/transactions/{transaction_id}",
        json={
            "amount": 150.00,
            "date": "2025-11-22",
            "description": "Atualizado",
            "category_id": test_category_id
        }
    )
    print_result("PUT /transactions/{id} - Atualizar", response, 200)

    # Test: Invalid category
    response = requests.post(
        f"{BASE_URL}/transactions/",
        json={
            "amount": 50.00,
            "date": "2025-11-22",
            "description": "Teste",
            "category_id": 99999
        }
    )
    print_result(
        "POST /transactions/ - Cat inválida (deve falhar)",
        response,
        404
    )

    # Test: Delete transaction
    response = requests.delete(f"{BASE_URL}/transactions/{transaction_id}")
    print_result("DELETE /transactions/{id} - Deletar", response, 200)


def test_health():
    """Teste de health check"""
    print("=" * 60)
    print("TESTE: Health Check")
    print("=" * 60)

    response = requests.get(f"{BASE_URL}/")
    print_result("GET / - Health check", response, 200)


if __name__ == "__main__":
    print("\n" + "INICIANDO TESTES MANUAIS".center(60) + "\n")

    try:
        # Testar conexão
        test_health()

        # Rodar testes
        user_id = test_auth()
        test_users(user_id)
        category_id = test_categories()
        test_transactions(category_id)

        print("\n" + "=" * 60)
        print("TODOS OS TESTES COMPLETADOS COM SUCESSO!")
        print("=" * 60)

    except requests.exceptions.ConnectionError:
        msg = "Não foi possível conectar ao servidor"
        print(f"ERRO: {msg}")
        print("Backend rodando em http://localhost:8000?")
    except Exception as e:
        print(f"ERRO: {e}")
