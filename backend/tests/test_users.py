"""Testes para endpoints de usuários"""

from fastapi.testclient import TestClient


class TestUsers:
    """Testes para gerenciamento de usuários"""

    def test_list_users(self, client: TestClient, test_user):
        """Teste: listar usuários"""
        response = client.get("/users/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(u["username"] == test_user["username"] for u in data)

    def test_get_user(self, client: TestClient, test_user):
        """Teste: obter dados de um usuário"""
        user_id = test_user["id"]
        response = client.get(f"/users/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user["username"]
        assert data["id"] == user_id

    def test_get_nonexistent_user(self, client: TestClient):
        """Teste: erro ao obter usuário inexistente"""
        response = client.get("/users/99999")
        
        assert response.status_code == 404
        assert "não encontrado" in response.json()["detail"]

    def test_update_user(self, client: TestClient, test_user):
        """Teste: atualizar usuário"""
        user_id = test_user["id"]
        update_data = {
            "username": "updateduser",
            "password": "newpass456"
        }
        response = client.put(f"/users/{user_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "updateduser"

    def test_update_nonexistent_user(self, client: TestClient):
        """Teste: erro ao atualizar usuário inexistente"""
        update_data = {
            "username": "newname",
            "password": "pass123"
        }
        response = client.put("/users/99999", json=update_data)
        
        assert response.status_code == 404
        assert "não encontrado" in response.json()["detail"]

    def test_delete_user(self, client: TestClient, test_user):
        """Teste: deletar usuário"""
        user_id = test_user["id"]
        response = client.delete(f"/users/{user_id}")
        
        assert response.status_code == 200
        
        # Verificar que foi deletado
        response = client.get(f"/users/{user_id}")
        assert response.status_code == 404

    def test_delete_nonexistent_user(self, client: TestClient):
        """Teste: erro ao deletar usuário inexistente"""
        response = client.delete("/users/99999")
        
        assert response.status_code == 404
        assert "não encontrado" in response.json()["detail"]
