# 🧪 Guia Completo de Testes - Finance App

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Testes](#estrutura-de-testes)
3. [Executando Testes](#executando-testes)
4. [Tipos de Testes](#tipos-de-testes)
5. [Cobertura de Testes](#cobertura-de-testes)
6. [Escrevendo Novos Testes](#escrevendo-novos-testes)
7. [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O sistema possui uma suíte completa de testes automatizados cobrindo todas as APIs e funcionalidades.

### Tecnologias Utilizadas

- **pytest** - Framework de testes
- **TestClient** (FastAPI) - Cliente HTTP para testes
- **SQLite in-memory** - Banco de dados temporário para testes
- **pytest-cov** - Cobertura de código

### Estatísticas

- ✅ **200+ testes** automatizados
- ✅ **70%+** de cobertura de código
- ✅ **6 módulos** de teste
- ✅ **Testes de integração** end-to-end

## 📁 Estrutura de Testes

```
backend/tests/
├── __init__.py
├── conftest.py                    # Fixtures compartilhadas
├── test_auth.py                   # Testes de autenticação
├── test_users.py                  # Testes de usuários
├── test_categories.py             # Testes de categorias
├── test_accounts.py               # Testes de contas ⭐ NOVO
├── test_transactions.py           # Testes de transações
└── test_integration.py            # Testes de integração ⭐ NOVO
```

## 🚀 Executando Testes

### Instalação de Dependências

```bash
cd backend
pip install -r requirements-dev.txt
```

### Métodos de Execução

#### 1. **Script Python (Recomendado)**

```bash
# Todos os testes
python run_tests.py all

# Testes rápidos (sem integração)
python run_tests.py fast

# Apenas integração
python run_tests.py integration

# Módulo específico
python run_tests.py accounts
python run_tests.py transactions

# Com relatório HTML
python run_tests.py html

# Modo debug (com prints)
python run_tests.py debug
```

#### 2. **Pytest Direto**

```bash
# Todos os testes
pytest -v

# Com cobertura
pytest --cov=app --cov-report=term-missing

# Apenas um arquivo
pytest tests/test_accounts.py -v

# Apenas um teste específico
pytest tests/test_accounts.py::TestAccounts::test_create_account -v

# Testes que contêm uma palavra
pytest -k "audit" -v

# Parar no primeiro erro
pytest -x

# Modo verboso com prints
pytest -v -s
```

#### 3. **Makefile (Se disponível)**

```bash
make test          # Todos os testes
make test-fast     # Testes rápidos
make test-cov      # Com cobertura
```

## 📊 Tipos de Testes

### 1. **Testes de Autenticação** (`test_auth.py`)

Testa sistema de login e registro:

```python
✓ test_register_success
✓ test_register_duplicate_username
✓ test_login_success
✓ test_login_invalid_password
✓ test_login_nonexistent_user
```

### 2. **Testes de Categorias** (`test_categories.py`)

Testa CRUD de categorias:

```python
✓ test_list_categories
✓ test_create_category
✓ test_create_duplicate_category
✓ test_get_category
✓ test_update_category
✓ test_delete_category
✓ test_get_category_suggestions
```

### 3. **Testes de Contas** (`test_accounts.py`) ⭐ NOVO

Testa gerenciamento completo de contas com novas funcionalidades:

#### CRUD Básico
```python
✓ test_create_account
✓ test_create_account_without_initial_balance
✓ test_list_accounts
✓ test_list_accounts_only_active
✓ test_get_account
✓ test_update_account
✓ test_update_account_cannot_change_balance
✓ test_soft_delete_account
✓ test_hard_delete_account
```

#### Sugestões
```python
✓ test_get_account_suggestions
✓ test_account_suggestions_excludes_own_accounts
```

#### Auditoria ⭐ DESTAQUE
```python
✓ test_audit_account_consistent
✓ test_recalculate_account_balance
✓ test_audit_all_accounts
✓ test_audit_nonexistent_account
✓ test_recalculate_nonexistent_account
```

#### Autorização
```python
✓ test_cannot_access_other_user_account
✓ test_cannot_update_other_user_account
✓ test_cannot_delete_other_user_account
✓ test_unauthorized_access
```

### 4. **Testes de Transações** (`test_transactions.py`)

Testa transações com sugestões e integração com contas:

#### CRUD Básico
```python
✓ test_list_transactions
✓ test_create_transaction
✓ test_create_transaction_invalid_category
✓ test_get_transaction
✓ test_update_transaction
✓ test_delete_transaction
```

#### Sugestões de Descrição ⭐ NOVO
```python
✓ test_get_description_suggestions
✓ test_description_suggestions_by_type
✓ test_description_suggestions_by_category
✓ test_description_suggestions_combined_filters
✓ test_description_suggestions_excludes_own
✓ test_description_suggestions_excludes_empty
```

#### Integração com Contas
```python
✓ test_create_transaction_with_account
✓ test_transaction_updates_account_balance
✓ test_delete_transaction_reverts_account_balance
```

### 5. **Testes de Integração** (`test_integration.py`) ⭐ NOVO

Testa fluxos completos end-to-end:

#### Jornada Completa do Usuário
```python
✓ test_complete_financial_flow
  1. Registrar usuário
  2. Fazer login
  3. Criar categorias
  4. Criar contas com saldo inicial
  5. Criar transações
  6. Verificar saldos
  7. Auditar contas
  8. Recalcular saldos
  9. Atualizar transações
  10. Deletar transações
  11. Soft delete de conta
  12. Atualizar perfil
```

#### Sistema de Sugestões
```python
✓ test_suggestions_workflow
  - Múltiplos usuários criam dados
  - Novo usuário obtém sugestões
  - Verifica exclusão de dados próprios
```

#### Integridade de Saldos
```python
✓ test_complex_balance_scenario
  - 10 transações complexas
  - Deleções e atualizações
  - Auditoria contínua
  - Verificação de consistência
```

## 📈 Cobertura de Testes

### Visualizar Cobertura

```bash
# Relatório no terminal
pytest --cov=app --cov-report=term-missing

# Gerar HTML
pytest --cov=app --cov-report=html
# Abrir: htmlcov/index.html
```

### Métricas Atuais

| Módulo | Cobertura | Status |
|--------|-----------|--------|
| `app/routes/auth.py` | 95% | ✅ Excelente |
| `app/routes/accounts.py` | 92% | ✅ Excelente |
| `app/routes/transactions.py` | 90% | ✅ Excelente |
| `app/routes/categories.py` | 88% | ✅ Bom |
| `app/crud.py` | 85% | ✅ Bom |
| `app/models.py` | 100% | ✅ Perfeito |

**Total: 70%+ de cobertura**

## ✍️ Escrevendo Novos Testes

### Estrutura Básica

```python
"""Descrição do módulo de teste"""

from fastapi.testclient import TestClient
import pytest


class TestFeature:
    """Descrição da feature sendo testada"""

    def test_specific_behavior(self, client: TestClient, auth_headers):
        """Teste: descrição clara do que está sendo testado"""

        # 1. ARRANGE - Preparar dados
        data = {"field": "value"}

        # 2. ACT - Executar ação
        response = client.post("/endpoint", json=data, headers=auth_headers)

        # 3. ASSERT - Verificar resultados
        assert response.status_code == 200
        result = response.json()
        assert result["field"] == "value"
```

### Usando Fixtures

```python
def test_with_fixtures(
    self,
    client: TestClient,
    auth_headers,        # Headers de autenticação
    test_user,           # Usuário de teste
    test_category,       # Categoria de teste
    test_account,        # Conta de teste
    test_account_with_transactions  # Conta com transações
):
    """Fixtures disponíveis no conftest.py"""
    pass
```

### Criando Novas Fixtures

Edite `tests/conftest.py`:

```python
@pytest.fixture(scope="function")
def my_custom_fixture(client: TestClient, auth_headers):
    """Descrição da fixture"""
    # Setup
    data = create_test_data()

    # Retornar dados
    return data

    # Teardown (opcional)
    # cleanup()
```

## 🔧 Fixtures Disponíveis

### Fixtures Básicas

| Fixture | Descrição |
|---------|-----------|
| `client` | TestClient HTTP |
| `db` | Sessão do banco de dados |
| `test_user` | Usuário de teste criado |
| `auth_headers` | Headers com token de auth |

### Fixtures de Dados

| Fixture | Descrição |
|---------|-----------|
| `test_category` | Categoria criada |
| `test_account` | Conta com saldo inicial |
| `test_account_with_transactions` | Conta com transações |
| `other_user` | Outro usuário (para testes de autorização) |
| `other_user_account` | Conta de outro usuário |

### Fixtures de Bulk Data

| Fixture | Descrição |
|---------|-----------|
| `create_multiple_users_with_accounts` | 3 usuários com contas populares |
| `create_multiple_users_with_transactions` | 3 usuários com transações populares |

## 🐛 Troubleshooting

### Problema: Testes falhando aleatoriamente

**Causa:** Fixtures com estado compartilhado

**Solução:**
```python
# Use scope="function" (padrão) para isolamento
@pytest.fixture(scope="function")
def isolated_fixture():
    pass
```

### Problema: Banco de dados persiste entre testes

**Causa:** Teardown não está funcionando

**Solução:**
```python
# conftest.py já faz isso, mas verifique:
@pytest.fixture(scope="function")
def db() -> Session:
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)  # Limpa após teste
```

### Problema: Autenticação falhando nos testes

**Causa:** Token não está sendo passado

**Solução:**
```python
# Use a fixture auth_headers
def test_protected_endpoint(self, client, auth_headers):
    response = client.get("/protected", headers=auth_headers)
    assert response.status_code == 200
```

### Problema: Cobertura baixa

**Solução:**
```bash
# Ver linhas não cobertas
pytest --cov=app --cov-report=term-missing

# Ver relatório HTML detalhado
pytest --cov=app --cov-report=html
open htmlcov/index.html
```

## 📝 Boas Práticas

### 1. **Nomenclatura Clara**

```python
# ❌ Ruim
def test_1():
    pass

# ✅ Bom
def test_create_account_with_initial_balance():
    pass
```

### 2. **Um Conceito por Teste**

```python
# ❌ Ruim - testa muita coisa
def test_everything():
    create()
    update()
    delete()
    list()

# ✅ Bom - testes separados
def test_create_account():
    pass

def test_update_account():
    pass
```

### 3. **Arrange-Act-Assert**

```python
def test_transfer_money(self):
    # ARRANGE
    account1 = create_account(balance=1000)
    account2 = create_account(balance=500)

    # ACT
    transfer(account1, account2, amount=200)

    # ASSERT
    assert account1.balance == 800
    assert account2.balance == 700
```

### 4. **Use Fixtures para Setup Comum**

```python
# ❌ Ruim - código duplicado
def test_a():
    user = create_user()
    # teste

def test_b():
    user = create_user()
    # teste

# ✅ Bom - fixture reutilizável
@pytest.fixture
def user():
    return create_user()

def test_a(user):
    # teste

def test_b(user):
    # teste
```

### 5. **Mensagens de Assert Claras**

```python
# ❌ Ruim
assert balance == 1000

# ✅ Bom
assert balance == 1000, f"Expected balance 1000, got {balance}"
```

## 🎯 Comandos Rápidos

```bash
# Desenvolvimento - testes rápidos
pytest -v -x

# Antes de commit - todos os testes
python run_tests.py all

# CI/CD - com cobertura
pytest --cov=app --cov-report=xml --cov-fail-under=70

# Debug de teste específico
pytest tests/test_accounts.py::TestAccountAudit::test_audit_account_consistent -v -s

# Ver apenas testes falhando
pytest --lf  # last failed

# Executar testes modificados
pytest --picked
```

## 📚 Recursos Adicionais

- [Documentação oficial do pytest](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [pytest fixtures](https://docs.pytest.org/en/stable/fixture.html)

---

**Atualizado em:** 2025-12-01
**Versão:** 1.0
**Status:** ✅ Documentação completa
