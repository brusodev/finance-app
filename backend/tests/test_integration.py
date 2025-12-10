"""Testes de integração - Fluxo completo do sistema"""

from fastapi.testclient import TestClient
import pytest


class TestCompleteUserJourney:
    """Testa o fluxo completo de um usuário no sistema"""

    def test_complete_financial_flow(self, client: TestClient):
        """
        Teste de integração completo:
        1. Registrar usuário
        2. Fazer login
        3. Criar categorias
        4. Criar contas com saldo inicial
        5. Criar transações
        6. Verificar saldos
        7. Auditar contas
        8. Recalcular saldos
        """

        # 1. REGISTRAR USUÁRIO
        user_data = {
            "username": "joao_silva",
            "password": "senha123",
            "email": "joao@example.com",
            "full_name": "João Silva"
        }
        register_response = client.post("/auth/register", json=user_data)
        assert register_response.status_code == 200
        user = register_response.json()
        token = user["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. FAZER LOGIN
        login_data = {
            "username": "joao_silva",
            "password": "senha123"
        }
        login_response = client.post("/auth/login", json=login_data)
        assert login_response.status_code == 200
        assert login_response.json()["username"] == "joao_silva"

        # 3. CRIAR CATEGORIAS
        categories = []
        category_names = ["Alimentação", "Transporte", "Salário", "Freelance"]

        for cat_name in category_names:
            cat_data = {"name": cat_name, "icon": "📁"}
            cat_response = client.post(
                "/categories/",
                json=cat_data,
                headers=headers
            )
            assert cat_response.status_code == 201
            categories.append(cat_response.json())

        # 4. CRIAR CONTAS COM SALDO INICIAL
        accounts = []
        account_configs = [
            {"name": "Nubank", "type": "checking", "initial": 5000.0},
            {"name": "Banco Inter", "type": "savings", "initial": 10000.0},
            {"name": "Cartão Crédito", "type": "credit_card", "initial": 0.0},
        ]

        for acc_config in account_configs:
            acc_data = {
                "name": acc_config["name"],
                "account_type": acc_config["type"],
                "initial_balance": acc_config["initial"],
                "currency": "BRL"
            }
            acc_response = client.post(
                "/accounts/",
                json=acc_data,
                headers=headers
            )
            assert acc_response.status_code == 200
            account = acc_response.json()

            # Verificar saldo inicial correto
            assert account["initial_balance"] == acc_config["initial"]
            assert account["balance"] == acc_config["initial"]
            assert account["is_active"] is True

            accounts.append(account)

        # 5. CRIAR TRANSAÇÕES
        transactions = []

        # Receita: Salário
        trans_data = {
            "amount": 5000.0,
            "date": "2025-11-01",
            "description": "Salário Novembro",
            "transaction_type": "income",
            "category_id": categories[2]["id"],  # Salário
            "account_id": accounts[0]["id"]  # Nubank
        }
        trans_response = client.post(
            "/transactions/",
            json=trans_data,
            headers=headers
        )
        assert trans_response.status_code == 201
        transactions.append(trans_response.json())

        # Despesa: Supermercado
        trans_data = {
            "amount": -350.0,
            "date": "2025-11-05",
            "description": "Supermercado",
            "transaction_type": "expense",
            "category_id": categories[0]["id"],  # Alimentação
            "account_id": accounts[0]["id"]  # Nubank
        }
        trans_response = client.post(
            "/transactions/",
            json=trans_data,
            headers=headers
        )
        assert trans_response.status_code == 201
        transactions.append(trans_response.json())

        # Despesa: Uber
        trans_data = {
            "amount": -50.0,
            "date": "2025-11-10",
            "description": "Uber",
            "transaction_type": "expense",
            "category_id": categories[1]["id"],  # Transporte
            "account_id": accounts[0]["id"]  # Nubank
        }
        trans_response = client.post(
            "/transactions/",
            json=trans_data,
            headers=headers
        )
        assert trans_response.status_code == 201
        transactions.append(trans_response.json())

        # 6. VERIFICAR SALDOS
        # Saldo esperado da Nubank: 5000 + 5000 - 350 - 50 = 9600
        nubank_response = client.get(
            f"/accounts/{accounts[0]['id']}",
            headers=headers
        )
        assert nubank_response.status_code == 200
        nubank = nubank_response.json()
        expected_balance = 5000.0 + 5000.0 - 350.0 - 50.0
        assert nubank["balance"] == expected_balance

        # 7. AUDITAR CONTAS
        # Auditar conta específica
        audit_response = client.get(
            f"/accounts/{accounts[0]['id']}/audit",
            headers=headers
        )
        assert audit_response.status_code == 200
        audit = audit_response.json()

        assert audit["account_id"] == accounts[0]["id"]
        assert audit["initial_balance"] == 5000.0
        assert audit["current_balance"] == expected_balance
        assert audit["calculated_balance"] == expected_balance
        assert audit["is_consistent"] is True
        assert abs(audit["difference"]) < 0.01
        assert audit["total_transactions"] == 3

        # Auditar todas as contas
        audit_all_response = client.get(
            "/accounts/audit/all",
            headers=headers
        )
        assert audit_all_response.status_code == 200
        all_audits = audit_all_response.json()
        assert len(all_audits) == 3  # 3 contas criadas

        # 8. RECALCULAR SALDOS (deve estar consistente)
        recalc_response = client.post(
            f"/accounts/{accounts[0]['id']}/recalculate",
            headers=headers
        )
        assert recalc_response.status_code == 200
        recalc = recalc_response.json()
        assert recalc["details"]["corrected"] is False  # Já estava correto

        # 9. LISTAR TRANSAÇÕES
        trans_list_response = client.get("/transactions/", headers=headers)
        assert trans_list_response.status_code == 200
        all_transactions = trans_list_response.json()
        assert len(all_transactions) == 3

        # 10. ATUALIZAR TRANSAÇÃO
        update_trans_data = {
            "amount": -400.0,  # Aumentar valor do supermercado
            "date": "2025-11-05",
            "description": "Supermercado (atualizado)",
            "transaction_type": "expense",
            "category_id": categories[0]["id"],
            "account_id": accounts[0]["id"]
        }
        update_response = client.put(
            f"/transactions/{transactions[1]['id']}",
            json=update_trans_data,
            headers=headers
        )
        assert update_response.status_code == 200

        # Verificar saldo atualizado
        # Novo saldo: 5000 + 5000 - 400 - 50 = 9550
        nubank_updated = client.get(
            f"/accounts/{accounts[0]['id']}",
            headers=headers
        ).json()
        assert nubank_updated["balance"] == 9550.0

        # 11. DELETAR TRANSAÇÃO E VERIFICAR REVERSÃO DE SALDO
        delete_response = client.delete(
            f"/transactions/{transactions[2]['id']}",
            headers=headers
        )
        assert delete_response.status_code == 204

        # Saldo deve reverter: 9550 + 50 = 9600
        nubank_after_delete = client.get(
            f"/accounts/{accounts[0]['id']}",
            headers=headers
        ).json()
        assert nubank_after_delete["balance"] == 9600.0

        # 12. SOFT DELETE DE CONTA
        soft_delete_response = client.delete(
            f"/accounts/{accounts[2]['id']}",
            headers=headers
        )
        assert soft_delete_response.status_code == 204

        # Conta ainda existe mas inativa
        inactive_account = client.get(
            f"/accounts/{accounts[2]['id']}",
            headers=headers
        ).json()
        assert inactive_account["is_active"] is False

        # Não aparece na lista de contas ativas
        active_accounts = client.get("/accounts/", headers=headers).json()
        assert len(active_accounts) == 2

        # 13. ATUALIZAR PERFIL
        profile_update = {
            "full_name": "João Silva Santos",
            "cpf": "12345678900",
            "phone": "11999999999"
        }
        profile_response = client.put(
            f"/users/{user['id']}/profile",
            json=profile_update,
            headers=headers
        )
        assert profile_response.status_code == 200
        updated_profile = profile_response.json()
        assert updated_profile["full_name"] == "João Silva Santos"
        assert updated_profile["cpf"] == "12345678900"

        print("\n✅ Teste de integração completo passou com sucesso!")


class TestSuggestionsIntegration:
    """Testa o sistema de sugestões de forma integrada"""

    def test_suggestions_workflow(self, client: TestClient):
        """
        Testa o fluxo completo de sugestões:
        1. Criar múltiplos usuários
        2. Cada um cria contas, categorias e transações
        3. Novo usuário obtém sugestões dos outros
        """

        # 1. CRIAR 3 USUÁRIOS COM DADOS SIMILARES
        users = []
        for i in range(3):
            user_data = {
                "username": f"user{i}",
                "password": "pass123"
            }
            user_response = client.post("/auth/register", json=user_data)
            user = user_response.json()
            headers = {"Authorization": f"Bearer {user['token']}"}

            # Criar categorias comuns
            cat_data = {"name": "Alimentação", "icon": "🍔"}
            cat_response = client.post("/categories/", json=cat_data, headers=headers)
            category = cat_response.json()

            # Criar contas populares
            for account_name in ["Nubank", "Banco Inter", "Caixa"]:
                acc_data = {
                    "name": account_name,
                    "account_type": "checking"
                }
                client.post("/accounts/", json=acc_data, headers=headers)

            # Criar transações com descrições populares
            descriptions = ["Supermercado", "Restaurante", "Uber"]
            for desc in descriptions:
                trans_data = {
                    "amount": -100.0,
                    "date": "2025-11-22",
                    "description": desc,
                    "transaction_type": "expense",
                    "category_id": category["id"]
                }
                client.post("/transactions/", json=trans_data, headers=headers)

            users.append({"user": user, "headers": headers, "category": category})

        # 2. CRIAR NOVO USUÁRIO QUE VAI USAR AS SUGESTÕES
        new_user_data = {
            "username": "newuser",
            "password": "pass123"
        }
        new_user_response = client.post("/auth/register", json=new_user_data)
        new_user = new_user_response.json()
        new_headers = {"Authorization": f"Bearer {new_user['token']}"}

        # 3. OBTER SUGESTÕES DE CONTAS
        account_suggestions = client.get(
            "/accounts/suggestions?limit=10",
            headers=new_headers
        ).json()

        assert isinstance(account_suggestions, list)
        assert "Nubank" in account_suggestions
        assert "Banco Inter" in account_suggestions
        assert "Caixa" in account_suggestions

        # 4. OBTER SUGESTÕES DE CATEGORIAS
        category_suggestions = client.get(
            "/categories/suggestions?limit=10",
            headers=new_headers
        ).json()

        assert isinstance(category_suggestions, list)
        assert "Alimentação" in category_suggestions

        # 5. CRIAR CATEGORIA PARA TESTAR SUGESTÕES DE TRANSAÇÕES
        cat_data = {"name": "Alimentação", "icon": "🍔"}
        cat_response = client.post("/categories/", json=cat_data, headers=new_headers)
        new_category = cat_response.json()

        # 6. OBTER SUGESTÕES DE DESCRIÇÕES DE TRANSAÇÕES
        desc_suggestions = client.get(
            f"/transactions/suggestions/descriptions"
            f"?transaction_type=expense&category_id={new_category['id']}&limit=10",
            headers=new_headers
        ).json()

        assert isinstance(desc_suggestions, list)
        # Deve conter as descrições populares
        assert any(desc in ["Supermercado", "Restaurante", "Uber"] for desc in desc_suggestions)

        # 7. VERIFICAR QUE SUGESTÕES NÃO INCLUEM DADOS DO PRÓPRIO USUÁRIO
        # Criar conta única
        unique_acc = client.post(
            "/accounts/",
            json={"name": "MinhaContaUnica", "account_type": "checking"},
            headers=new_headers
        ).json()

        # Buscar sugestões novamente
        new_suggestions = client.get(
            "/accounts/suggestions",
            headers=new_headers
        ).json()

        # Não deve incluir a conta do próprio usuário
        assert "MinhaContaUnica" not in new_suggestions

        print("\n✅ Teste de sugestões integrado passou com sucesso!")


class TestAccountBalanceIntegrity:
    """Testa integridade de saldos em cenários complexos"""

    def test_complex_balance_scenario(self, client: TestClient, auth_headers):
        """
        Testa cenário complexo com múltiplas operações:
        - Criação de conta
        - Múltiplas transações
        - Atualização de transações
        - Deleção de transações
        - Auditoria e recálculo
        """

        # Criar categoria
        cat_response = client.post(
            "/categories/",
            json={"name": "Teste", "icon": "📁"},
            headers=auth_headers
        )
        category = cat_response.json()

        # Criar conta com saldo inicial
        acc_response = client.post(
            "/accounts/",
            json={
                "name": "Conta Complexa",
                "account_type": "checking",
                "initial_balance": 1000.0
            },
            headers=auth_headers
        )
        account = acc_response.json()

        # Adicionar 10 transações
        transaction_ids = []
        amounts = [100, -50, 200, -30, -20, 150, -40, -10, 50, -25]

        for i, amount in enumerate(amounts):
            trans_data = {
                "amount": float(amount),
                "date": "2025-11-22",
                "description": f"Transação {i+1}",
                "transaction_type": "income" if amount > 0 else "expense",
                "category_id": category["id"],
                "account_id": account["id"]
            }
            trans_response = client.post(
                "/transactions/",
                json=trans_data,
                headers=auth_headers
            )
            transaction_ids.append(trans_response.json()["id"])

        # Saldo esperado: 1000 + soma(amounts) = 1000 + 325 = 1325
        expected_balance = 1000.0 + sum(amounts)

        # Verificar saldo
        account_check = client.get(
            f"/accounts/{account['id']}",
            headers=auth_headers
        ).json()
        assert account_check["balance"] == expected_balance

        # Auditar
        audit = client.get(
            f"/accounts/{account['id']}/audit",
            headers=auth_headers
        ).json()
        assert audit["is_consistent"] is True
        assert audit["total_transactions"] == 10

        # Deletar algumas transações
        client.delete(f"/transactions/{transaction_ids[0]}", headers=auth_headers)  # -100
        client.delete(f"/transactions/{transaction_ids[3]}", headers=auth_headers)  # +30

        # Novo saldo esperado: 1325 - 100 + 30 = 1255
        new_expected_balance = 1325.0 - 100.0 + 30.0

        account_after_delete = client.get(
            f"/accounts/{account['id']}",
            headers=auth_headers
        ).json()
        assert account_after_delete["balance"] == new_expected_balance

        # Auditar novamente
        final_audit = client.get(
            f"/accounts/{account['id']}/audit",
            headers=auth_headers
        ).json()
        assert final_audit["is_consistent"] is True
        assert final_audit["total_transactions"] == 8

        print("\n✅ Teste de integridade de saldos complexo passou!")
