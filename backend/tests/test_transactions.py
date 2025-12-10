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


class TestTransactionSuggestions:
    """Testes para sugestões de descrições de transações"""

    def test_get_description_suggestions(
        self, client: TestClient, auth_headers,
        create_multiple_users_with_transactions
    ):
        """Teste: obter sugestões de descrições"""
        response = client.get(
            "/transactions/suggestions/descriptions?limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    def test_description_suggestions_by_type(
        self, client: TestClient, auth_headers,
        create_multiple_users_with_transactions
    ):
        """Teste: sugestões filtradas por tipo de transação"""
        # Sugestões para despesas
        response = client.get(
            "/transactions/suggestions/descriptions?transaction_type=expense",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Sugestões para receitas
        response = client.get(
            "/transactions/suggestions/descriptions?transaction_type=income",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_description_suggestions_by_category(
        self, client: TestClient, auth_headers, test_category,
        create_multiple_users_with_transactions
    ):
        """Teste: sugestões filtradas por categoria"""
        response = client.get(
            f"/transactions/suggestions/descriptions?category_id={test_category['id']}",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_description_suggestions_combined_filters(
        self, client: TestClient, auth_headers, test_category
    ):
        """Teste: sugestões com múltiplos filtros"""
        response = client.get(
            f"/transactions/suggestions/descriptions"
            f"?transaction_type=expense&category_id={test_category['id']}&limit=20",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 20

    def test_description_suggestions_excludes_own(
        self, client: TestClient, auth_headers, test_category
    ):
        """Teste: sugestões não incluem descrições do próprio usuário"""
        # Criar transação com descrição única
        unique_desc = "MinhaDescricaoUnicaXYZ123"
        transaction_data = {
            "amount": 100.0,
            "date": "2025-11-22",
            "description": unique_desc,
            "transaction_type": "expense",
            "category_id": test_category["id"]
        }
        client.post("/transactions/", json=transaction_data, headers=auth_headers)

        # Buscar sugestões
        response = client.get(
            "/transactions/suggestions/descriptions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Não deve conter a descrição do próprio usuário
        assert unique_desc not in data

    def test_description_suggestions_excludes_empty(
        self, client: TestClient, auth_headers, test_category
    ):
        """Teste: sugestões não incluem descrições vazias"""
        # Criar transação sem descrição
        transaction_data = {
            "amount": 50.0,
            "date": "2025-11-22",
            "transaction_type": "expense",
            "category_id": test_category["id"]
        }
        client.post("/transactions/", json=transaction_data, headers=auth_headers)

        # Buscar sugestões
        response = client.get(
            "/transactions/suggestions/descriptions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Não deve conter None ou strings vazias
        assert None not in data
        assert "" not in data


class TestTransactionWithAccounts:
    """Testes de transações vinculadas a contas"""

    def test_create_transaction_with_account(
        self, client: TestClient, auth_headers, test_category, test_account
    ):
        """Teste: criar transação vinculada a uma conta"""
        transaction_data = {
            "amount": 200.0,
            "date": "2025-11-22",
            "description": "Compra com conta",
            "transaction_type": "expense",
            "category_id": test_category["id"],
            "account_id": test_account["id"]
        }
        response = client.post(
            "/transactions/",
            json=transaction_data,
            headers=auth_headers
        )

        assert response.status_code == 201
        data = response.json()
        assert data["account"]["id"] == test_account["id"]

    def test_transaction_updates_account_balance(
        self, client: TestClient, auth_headers, test_category, test_account
    ):
        """Teste: transação atualiza saldo da conta"""
        # Saldo inicial da conta
        initial_balance = test_account["balance"]

        # Criar transação de despesa
        transaction_data = {
            "amount": -100.0,
            "date": "2025-11-22",
            "description": "Despesa",
            "transaction_type": "expense",
            "category_id": test_category["id"],
            "account_id": test_account["id"]
        }
        client.post("/transactions/", json=transaction_data, headers=auth_headers)

        # Verificar saldo atualizado
        response = client.get(
            f"/accounts/{test_account['id']}",
            headers=auth_headers
        )
        data = response.json()
        assert data["balance"] == initial_balance - 100.0

    def test_delete_transaction_reverts_account_balance(
        self, client: TestClient, auth_headers, test_category, test_account
    ):
        """Teste: deletar transação reverte saldo da conta"""
        # Saldo inicial
        initial_balance = test_account["balance"]

        # Criar transação
        transaction_data = {
            "amount": 50.0,
            "date": "2025-11-22",
            "description": "Teste",
            "transaction_type": "income",
            "category_id": test_category["id"],
            "account_id": test_account["id"]
        }
        response = client.post(
            "/transactions/",
            json=transaction_data,
            headers=auth_headers
        )
        transaction = response.json()

        # Deletar transação
        client.delete(f"/transactions/{transaction['id']}", headers=auth_headers)

        # Verificar saldo voltou ao inicial
        response = client.get(
            f"/accounts/{test_account['id']}",
            headers=auth_headers
        )
        data = response.json()
        assert data["balance"] == initial_balance
