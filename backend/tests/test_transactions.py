"""Testes para endpoints de transações"""

from fastapi.testclient import TestClient


class TestTransactions:
    """Testes para gerenciamento de transações"""

    def test_list_transactions(
        self, client: TestClient, test_user, test_category
    ):
        """Teste: listar transações"""
        response = client.get("/transactions/")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_transaction(
        self, client: TestClient, test_category
    ):
        """Teste: criar transação"""
        transaction_data = {
            "amount": 100.50,
            "date": "2025-11-22",
            "description": "Compra teste",
            "category_id": test_category["id"]
        }
        response = client.post(
            "/transactions/", json=transaction_data
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == 100.50
        assert data["description"] == "Compra teste"
        assert data["id"] is not None

    def test_create_transaction_invalid_category(
        self, client: TestClient
    ):
        """Teste: erro ao criar transação com categoria inexistente"""
        transaction_data = {
            "amount": 50.00,
            "date": "2025-11-22",
            "description": "Teste",
            "category_id": 99999
        }
        response = client.post(
            "/transactions/", json=transaction_data
        )
        
        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_create_transaction_negative_amount(
        self, client: TestClient, test_category
    ):
        """Teste: erro ao criar transação com valor negativo"""
        transaction_data = {
            "amount": -50.00,
            "date": "2025-11-22",
            "description": "Teste",
            "category_id": test_category["id"]
        }
        response = client.post(
            "/transactions/", json=transaction_data
        )
        
        assert response.status_code == 422

    def test_get_transaction(
        self, client: TestClient, test_category
    ):
        """Teste: obter dados de uma transação"""
        # Criar transação
        transaction_data = {
            "amount": 75.00,
            "date": "2025-11-22",
            "description": "Teste GET",
            "category_id": test_category["id"]
        }
        create_response = client.post(
            "/transactions/", json=transaction_data
        )
        transaction = create_response.json()
        
        # Get transação
        response = client.get(f"/transactions/{transaction['id']}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 75.00
        assert data["description"] == "Teste GET"

    def test_get_nonexistent_transaction(self, client: TestClient):
        """Teste: erro ao obter transação inexistente"""
        response = client.get("/transactions/99999")
        
        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_update_transaction(
        self, client: TestClient, test_category
    ):
        """Teste: atualizar transação"""
        # Criar transação
        transaction_data = {
            "amount": 100.00,
            "date": "2025-11-22",
            "description": "Original",
            "category_id": test_category["id"]
        }
        create_response = client.post(
            "/transactions/", json=transaction_data
        )
        transaction = create_response.json()
        
        # Atualizar
        update_data = {
            "amount": 150.00,
            "date": "2025-11-23",
            "description": "Atualizado",
            "category_id": test_category["id"]
        }
        response = client.put(
            f"/transactions/{transaction['id']}", json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["amount"] == 150.00
        assert data["description"] == "Atualizado"

    def test_update_nonexistent_transaction(
        self, client: TestClient, test_category
    ):
        """Teste: erro ao atualizar transação inexistente"""
        update_data = {
            "amount": 50.00,
            "date": "2025-11-22",
            "description": "Teste",
            "category_id": test_category["id"]
        }
        response = client.put(
            "/transactions/99999", json=update_data
        )
        
        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_delete_transaction(
        self, client: TestClient, test_category
    ):
        """Teste: deletar transação"""
        # Criar transação
        transaction_data = {
            "amount": 200.00,
            "date": "2025-11-22",
            "description": "Para deletar",
            "category_id": test_category["id"]
        }
        create_response = client.post(
            "/transactions/", json=transaction_data
        )
        transaction = create_response.json()
        
        # Deletar
        response = client.delete(f"/transactions/{transaction['id']}")
        
        assert response.status_code == 200
        
        # Verificar que foi deletada
        response = client.get(f"/transactions/{transaction['id']}")
        assert response.status_code == 404

    def test_delete_nonexistent_transaction(
        self, client: TestClient
    ):
        """Teste: erro ao deletar transação inexistente"""
        response = client.delete("/transactions/99999")
        
        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]
