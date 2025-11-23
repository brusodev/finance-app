# Guia de Desenvolvimento - Finance App

## 🎯 Ambiente de Desenvolvimento

### Pré-requisitos
- Python 3.8+
- Node.js 14+
- PostgreSQL 12+
- Git
- Editor: VS Code, PyCharm, WebStorm ou similar

### Setup Inicial

#### Windows
```powershell
# Executar script de setup
.\setup.ps1

# Iniciar projeto
.\run-dev.ps1
```

#### macOS/Linux
```bash
# Dar permissão e executar setup
chmod +x setup.sh
./setup.sh

# Iniciar projeto
chmod +x run-dev.sh
./run-dev.sh
```

---

## 📂 Estrutura de Pastas

```
finance-app/
├── backend/                 # API FastAPI
│   ├── app/
│   │   ├── main.py         # Aplicação principal
│   │   ├── database.py     # Configuração BD
│   │   ├── models.py       # Modelos SQLAlchemy
│   │   ├── schemas.py      # Schemas Pydantic
│   │   ├── crud.py         # Funções CRUD
│   │   ├── models/         # Modelos específicos
│   │   └── routes/         # Endpoints
│   ├── venv/               # Ambiente virtual
│   ├── requirements.txt    # Dependências
│   └── .env               # Variáveis de ambiente
│
├── frontend/               # App React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── services/      # API client
│   │   └── App.jsx        # Componente raiz
│   ├── node_modules/      # Dependências
│   ├── package.json       # Dependências
│   └── vite.config.js    # Config Vite
│
└── docs/                  # Documentação do projeto
    ├── DOCUMENTACAO.md
    ├── GUIA_DESENVOLVIMENTO.md
    └── SCRIPTS_README.md
```

---

## 🔧 Configuração do Backend

### 1. Variáveis de Ambiente

Criar arquivo `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://usuario:senha@localhost:5432/finance_db

# Security
SECRET_KEY=sua-chave-secreta-super-segura-aqui-64-caracteres

# Environment
ENVIRONMENT=development

# API
API_TITLE=Finance App API
API_VERSION=0.1.0
```

### 2. Estrutura de Modelos

#### Exemplo: models.py
```python
from sqlalchemy import Column, Integer, String, Float, Date
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    date = Column(Date)
    description = Column(String)
```

### 3. Estrutura de Schemas

#### Exemplo: schemas.py
```python
from pydantic import BaseModel
from datetime import date

class TransactionCreate(BaseModel):
    amount: float
    date: date
    description: str
    category_id: int

class TransactionRead(TransactionCreate):
    id: int
    
    class Config:
        from_attributes = True
```

### 4. Rotas

#### Exemplo: routes/transactions.py
```python
from fastapi import APIRouter, Depends
from app import schemas, crud

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/")
def list_transactions(db = Depends(get_db)):
    return crud.get_transactions(db)

@router.post("/")
def create_transaction(transaction: schemas.TransactionCreate, db = Depends(get_db)):
    return crud.create_transaction(db, transaction)
```

---

## 🎨 Configuração do Frontend

### 1. Estrutura de Componentes

```
src/
├── components/
│   ├── Navbar.jsx          # Barra de navegação
│   ├── TransactionForm.jsx # Formulário de transação
│   ├── TransactionList.jsx # Lista de transações
│   └── CategorySelect.jsx  # Selector de categoria
├── pages/
│   ├── Dashboard.jsx       # Página principal
│   ├── Login.jsx          # Login
│   ├── Register.jsx       # Registro
│   └── Report.jsx         # Relatórios
└── services/
    └── api.js             # Cliente HTTP
```

### 2. Exemplo de Componente

```jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export function TransactionList() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/transactions')
      .then(res => setTransactions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-4">
      {transactions.map(t => (
        <div key={t.id} className="border p-4">
          <h3>{t.description}</h3>
          <p>R$ {t.amount}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Cliente HTTP

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptador para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### 4. Roteamento

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 📝 Fluxo de Desenvolvimento

### 1. Feature Branch

```bash
# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Desenvolver
# ... código ...

# Commit
git add .
git commit -m "Add: implementar nova funcionalidade"

# Push
git push origin feature/nova-funcionalidade
```

### 2. Padrões de Commit

```
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: atualiza documentação
style: alterações de formatação
refactor: refatoração de código
test: adiciona testes
chore: tarefas de manutenção
```

### 3. Pull Request

1. Abrir PR no GitHub
2. Descrever mudanças
3. Aguardar review
4. Merge após aprovação

---

## 🧪 Testes

### Backend

```bash
# Instalar pytest
pip install pytest pytest-cov

# Criar teste
# tests/test_transactions.py

# Executar testes
pytest

# Com cobertura
pytest --cov=app
```

### Frontend

```bash
# Instalar vitest
npm install -D vitest

# Criar teste
# src/__tests__/TransactionList.test.jsx

# Executar
npm run test
```

---

## 🐛 Debug

### Backend (FastAPI)

```python
# Usar print para debug
print("Variável:", variavel)

# Ou usar logger
import logging
logger = logging.getLogger(__name__)
logger.debug("Debug message")
```

### Frontend (React)

```jsx
// Console.log
console.log('Estado:', state);

// React DevTools
// Instalar extensão no Chrome/Firefox

// Debugger
debugger; // Pausa a execução
```

---

## 📦 Instalando Dependências

### Backend

```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\Activate.ps1 no Windows

# Adicionar nova dependência
pip install nova-lib

# Atualizar requirements
pip freeze > requirements.txt
```

### Frontend

```bash
cd frontend

# Adicionar dependência
npm install nova-lib

# Adicionar dependência de desenvolvimento
npm install -D nova-lib-dev

# Atualizar package.json
npm update
```

---

## 🚀 Hot Reload

### Backend
- FastAPI com `--reload` já ativa hot reload
- Modifica arquivo Python → servidor reinicia automaticamente

### Frontend
- Vite já inclui HMR (Hot Module Replacement)
- Modifica arquivo JSX/CSS → navegador atualiza automaticamente

---

## 📊 Performance

### Backend
- Use `async/await` para operações I/O
- Implemente cache quando possível
- Otimize queries com índices

### Frontend
- Use `React.memo()` para componentes que não mudam
- Lazy load componentes grandes
- Otimize imagens

---

## 🔐 Segurança

### Backend
- Nunca commit `.env` (adicionar ao `.gitignore`)
- Use variáveis de ambiente para secrets
- Validar entrada com Pydantic
- Implementar autenticação JWT

### Frontend
- Nunca salvar tokens em localStorage para dados sensíveis
- Usar HTTPS em produção
- Sanitizar input de usuários
- CORS configurado corretamente

---

## 📚 Referências Úteis

- **FastAPI**: https://fastapi.tiangolo.com/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind**: https://tailwindcss.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

---

## ❓ FAQ

**P: Como resetar o banco de dados?**
```bash
# Deletar e recriar
dropdb finance_db
createdb finance_db
```

**P: Como instalar novo package Python?**
```bash
pip install nome-do-package
pip freeze > requirements.txt
```

**P: Como atualizar dependências?**
```bash
# Backend
pip install --upgrade -r requirements.txt

# Frontend
npm update
```

**P: Porta 8000 já em uso?**
```bash
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000
```

---

**Última atualização**: Novembro 2025
