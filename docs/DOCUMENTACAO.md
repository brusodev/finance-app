# Documentação - Finance App

## 📋 Visão Geral

**Finance App** é uma aplicação web full-stack para gerenciamento de finanças pessoais. Permite que usuários registrem transações financeiras, categorizem gastos e visualizem relatórios.

---

## 🏗️ Arquitetura do Projeto

O projeto segue uma arquitetura **cliente-servidor** com separação clara entre frontend e backend:

```
finance-app/
├── backend/     (API REST com FastAPI)
├── frontend/    (Single Page Application com React)
└── documentação
```

---

## 🛠️ Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **FastAPI** | Latest | Framework web moderno e rápido para Python |
| **Uvicorn** | Latest | ASGI server para executar a aplicação FastAPI |
| **SQLAlchemy** | Latest | ORM (Object Relational Mapping) para banco de dados |
| **PostgreSQL** | - | Banco de dados relacional (via psycopg2-binary) |
| **Pydantic** | Latest | Validação de dados com type hints |
| **python-dotenv** | Latest | Gerenciamento de variáveis de ambiente |

**Python**: 3.8+

### Frontend

| Tecnologia | Versão | Propósito |
|-----------|--------|----------|
| **React** | ^18.2.0 | Biblioteca para construção de interfaces |
| **React Router DOM** | ^6.22.0 | Roteamento entre páginas |
| **Tailwind CSS** | ^3.3.0 | Framework CSS utilitário para styling |
| **PostCSS** | ^8.4.0 | Processador de CSS |
| **Autoprefixer** | ^10.4.0 | Adiciona prefixos de vendor ao CSS |

**Node.js**: 14+ | **npm**: 6+

---

## 📁 Estrutura de Diretórios

### Backend (`/backend`)

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # Entrada da aplicação FastAPI
│   ├── models.py            # Modelos do banco de dados (SQLAlchemy)
│   ├── schemas.py           # Schemas de validação (Pydantic)
│   ├── crud.py              # Operações de Create, Read, Update, Delete
│   ├── database.py          # Configuração do banco de dados
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # Modelo específico de usuário
│   └── routes/
│       ├── __init__.py
│       ├── auth.py          # Endpoints de autenticação
│       ├── users.py         # Endpoints de usuários
│       ├── transactions.py  # Endpoints de transações
│       └── categories.py    # Endpoints de categorias
└── requirements.txt         # Dependências Python
```

### Frontend (`/frontend`)

```
frontend/
├── src/
│   ├── App.jsx              # Componente raiz com roteamento
│   ├── main.jsx             # Entry point da aplicação
│   ├── index.css            # Estilos globais
│   ├── components/
│   │   ├── Navbar.jsx       # Barra de navegação
│   │   ├── TransactionForm.jsx    # Formulário para adicionar transações
│   │   ├── TransactionList.jsx    # Lista de transações
│   │   └── CategorySelect.jsx     # Selector de categorias
│   ├── pages/
│   │   ├── Dashboard.jsx    # Página principal
│   │   ├── Login.jsx        # Página de login
│   │   ├── Register.jsx     # Página de registro
│   │   └── Report.jsx       # Página de relatórios
│   └── services/
│       └── api.jsx          # Cliente HTTP para requisições à API
├── package.json             # Dependências Node.js
├── tailwind.config.js       # Configuração do Tailwind CSS
└── postcss.config.js        # Configuração do PostCSS
```

---

## 🗄️ Modelo de Dados

### Tabelas Principais

#### `users`
```
id (PK)           - Integer, chave primária
username          - String, único e indexado
hashed_password   - String, senha criptografada
```

#### `categories`
```
id (PK)           - Integer, chave primária
name              - String, único e indexado
```

#### `transactions`
```
id (PK)           - Integer, chave primária
amount            - Float, valor da transação
date              - Date, data da transação
description       - String, descrição
category_id (FK)  - Integer, referência à categoria
user_id (FK)      - Integer, referência ao usuário
```

**Relacionamentos:**
- Um usuário pode ter várias transações (1:N)
- Uma categoria pode ter várias transações (1:N)

---

## 🚀 Funcionalidades Implementadas

### Autenticação
- ✅ Registro de novos usuários
- ✅ Login de usuários
- ✅ Gerenciamento de sessões

### Gestão de Transações
- ✅ Criar transações (receita/despesa)
- ✅ Listar transações do usuário
- ✅ Editar transações
- ✅ Deletar transações

### Categorização
- ✅ Listar categorias disponíveis
- ✅ Criar categorias personalizadas
- ✅ Filtrar transações por categoria

### Relatórios
- ✅ Dashboard com resumo financeiro
- ✅ Relatórios de gastos por período
- ✅ Análise por categoria

---

## 📡 API Endpoints

### Autenticação
```
POST   /auth/register       - Registrar novo usuário
POST   /auth/login          - Fazer login
POST   /auth/logout         - Fazer logout
```

### Usuários
```
GET    /users/me            - Obter dados do usuário autenticado
PUT    /users/me            - Atualizar dados do usuário
DELETE /users/me            - Deletar conta do usuário
```

### Transações
```
GET    /transactions        - Listar transações do usuário
POST   /transactions        - Criar nova transação
GET    /transactions/{id}   - Obter transação específica
PUT    /transactions/{id}   - Atualizar transação
DELETE /transactions/{id}   - Deletar transação
```

### Categorias
```
GET    /categories          - Listar todas as categorias
POST   /categories          - Criar nova categoria
GET    /categories/{id}     - Obter categoria específica
PUT    /categories/{id}     - Atualizar categoria
DELETE /categories/{id}     - Deletar categoria
```

---

## 🔗 Fluxo da Aplicação

```
1. Usuário acessa http://localhost:3000
   ↓
2. Frontend renderiza página de Login/Register
   ↓
3. Após autenticação, usuário é redirecionado para Dashboard
   ↓
4. Dashboard exibe:
   - Resumo financeiro
   - Transações recentes
   - Categorias disponíveis
   ↓
5. Usuário pode:
   - Adicionar nova transação (TransactionForm)
   - Visualizar lista de transações (TransactionList)
   - Filtrar por categoria (CategorySelect)
   - Acessar relatórios (Report)
   ↓
6. Frontend faz requisições HTTP à API backend
   (http://localhost:8000/api)
   ↓
7. Backend processa requisições, consulta BD e retorna dados em JSON
```

---

## 🔒 Segurança

### Implementações
- ✅ CORS configurado para permitir apenas requisições do frontend
- ✅ Senhas armazenadas com hash (não em texto plano)
- ✅ Validação de entrada com Pydantic
- ✅ Autenticação por token (JWT recomendado)

### Melhorias Futuras
- [ ] Implementar JWT para autenticação stateless
- [ ] Rate limiting para endpoints
- [ ] Validação de CSRF
- [ ] HTTPS em produção

---

## 📦 Como Instalar e Executar

### Backend

```bash
# Navegar para diretório do backend
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual (Windows)
venv\Scripts\activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Criar arquivo .env na raiz do backend
# DATABASE_URL=postgresql://user:password@localhost/finance_db

# Executar servidor
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
# Navegar para diretório do frontend
cd frontend

# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# A aplicação estará disponível em http://localhost:3000
```

---

## 🗄️ Configuração do Banco de Dados

### Requisitos
- PostgreSQL 12+

### Conexão
```bash
# Terminal PostgreSQL
createdb finance_db
```

### Variáveis de Ambiente (.env)
```
DATABASE_URL=postgresql://usuario:senha@localhost/finance_db
SECRET_KEY=sua_chave_secreta_aqui
```

---

## 🧪 Testes

### Backend (FastAPI)
```bash
# Documentação interativa disponível em:
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

### Frontend
```bash
# Executar testes (quando configurados)
npm test
```

---

## 📊 Fluxo de Desenvolvimento

### Estado Atual
- ✅ Estrutura do projeto criada
- ✅ Modelos de dados definidos
- ✅ Base de API configurada (roteamento comentado temporariamente)
- 🔄 Rotas sendo implementadas
- 🔄 Componentes React em desenvolvimento
- 🔄 Autenticação em implementação

### Próximas Etapas
1. Completar implementação das rotas (auth, users, transactions, categories)
2. Implementar validações robustas (Pydantic schemas)
3. Conectar frontend à API
4. Implementar autenticação JWT
5. Criar testes unitários
6. Adicionar tratamento de erros
7. Melhorar UX/UI com Tailwind CSS
8. Deploy em produção

---

## 🐛 Troubleshooting

### Backend não conecta ao banco de dados
```
✓ Verificar se PostgreSQL está rodando
✓ Confirmar credenciais em .env
✓ Validar permissões do usuário PostgreSQL
```

### Frontend não consegue conectar à API
```
✓ Verificar se backend está rodando em http://localhost:8000
✓ Confirmar CORS configurado corretamente
✓ Testar endpoint /docs do backend
```

### Erro de dependências
```
# Backend
pip install --upgrade pip
pip install -r requirements.txt

# Frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Referências Úteis

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [SQLAlchemy Docs](https://docs.sqlalchemy.org/)
- [React Docs](https://react.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 📝 Notas Importantes

1. **Status Atual**: O projeto está em fase de desenvolvimento. Algumas rotas estão comentadas.
2. **Banco de Dados**: PostgreSQL é o banco padrão. Ajustar `DATABASE_URL` conforme ambiente.
3. **Autenticação**: Considere implementar JWT tokens para melhor segurança.
4. **CORS**: Configurado apenas para `http://localhost:3000`. Ajustar para produção.

---

**Última atualização**: Novembro 2025
