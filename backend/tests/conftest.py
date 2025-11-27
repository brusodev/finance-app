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
def test_category(client: TestClient):
    """Fixture para criar uma categoria de teste"""
    category_data = {"name": "Teste"}
    response = client.post("/categories/", json=category_data)
    return response.json()
