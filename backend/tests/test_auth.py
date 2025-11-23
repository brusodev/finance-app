"""Testes para endpoints de autenticação"""

from fastapi.testclient import TestClient


class TestAuth:
    """Testes para autenticação"""

    def test_register_success(self, client: TestClient):
        """Teste: registrar usuário com sucesso"""
        user_data = {
            "username": "newuser",
            "password": "secure123"
        }
        response = client.post("/auth/register", json=user_data)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newuser"
        assert data["id"] is not None

    def test_register_duplicate_username(self, client: TestClient, test_user):
        """Teste: erro ao registrar com username duplicado"""
        user_data = {
            "username": test_user["username"],
            "password": "newpass123"
        }
        response = client.post("/auth/register", json=user_data)

        assert response.status_code == 400
        assert "já está em uso" in response.json()["detail"]

    def test_login_success(self, client: TestClient, test_user):
        """Teste: login com sucesso"""
        login_data = {
            "username": test_user["username"],
            "password": "testpass123"
        }
        response = client.post("/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user["username"]

    def test_login_invalid_password(self, client: TestClient, test_user):
        """Teste: erro ao fazer login com password incorreta"""
        login_data = {
            "username": test_user["username"],
            "password": "wrongpassword"
        }
        response = client.post("/auth/login", json=login_data)

        assert response.status_code == 401
        assert "inválidos" in response.json()["detail"]

    def test_login_nonexistent_user(self, client: TestClient):
        """Teste: erro ao fazer login com usuário inexistente"""
        login_data = {
            "username": "nonexistent",
            "password": "anypass"
        }
        response = client.post("/auth/login", json=login_data)

        assert response.status_code == 401
        assert "inválidos" in response.json()["detail"]
