"""Testes para endpoints de categorias"""

from fastapi.testclient import TestClient


class TestCategories:
    """Testes para gerenciamento de categorias"""

    def test_list_categories(self, client: TestClient, test_category):
        """Teste: listar categorias"""
        response = client.get("/categories/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(c["name"] == test_category["name"] for c in data)

    def test_create_category(self, client: TestClient):
        """Teste: criar categoria"""
        category_data = {"name": "Transporte"}
        response = client.post("/categories/", json=category_data)

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Transporte"
        assert data["id"] is not None

    def test_create_duplicate_category(
        self, client: TestClient, test_category
    ):
        """Teste: erro ao criar categoria com nome duplicado"""
        category_data = {"name": test_category["name"]}
        response = client.post("/categories/", json=category_data)

        assert response.status_code == 400
        assert "já existe" in response.json()["detail"]

    def test_get_category(self, client: TestClient, test_category):
        """Teste: obter dados de uma categoria"""
        category_id = test_category["id"]
        response = client.get(f"/categories/{category_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_category["name"]
        assert data["id"] == category_id

    def test_get_nonexistent_category(self, client: TestClient):
        """Teste: erro ao obter categoria inexistente"""
        response = client.get("/categories/99999")

        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_update_category(self, client: TestClient, test_category):
        """Teste: atualizar categoria"""
        category_id = test_category["id"]
        update_data = {"name": "Alimentação Atualizada"}
        response = client.put(f"/categories/{category_id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Alimentação Atualizada"

    def test_update_nonexistent_category(self, client: TestClient):
        """Teste: erro ao atualizar categoria inexistente"""
        update_data = {"name": "Nova Categoria"}
        response = client.put("/categories/99999", json=update_data)

        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_delete_category(self, client: TestClient, test_category):
        """Teste: deletar categoria"""
        category_id = test_category["id"]
        response = client.delete(f"/categories/{category_id}")

        assert response.status_code == 200

        # Verificar que foi deletada
        response = client.get(f"/categories/{category_id}")
        assert response.status_code == 404

    def test_delete_nonexistent_category(self, client: TestClient):
        """Teste: erro ao deletar categoria inexistente"""
        response = client.delete("/categories/99999")

        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]
