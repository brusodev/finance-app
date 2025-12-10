"""Configuração pytest - Fixtures e setup global"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app


# Usar banco de dados em memória para testes
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


def override_get_db():
    """Override da dependency get_db para usar banco de teste"""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def db() -> Session:
    """Fixture do banco de dados para cada teste"""
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> TestClient:
    """Fixture do cliente HTTP para testes"""
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user(client: TestClient):
    """Fixture para criar um usuário de teste"""
    user_data = {
        "username": "testuser",
        "password": "testpass123"
    }
    response = client.post("/auth/register", json=user_data)
    return response.json()


@pytest.fixture(scope="function")
def auth_headers(test_user) -> dict:
    """Fixture para headers de autenticação"""
    return {"Authorization": f"Bearer {test_user['token']}"}


@pytest.fixture(scope="function")
def test_category(client: TestClient, auth_headers):
    """Fixture para criar uma categoria de teste"""
    category_data = {"name": "Teste", "icon": "test"}
    response = client.post("/categories/", json=category_data, headers=auth_headers)
    return response.json()


@pytest.fixture(scope="function")
def test_account(client: TestClient, auth_headers):
    """Fixture para criar uma conta de teste"""
    account_data = {
        "name": "Conta Teste",
        "account_type": "checking",
        "initial_balance": 1000.0,
        "currency": "BRL"
    }
    response = client.post("/accounts/", json=account_data, headers=auth_headers)
    return response.json()


@pytest.fixture(scope="function")
def test_account_with_transactions(
    client: TestClient, auth_headers, test_account, test_category
):
    """Fixture para criar uma conta com transações"""
    # Criar algumas transações
    transactions = [
        {"amount": 200.0, "transaction_type": "income", "description": "Receita 1"},
        {"amount": -50.0, "transaction_type": "expense", "description": "Despesa 1"},
        {"amount": -30.0, "transaction_type": "expense", "description": "Despesa 2"},
    ]

    for trans_data in transactions:
        transaction_data = {
            "amount": trans_data["amount"],
            "date": "2025-11-22",
            "description": trans_data["description"],
            "transaction_type": trans_data["transaction_type"],
            "category_id": test_category["id"],
            "account_id": test_account["id"]
        }
        client.post("/transactions/", json=transaction_data, headers=auth_headers)

    return test_account


@pytest.fixture(scope="function")
def other_user(client: TestClient):
    """Fixture para criar outro usuário (para testes de autorização)"""
    user_data = {
        "username": "otheruser",
        "password": "otherpass123"
    }
    response = client.post("/auth/register", json=user_data)
    return response.json()


@pytest.fixture(scope="function")
def other_user_headers(other_user) -> dict:
    """Fixture para headers de autenticação do outro usuário"""
    return {"Authorization": f"Bearer {other_user['token']}"}


@pytest.fixture(scope="function")
def other_user_account(client: TestClient, other_user_headers):
    """Fixture para criar uma conta de outro usuário"""
    account_data = {
        "name": "Conta Outro Usuario",
        "account_type": "checking",
        "initial_balance": 500.0
    }
    response = client.post("/accounts/", json=account_data, headers=other_user_headers)
    return response.json()


@pytest.fixture(scope="function")
def create_multiple_users_with_accounts(client: TestClient):
    """Fixture para criar múltiplos usuários com contas (para testes de sugestões)"""
    users_data = []

    for i in range(3):
        # Criar usuário
        user_data = {
            "username": f"suggestionuser{i}",
            "password": "pass123"
        }
        user_response = client.post("/auth/register", json=user_data)
        user = user_response.json()

        headers = {"Authorization": f"Bearer {user['token']}"}

        # Criar contas populares
        popular_accounts = ["Nubank", "Banco Inter", "Caixa", "Bradesco"]
        for account_name in popular_accounts:
            account_data = {
                "name": account_name,
                "account_type": "checking"
            }
            client.post("/accounts/", json=account_data, headers=headers)

        users_data.append({"user": user, "headers": headers})

    return users_data


@pytest.fixture(scope="function")
def create_multiple_users_with_transactions(client: TestClient, test_category):
    """Fixture para criar múltiplos usuários com transações (para testes de sugestões)"""
    users_data = []

    popular_descriptions = [
        {"desc": "Aluguel", "type": "expense"},
        {"desc": "Supermercado", "type": "expense"},
        {"desc": "Salário", "type": "income"},
        {"desc": "Conta de luz", "type": "expense"},
        {"desc": "Freelance", "type": "income"},
    ]

    for i in range(3):
        # Criar usuário
        user_data = {
            "username": f"transuser{i}",
            "password": "pass123"
        }
        user_response = client.post("/auth/register", json=user_data)
        user = user_response.json()

        headers = {"Authorization": f"Bearer {user['token']}"}

        # Criar transações com descrições populares
        for desc_data in popular_descriptions:
            transaction_data = {
                "amount": 100.0 if desc_data["type"] == "income" else -100.0,
                "date": "2025-11-22",
                "description": desc_data["desc"],
                "transaction_type": desc_data["type"],
                "category_id": test_category["id"]
            }
            client.post("/transactions/", json=transaction_data, headers=headers)

        users_data.append({"user": user, "headers": headers})

    return users_data
