# 🧪 Guia de Testes da API

Este documento explica como testar todas as APIs do Finance App e identificar bugs.

## 📋 Scripts Disponíveis

### 1. `test_all_apis.py` - Teste Completo
Script completo que testa TODOS os endpoints da API com validações detalhadas.

**Recursos:**
- ✅ Testa autenticação (registro, login, troca de senha)
- ✅ Testa usuários (perfil, atualização)
- ✅ Testa categorias (CRUD + sugestões)
- ✅ Testa contas (CRUD + sugestões + auditoria)
- ✅ Testa transações (CRUD + sugestões + impacto no saldo)
- ✅ Testa segurança (acesso sem token, token inválido)
- ✅ Testa integridade (recálculo de saldos, auditoria)
- 📊 Gera relatório completo com bugs encontrados
- 🎨 Output colorido e organizado

**Como usar:**
```bash
cd backend
python test_all_apis.py
```

O script vai perguntar a URL da API (deixe em branco para usar localhost:8000).

### 2. `quick_test.py` - Teste Rápido
Script rápido que testa os principais endpoints em poucos segundos.

**Como usar:**
```bash
cd backend
python quick_test.py
```

**IMPORTANTE:** Edite o arquivo e coloque suas credenciais:
```python
r = test_endpoint("POST", "/auth/login",
    {"username": "SEU_USERNAME", "password": "SUA_SENHA"},
    name="Login")
```

### 3. `run_tests.py` - Testes Unitários
Script para executar testes unitários com pytest.

**Como usar:**
```bash
# Todos os testes
python run_tests.py all

# Apenas testes rápidos
python run_tests.py fast

# Apenas integração
python run_tests.py integration

# Módulo específico
python run_tests.py transactions
python run_tests.py accounts
```

## 🚀 Testando em Produção (Railway)

Para testar a API em produção:

```bash
python test_all_apis.py
# Quando perguntar a URL, digite:
https://backend-production-01bf8.up.railway.app
```

## 📊 O que cada script testa

### test_all_apis.py

#### 🔐 Autenticação
- ✅ Registro de novo usuário
- ✅ Login com credenciais corretas
- ✅ Rejeição de senha incorreta
- ✅ Rejeição de username duplicado

#### 👤 Usuários
- ✅ Obter perfil
- ✅ Atualizar perfil
- ✅ Trocar senha
- ✅ Login com nova senha

#### 📁 Categorias
- ✅ Listar categorias
- ✅ Criar categoria
- ✅ Obter sugestões
- ✅ Atualizar categoria
- ✅ Rejeição de categoria duplicada

#### 💰 Contas
- ✅ Listar contas
- ✅ Criar conta com saldo inicial
- ✅ Verificar initial_balance = balance (conta nova)
- ✅ Obter sugestões
- ✅ Atualizar conta
- ✅ Proteção contra alteração direta de balance
- ✅ Auditoria de conta individual
- ✅ Recálculo de saldo
- ✅ Auditoria geral de todas as contas

#### 💳 Transações
- ✅ Listar transações
- ✅ Criar transação de despesa
- ✅ Verificar atualização de saldo (despesa)
- ✅ Criar transação de receita
- ✅ Verificar atualização de saldo (receita)
- ✅ Atualizar transação
- ✅ Sugestões de descrições
- ✅ Sugestões filtradas por tipo
- ✅ Deletar transação
- ✅ Verificar reversão de saldo ao deletar
- ✅ Criar transação sem conta (opcional)

#### 🔒 Segurança
- ✅ Rejeição de acesso sem token
- ✅ Rejeição de token inválido
- ✅ Rejeição de recurso inexistente (404)

#### 🔍 Integridade
- ✅ Recálculo de saldo
- ✅ Auditoria geral
- ✅ Detecção de inconsistências

## 🐛 Como identificar bugs

O script `test_all_apis.py` automaticamente:

1. **Executa todos os testes**
2. **Marca como FAIL** testes que falharam
3. **Gera relatório final** com lista de bugs

### Exemplo de Output:

```
✅ PASS - Registro de usuário
✅ PASS - Login de usuário
❌ FAIL - Proteção contra alteração de balance
   Detalhes: Balance foi alterado diretamente!

================================================================================
                              RELATÓRIO FINAL
================================================================================

📊 Estatísticas:
   Total de testes: 45
   ✅ Passaram: 44
   ❌ Falharam: 1
   Taxa de sucesso: 97.8%

🐛 BUGS ENCONTRADOS (1):
   1. Proteção contra alteração de balance: Balance foi alterado diretamente!
```

## 📝 Checklist de Testes Manuais

Se quiser testar manualmente, use este checklist:

### Autenticação
- [ ] Consegue registrar novo usuário
- [ ] Consegue fazer login
- [ ] Login rejeita senha errada
- [ ] Não permite username duplicado

### Categorias
- [ ] Lista categorias corretamente
- [ ] Cria nova categoria
- [ ] Sugestões aparecem
- [ ] Atualiza categoria
- [ ] Não permite nome duplicado

### Contas
- [ ] Lista contas
- [ ] Cria conta com saldo inicial
- [ ] Initial balance aparece correto
- [ ] Balance começa igual a initial_balance
- [ ] Sugestões de nomes aparecem
- [ ] Atualiza nome/tipo da conta
- [ ] **NÃO permite alterar balance diretamente**
- [ ] Auditoria mostra dados corretos

### Transações
- [ ] Lista transações
- [ ] Cria despesa (valor negativo)
- [ ] Balance da conta diminui
- [ ] Cria receita (valor positivo)
- [ ] Balance da conta aumenta
- [ ] Sugestões de descrição aparecem
- [ ] Filtra sugestões por tipo
- [ ] Atualiza transação
- [ ] Deleta transação
- [ ] Balance reverte ao deletar

### Integridade
- [ ] Recalcular saldo funciona
- [ ] Auditoria detecta inconsistências
- [ ] Initial balance + transações = balance atual

## 🔧 Instalando Dependências

Se não tiver o `requests` instalado:

```bash
pip install requests
```

## 💡 Dicas

1. **Execute primeiro o teste completo** para ter visão geral
2. **Se encontrar bugs**, anote o nome exato do teste que falhou
3. **Use quick_test.py** para validações rápidas durante desenvolvimento
4. **Teste em produção** após cada deploy
5. **Execute testes unitários** com `python run_tests.py all` regularmente

## 📞 Reportando Bugs

Quando encontrar um bug, anote:
- ✅ Nome do teste que falhou
- ✅ Status HTTP retornado
- ✅ Mensagem de erro
- ✅ Comportamento esperado vs atual
- ✅ URL da API testada (local ou produção)

## 🎯 Próximos Passos

Após rodar os testes:

1. **Se tudo passou (100%)**: Sua API está funcionando perfeitamente! ✨
2. **Se encontrou bugs**: Priorize corrigir os de integridade e segurança primeiro
3. **Automatize**: Configure CI/CD para rodar testes a cada commit

---

**Criado por:** Claude Code
**Data:** 06/12/2025
