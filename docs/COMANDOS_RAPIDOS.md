# ⚡ Comandos Rápidos - Finance App

Referência rápida de comandos úteis para o projeto.

---

## 🏃 Desenvolvimento Local

### Iniciar Projeto

```bash
# Backend (terminal 1)
cd backend
./start.sh

# Frontend (terminal 2)
cd frontend
./start.sh
```

### URLs Locais

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📦 Instalação

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows Git Bash
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

---

## 🔨 Build de Produção

### Frontend

```bash
cd frontend

# Editar .env.production com URL do backend
nano .env.production

# Build
npm run build

# Preview do build
npm run preview
```

---

## 🚀 Deploy

### Railway (Backend)

```bash
# 1. Criar repositório Git
git init
git add .
git commit -m "Initial commit"

# 2. Push para GitHub
git remote add origin https://github.com/SEU_USUARIO/finance-app.git
git push -u origin main

# 3. Conectar Railway ao GitHub
# Acesse: https://railway.app/new
```

### Vercel (Frontend)

```bash
# 1. Já tem no GitHub (do passo anterior)

# 2. Deploy no Vercel
# Acesse: https://vercel.com/new
# Root Directory: frontend
# Build Command: npm run build
# Output Directory: dist
```

---

## 🗄️ Banco de Dados

### SQLite (Local)

```bash
# Acessar banco
sqlite3 backend/finance.db

# Ver tabelas
.tables

# Ver usuários
SELECT * FROM users;

# Sair
.quit
```

### PostgreSQL (Railway)

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link projeto
railway link

# Acessar PostgreSQL
railway run psql
```

---

## 🔍 Diagnóstico

### Backend

```bash
cd backend
./check-network.sh
```

### Logs

```bash
# Logs do Railway
railway logs

# Logs locais do backend
tail -f backend/*.log
```

---

## 🧪 Testes

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

---

## 🔄 Atualizar Dependências

### Backend

```bash
cd backend
pip install --upgrade -r requirements.txt
pip freeze > requirements.txt
```

### Frontend

```bash
cd frontend
npm update
npm audit fix
```

---

## 🔐 Variáveis de Ambiente

### Desenvolvimento Local

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env

# Frontend
cp frontend/.env.example frontend/.env.local
nano frontend/.env.local
```

### Produção (Railway)

```bash
# Via CLI
railway variables set ENVIRONMENT=production
railway variables set FRONTEND_URL=https://seu-app.vercel.app

# Ou via dashboard: railway.app → Variables
```

---

## 📊 Monitoramento

### Railway

```bash
# Status
railway status

# Logs em tempo real
railway logs -f
```

### Vercel

```bash
# Deploy via CLI
vercel

# Logs
vercel logs
```

---

## 🧹 Limpeza

```bash
# Limpar cache do Vite
rm -rf frontend/node_modules/.vite

# Limpar build
rm -rf frontend/dist

# Reinstalar dependências
cd frontend
rm -rf node_modules
npm install
```

---

## 🔧 Troubleshooting

### Backend não inicia

```bash
# Verificar porta
netstat -an | grep 8000

# Matar processo
taskkill /F /IM uvicorn.exe  # Windows
pkill -f uvicorn             # Linux/Mac
```

### Frontend não conecta ao backend

```bash
# Verificar variável de ambiente
cat frontend/.env.local

# Limpar cache do navegador
# Ctrl+Shift+R (hard reload)

# Reconstruir
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Erro de CORS

```bash
# Verificar CORS no backend
cat backend/app/main.py | grep -A 10 "CORS"

# Adicionar URL do frontend
railway variables set FRONTEND_URL=https://seu-frontend.vercel.app
```

---

## 📝 Git

```bash
# Status
git status

# Commit
git add .
git commit -m "feat: Descrição da mudança"

# Push (dispara deploy automático)
git push

# Ver logs
git log --oneline -10
```

---

## 💡 Dicas

### Gerar SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Descobrir IP da máquina

```bash
# Windows
ipconfig | grep "IPv4"

# Linux/Mac
ip addr show | grep "inet "
```

### Testar API

```bash
# Health check
curl http://localhost:8000

# Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bruno","password":"123456"}'
```

---

**Comandos essenciais no dedo! 🚀**
