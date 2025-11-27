# 📋 PLANO DE IMPLEMENTAÇÃO - FINANCE APP

**Data**: 22 de Novembro de 2025
**Status**: Iniciado
**Branch**: `feature/backend-implementation`

---

## 🎯 Objetivo Geral
Implementar endpoints, componentes e testes para tornar a Finance App totalmente funcional.

---

## 📊 Estado Atual da Aplicação

### ✅ JÁ EXISTE
- Modelos SQLAlchemy (User, Category, Transaction)
- Schemas Pydantic básicos
- Database.py com SQLite configurado
- init_db.py funcionando
- main.jsx e index.html presentes
- React Router estruturado
- Frontend rodando em http://localhost:3001
- Backend rodando em http://localhost:8000

### ❌ FALTAM
- Endpoints implementados (routes estão vazias/incompletas)
- Funções CRUD completas
- Autenticação e validação
- Componentes React funcionais
- Integração API frontend-backend
- Testes
- GitHub Actions CI/CD

---

## 🚀 FASES DE IMPLEMENTAÇÃO

### FASE 1️⃣: BACKEND - Preparação (THIS TASK)
**Status**: ⏳ EM ANDAMENTO

#### A1: Database Setup ✅
- [x] database.py com SQLite OK
- [x] init_db.py criado e testado
- [x] finance.db gerado com sucesso

#### A2: Limpar e Padronizar Modelos
- [ ] Remover tipos UUID (usar Integer como PK)
- [ ] Remover campos desnecessários (color, type_enum)
- [ ] Adicionar timestamps (created_at, updated_at)
- [ ] Adicionar relacionamentos corretos

#### A3: Implementar CRUD Completo (crud.py)
- [ ] get_user, create_user, update_user, delete_user
- [ ] get_category, create_category, update_category, delete_category
- [ ] get_transaction, create_transaction, update_transaction, delete_transaction
- [ ] Validações de FK

#### A4: Implementar Rotas (routes/*.py)
- [ ] auth.py: POST /register, POST /login, POST /logout
- [ ] users.py: GET /, POST /, GET /{id}, PUT /{id}, DELETE /{id}
- [ ] categories.py: GET /, POST /, PUT /{id}, DELETE /{id}
- [ ] transactions.py: GET /, POST /, PUT /{id}, DELETE /{id}

#### A5: Integrar com main.py
- [ ] include_router para cada rota
- [ ] Middleware de CORS atualizado
- [ ] Tratamento global de erros

---

### FASE 2️⃣: BACKEND - Testes
**Status**: ⏳ ESPERANDO

#### A6: Criar Testes (backend/tests/)
- [ ] Configurar pytest
- [ ] test_users.py
- [ ] test_auth.py
- [ ] test_categories.py
- [ ] test_transactions.py

#### A7: Documentação API (docs/BACKEND.md)
- [ ] Exemplos de requests
- [ ] Exemplos de responses
- [ ] Códigos de status HTTP

---

### FASE 3️⃣: FRONTEND
**Status**: ⏳ ESPERANDO

#### B1: Criar API Client (services/api.js)
- [ ] Configurar axios ou fetch
- [ ] Funções para auth
- [ ] Funções para CRUD

#### B2: Implementar Componentes
- [ ] Login.jsx
- [ ] Register.jsx
- [ ] Dashboard.jsx (com lista de transações)
- [ ] TransactionForm.jsx
- [ ] TransactionList.jsx
- [ ] CategorySelect.jsx

#### B3: State Management
- [ ] Context API ou Redux (se necessário)
- [ ] Auth context
- [ ] Transações context

---

### FASE 4️⃣: QA / DevOps
**Status**: ⏳ ESPERANDO

#### C1: Lint & Format
- [ ] flake8 no backend
- [ ] black no backend
- [ ] eslint no frontend
- [ ] prettier no frontend

#### C2: GitHub Actions
- [ ] Workflow CI/CD
- [ ] Backend: pytest
- [ ] Frontend: build + tests

#### C3: Documentação Final
- [ ] README.md atualizado
- [ ] Scripts funcionando

---

## 📅 TAREFAS IMEDIATAS (Próximas 2 horas)

1. **[AGORA]** Limpar models.py (remover UUID, simplificar)
2. **[AGORA]** Implementar crud.py completo
3. **[AGORA]** Implementar routes/auth.py
4. **[AGORA]** Implementar routes/users.py
5. **[PRÓXIMO]** Implementar routes/categories.py
6. **[PRÓXIMO]** Implementar routes/transactions.py
7. **[PRÓXIMO]** Integrar com main.py
8. **[PRÓXIMO]** Testar com Swagger em http://localhost:8000/docs

---

## 🔍 CHECKLIST DE QUALIDADE

Para cada tarefa concluída:
- [ ] Código segue padrão PEP 8
- [ ] Testes locais passando
- [ ] Endpoint testado em /docs (Swagger)
- [ ] Commit com mensagem clara
- [ ] Nenhum secret exposto

---

## 📝 NOTAS IMPORTANTES

1. **Authenticação**: Por enquanto, autenticação básica (username/password). JWT será adicionado depois.
2. **Banco de Dados**: SQLite para desenvolvimento. Mudança para PostgreSQL é só mudar DATABASE_URL.
3. **Frontend**: Componentes React simples, sem state manager complexo por enquanto.
4. **Testes**: pytest no backend, Vitest no frontend.
5. **CI/CD**: GitHub Actions simples (apenas rodar testes, sem deploy ainda).

---

## 🎯 SUCESSO = QUANDO...

- ✅ Todos os endpoints respondendo em /docs
- ✅ Frontend conectando ao backend
- ✅ Usuário pode registrar, logar, criar transações
- ✅ Testes passando (>80% coverage)
- ✅ Scripts rodando sem erros
- ✅ Código limpo e bem documentado

---

**Próximo passo**: Começar TAREFA A2 - Limpar models.py
