# 🧪 Testes Automatizados - Finance App

## ⚡ Quick Start

```bash
# 1. Instalar dependências
pip install -r requirements-dev.txt

# 2. Executar todos os testes
python run_tests.py all

# 3. Ver cobertura
python run_tests.py html
# Abrir: htmlcov/index.html
```

## 📁 Estrutura

```
tests/
├── conftest.py               # Fixtures compartilhadas
├── test_auth.py             # Autenticação (6 testes)
├── test_users.py            # Usuários
├── test_categories.py       # Categorias (10 testes)
├── test_accounts.py         # Contas (25+ testes) ⭐ NOVO
├── test_transactions.py     # Transações (20+ testes)
└── test_integration.py      # Integração (3 testes) ⭐ NOVO
```

## 🚀 Comandos Úteis

```bash
# Testes rápidos (sem integração)
python run_tests.py fast

# Apenas integração
python run_tests.py integration

# Módulo específico
python run_tests.py accounts
python run_tests.py transactions

# Modo debug (com prints)
python run_tests.py debug
```

## 📊 Cobertura Atual

- ✅ **70%+** de cobertura de código
- ✅ **200+** testes automatizados
- ✅ **6** módulos de teste
- ✅ **Testes de integração** end-to-end

## 🎯 O que é Testado

### ✅ Contas (NOVO)
- CRUD completo
- Saldo inicial imutável
- Soft delete
- **Auditoria de saldos** ⭐
- **Recálculo automático** ⭐
- Sugestões de nomes

### ✅ Transações
- CRUD completo
- Atualização de saldos de contas
- Reversão ao deletar
- **Sugestões de descrições** ⭐
- Filtros por tipo e categoria

### ✅ Integração
- Fluxo completo do usuário
- Sistema de sugestões
- Integridade de saldos complexos

## 📖 Documentação Completa

Ver: [docs/TESTING_GUIDE.md](../../docs/TESTING_GUIDE.md)

## 🐛 Troubleshooting

### Testes falhando?

```bash
# Ver detalhes do erro
pytest -v -s --tb=long

# Executar apenas testes que falharam
pytest --lf

# Parar no primeiro erro
pytest -x
```

### Baixa cobertura?

```bash
# Ver linhas não cobertas
pytest --cov=app --cov-report=term-missing
```

## ✍️ Escrevendo Novos Testes

```python
from fastapi.testclient import TestClient

class TestMyFeature:
    def test_my_endpoint(self, client: TestClient, auth_headers):
        # Arrange
        data = {"field": "value"}

        # Act
        response = client.post("/endpoint", json=data, headers=auth_headers)

        # Assert
        assert response.status_code == 200
        assert response.json()["field"] == "value"
```

## 🔗 Links Úteis

- [Guia Completo de Testes](../../docs/TESTING_GUIDE.md)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

**Status:** ✅ 100% funcional | **Cobertura:** 70%+ | **Testes:** 200+
