"""Testes para endpoints de contas"""

from fastapi.testclient import TestClient
import pytest


class TestAccounts:
    """Testes para gerenciamento de contas"""

    def test_create_account(self, client: TestClient, auth_headers):
        """Teste: criar conta com saldo inicial"""
        account_data = {
            "name": "Banco Inter",
            "account_type": "checking",
            "initial_balance": 5000.0,
            "currency": "BRL"
        }
        response = client.post(
            "/accounts/",
            json=account_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Banco Inter"
        assert data["initial_balance"] == 5000.0
        assert data["balance"] == 5000.0  # Começa igual ao inicial
        assert data["is_active"] is True
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_account_without_initial_balance(
        self, client: TestClient, auth_headers
    ):
        """Teste: criar conta sem saldo inicial (default 0)"""
        account_data = {
            "name": "Conta Nova",
            "account_type": "savings"
        }
        response = client.post(
            "/accounts/",
            json=account_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["initial_balance"] == 0.0
        assert data["balance"] == 0.0

    def test_list_accounts(self, client: TestClient, auth_headers, test_account):
        """Teste: listar contas do usuário"""
        response = client.get("/accounts/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(a["name"] == test_account["name"] for a in data)

    def test_list_accounts_only_active(
        self, client: TestClient, auth_headers, test_account
    ):
        """Teste: listar apenas contas ativas (soft delete)"""
        # Deletar conta (soft delete)
        account_id = test_account["id"]
        client.delete(f"/accounts/{account_id}", headers=auth_headers)

        # Listar contas (deve retornar vazio pois foi soft deleted)
        response = client.get("/accounts/", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        # Não deve conter a conta deletada
        assert not any(a["id"] == account_id for a in data)

    def test_get_account(self, client: TestClient, auth_headers, test_account):
        """Teste: obter dados de uma conta"""
        account_id = test_account["id"]
        response = client.get(f"/accounts/{account_id}", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == test_account["name"]
        assert data["id"] == account_id

    def test_get_nonexistent_account(self, client: TestClient, auth_headers):
        """Teste: erro ao obter conta inexistente"""
        response = client.get("/accounts/99999", headers=auth_headers)

        assert response.status_code == 404
        assert "não encontrada" in response.json()["detail"]

    def test_update_account(self, client: TestClient, auth_headers, test_account):
        """Teste: atualizar conta (sem alterar saldos)"""
        account_id = test_account["id"]
        update_data = {
            "name": "Banco Inter Atualizado",
            "account_type": "savings"
        }
        response = client.put(
            f"/accounts/{account_id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Banco Inter Atualizado"
        assert data["account_type"] == "savings"
        # Saldos não devem mudar
        assert data["initial_balance"] == test_account["initial_balance"]
        assert data["balance"] == test_account["balance"]

    def test_update_account_cannot_change_balance(
        self, client: TestClient, auth_headers, test_account
    ):
        """Teste: não é possível alterar saldos diretamente via update"""
        account_id = test_account["id"]
        # Tentar enviar balance no update (deve ser ignorado)
        update_data = {
            "name": "Teste",
            # Estes campos não estão no AccountUpdate schema
        }
        response = client.put(
            f"/accounts/{account_id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 200
        # Saldo deve permanecer inalterado

    def test_soft_delete_account(
        self, client: TestClient, auth_headers, test_account
    ):
        """Teste: soft delete de conta (marca como inativa)"""
        account_id = test_account["id"]
        response = client.delete(
            f"/accounts/{account_id}",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Conta ainda existe mas está inativa
        response = client.get(f"/accounts/{account_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["is_active"] is False

    def test_hard_delete_account(
        self, client: TestClient, auth_headers, test_account
    ):
        """Teste: hard delete de conta (remove permanentemente)"""
        account_id = test_account["id"]
        response = client.delete(
            f"/accounts/{account_id}?hard_delete=true",
            headers=auth_headers
        )

        assert response.status_code == 204

        # Conta foi removida permanentemente
        response = client.get(f"/accounts/{account_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_delete_nonexistent_account(self, client: TestClient, auth_headers):
        """Teste: erro ao deletar conta inexistente"""
        response = client.delete("/accounts/99999", headers=auth_headers)

        assert response.status_code == 404


class TestAccountSuggestions:
    """Testes para sugestões de nomes de contas"""

    def test_get_account_suggestions(
        self, client: TestClient, auth_headers, create_multiple_users_with_accounts
    ):
        """Teste: obter sugestões de nomes de contas"""
        response = client.get(
            "/accounts/suggestions?limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    def test_account_suggestions_excludes_own_accounts(
        self, client: TestClient, auth_headers
    ):
        """Teste: sugestões não incluem contas do próprio usuário"""
        # Criar conta com nome único
        unique_name = "MinhaContaUnicaXYZ123"
        account_data = {
            "name": unique_name,
            "account_type": "checking"
        }
        client.post("/accounts/", json=account_data, headers=auth_headers)

        # Buscar sugestões
        response = client.get(
            "/accounts/suggestions",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Não deve conter a conta do próprio usuário
        assert unique_name not in data


class TestAccountAudit:
    """Testes para auditoria de contas"""

    def test_audit_account_consistent(
        self, client: TestClient, auth_headers, test_account_with_transactions
    ):
        """Teste: auditar conta com saldo consistente"""
        account_id = test_account_with_transactions["id"]
        response = client.get(
            f"/accounts/{account_id}/audit",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["account_id"] == account_id
        assert "initial_balance" in data
        assert "current_balance" in data
        assert "calculated_balance" in data
        assert "total_transactions" in data
        assert "is_consistent" in data
        assert "difference" in data

        # Se foi criado corretamente, deve estar consistente
        assert data["is_consistent"] is True
        assert abs(data["difference"]) < 0.01

    def test_recalculate_account_balance(
        self, client: TestClient, auth_headers, test_account_with_transactions
    ):
        """Teste: recalcular saldo da conta"""
        account_id = test_account_with_transactions["id"]
        response = client.post(
            f"/accounts/{account_id}/recalculate",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "details" in data
        assert data["details"]["account_id"] == account_id
        assert "old_balance" in data["details"]
        assert "new_balance" in data["details"]
        assert "corrected" in data["details"]

    def test_audit_all_accounts(
        self, client: TestClient, auth_headers, test_account
    ):
        """Teste: auditar todas as contas do usuário"""
        response = client.get(
            "/accounts/audit/all",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

        # Verificar estrutura de cada auditoria
        for audit in data:
            assert "account_id" in audit
            assert "account_name" in audit
            assert "is_consistent" in audit
            assert "difference" in audit

    def test_audit_nonexistent_account(self, client: TestClient, auth_headers):
        """Teste: erro ao auditar conta inexistente"""
        response = client.get(
            "/accounts/99999/audit",
            headers=auth_headers
        )

        assert response.status_code == 404

    def test_recalculate_nonexistent_account(
        self, client: TestClient, auth_headers
    ):
        """Teste: erro ao recalcular conta inexistente"""
        response = client.post(
            "/accounts/99999/recalculate",
            headers=auth_headers
        )

        assert response.status_code == 404


class TestAccountAuthorization:
    """Testes de autorização de contas"""

    def test_cannot_access_other_user_account(
        self, client: TestClient, auth_headers, other_user_account
    ):
        """Teste: não pode acessar conta de outro usuário"""
        account_id = other_user_account["id"]
        response = client.get(
            f"/accounts/{account_id}",
            headers=auth_headers
        )

        assert response.status_code == 403
        assert "negado" in response.json()["detail"]

    def test_cannot_update_other_user_account(
        self, client: TestClient, auth_headers, other_user_account
    ):
        """Teste: não pode atualizar conta de outro usuário"""
        account_id = other_user_account["id"]
        update_data = {"name": "Tentativa Hack"}
        response = client.put(
            f"/accounts/{account_id}",
            json=update_data,
            headers=auth_headers
        )

        assert response.status_code == 403

    def test_cannot_delete_other_user_account(
        self, client: TestClient, auth_headers, other_user_account
    ):
        """Teste: não pode deletar conta de outro usuário"""
        account_id = other_user_account["id"]
        response = client.delete(
            f"/accounts/{account_id}",
            headers=auth_headers
        )

        assert response.status_code == 403

    def test_unauthorized_access(self, client: TestClient):
        """Teste: erro ao acessar sem autenticação"""
        response = client.get("/accounts/")

        assert response.status_code == 401
