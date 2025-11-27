# 🚀 Scripts de Inicialização - Finance App

## Visão Geral

Este diretório contém scripts para facilitar a configuração e execução do projeto Finance App. Existem versões para diferentes sistemas operacionais.

---

## 📋 Arquivos de Scripts

### 1. **setup.ps1** (Windows PowerShell)
Script de configuração inicial do projeto para Windows.

**Funcionalidades:**
- ✅ Verifica Python e Node.js
- ✅ Cria ambiente virtual Python
- ✅ Instala dependências do backend (pip)
- ✅ Instala dependências do frontend (npm)
- ✅ Cria arquivo `.env` de template
- ✅ Validação de requisitos

**Como usar:**
```powershell
# Abra o PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Execute o script
.\setup.ps1
```

---

### 2. **setup.sh** (macOS/Linux)
Script de configuração inicial do projeto para Unix-like systems.

**Funcionalidades:**
- ✅ Verifica Python3 e Node.js
- ✅ Cria ambiente virtual Python
- ✅ Instala dependências do backend (pip)
- ✅ Instala dependências do frontend (npm)
- ✅ Cria arquivo `.env` de template
- ✅ Validação de requisitos

**Como usar:**
```bash
# Dar permissão de execução
chmod +x setup.sh

# Execute o script
./setup.sh
```

---

### 3. **run-dev.ps1** (Windows PowerShell)
Script para iniciar simultaneamente backend e frontend em desenvolvimento.

**Funcionalidades:**
- ✅ Inicia servidor FastAPI na porta 8000
- ✅ Inicia servidor React na porta 3000
- ✅ Abre dois terminais automaticamente
- ✅ Mostra endpoints de acesso

**Como usar:**
```powershell
# Execute o script (já deve ter rodado setup.ps1 antes)
.\run-dev.ps1
```

**O que acontece:**
- Abre 1º terminal: Backend com `uvicorn app.main:app --reload --port 8000`
- Abre 2º terminal: Frontend com `npm run dev`
- Ambos rodando simultaneamente

---

### 4. **run-dev.sh** (macOS/Linux)
Script para iniciar simultaneamente backend e frontend em desenvolvimento.

**Funcionalidades:**
- ✅ Inicia servidor FastAPI na porta 8000
- ✅ Inicia servidor React na porta 3000
- ✅ Ambos em processos de background
- ✅ Mostra endpoints de acesso

**Como usar:**
```bash
# Dar permissão de execução
chmod +x run-dev.sh

# Execute o script (já deve ter rodado setup.sh antes)
./run-dev.sh
```

**O que acontece:**
- Backend em background: `uvicorn app.main:app --reload --port 8000`
- Frontend em background: `npm run dev`
- Ambos rodando simultaneamente
- Pressione `Ctrl+C` para parar todos

---

## ⚙️ Fluxo de Uso Recomendado

### Primeira Execução

#### Windows:
```powershell
# 1. Configurar projeto
.\setup.ps1

# 2. Editar configurações (abra backend/.env e configure DATABASE_URL)
notepad backend\.env

# 3. Iniciar desenvolvimento
.\run-dev.ps1
```

#### macOS/Linux:
```bash
# 1. Configurar projeto
./setup.sh

# 2. Editar configurações
nano backend/.env

# 3. Iniciar desenvolvimento
./run-dev.sh
```

### Execuções Posteriores

Depois que o projeto está configurado, basta rodar:

**Windows:**
```powershell
.\run-dev.ps1
```

**macOS/Linux:**
```bash
./run-dev.sh
```

---

## 🔧 Requisitos Pré-instalação

Antes de rodar os scripts, certifique-se de ter instalado:

### Backend
- **Python 3.8+**
  - Windows: https://www.python.org/downloads/
  - macOS: `brew install python3`
  - Linux: `apt-get install python3`

- **PostgreSQL**
  - Windows: https://www.postgresql.org/download/windows/
  - macOS: `brew install postgresql`
  - Linux: `apt-get install postgresql`

### Frontend
- **Node.js 14+**
  - Windows: https://nodejs.org/
  - macOS: `brew install node`
  - Linux: `apt-get install nodejs`

- **npm** (vem com Node.js)

---

## 📝 Configuração do `.env`

Após rodar `setup.ps1` ou `setup.sh`, um arquivo `.env` é criado em `backend/.env`.

**Você DEVE editar este arquivo com suas credenciais:**

```bash
# Database Configuration
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/finance_db

# Security
SECRET_KEY=gere-uma-chave-segura-aqui

# Environment
ENVIRONMENT=development
```

---

## 🚨 Troubleshooting

### Erro: "Python not found"
```powershell
# Windows
python --version  # Verificar se está instalado e no PATH
```

Se não está no PATH:
- Reinstale Python com a opção "Add Python to PATH" marcada

---

### Erro: "Node.js not found"
```bash
# macOS/Linux
node --version  # Verificar se está instalado
which node      # Ver o caminho
```

Se não está instalado:
- macOS: `brew install node`
- Linux: `apt-get install nodejs npm`

---

### Erro: "PostgreSQL not found"
```bash
# Verificar se está rodando
psql --version
```

Se não está instalado:
- Windows: https://www.postgresql.org/download/windows/
- macOS: `brew install postgresql`
- Linux: `apt-get install postgresql`

---

### Erro: "Permission denied" no .sh (macOS/Linux)
```bash
chmod +x setup.sh
chmod +x run-dev.sh
```

---

### Erro: "cannot be loaded because running scripts is disabled"
Isso é comum no PowerShell Windows. Solução:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Erro: "Port 8000/3000 already in use"
Alguma outra aplicação está usando a porta. Opções:
1. Feche a aplicação que está usando a porta
2. Mude a porta no script ou no comando de execução
3. Use `netstat -ano | findstr :8000` (Windows) ou `lsof -i :8000` (macOS/Linux) para encontrar o processo

---

## 📱 Acessar o Projeto

Após iniciar com `run-dev.ps1` ou `run-dev.sh`:

| Recurso | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **Backend** | http://localhost:8000 |
| **Documentação API** | http://localhost:8000/docs |
| **ReDoc (alternativa)** | http://localhost:8000/redoc |

---

## 🔄 Desenvolvimento Contínuo

### Backend (FastAPI)

Os scripts usam `--reload`, o que significa:
- Qualquer alteração em arquivos Python reconstrói automaticamente
- Não precisa reiniciar o servidor manualmente

### Frontend (React)

O `npm run dev` também inclui hot reload:
- Qualquer alteração em JSX/CSS é refletida instantaneamente
- Não precisa recarregar manualmente o navegador

---

## 🛑 Parar os Servidores

### Windows (run-dev.ps1)
- Feche as janelas dos terminais
- Ou pressione `Ctrl+C` em cada janela

### macOS/Linux (run-dev.sh)
- Pressione `Ctrl+C` no terminal onde o script foi executado
- Isso mata todos os processos de background

---

## 🐛 Limpeza e Reset

Se algo der errado, você pode resetar:

### Backend
```bash
cd backend
rm -rf venv
rm -rf __pycache__
rm -rf .env
```

Depois execute `setup.ps1` ou `setup.sh` novamente.

### Frontend
```bash
cd frontend
rm -rf node_modules
rm -rf package-lock.json
```

Depois execute `setup.ps1` ou `setup.sh` novamente.

---

## 📚 Referências

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Node.js](https://nodejs.org/)
- [Python](https://www.python.org/)
- [PostgreSQL](https://www.postgresql.org/)

---

## 💡 Dicas

1. **Use um bom terminal**: No Windows, considere usar Windows Terminal (Microsoft Store)
2. **Mantenha tudo atualizado**: `pip install --upgrade pip` e `npm update -g npm`
3. **Use um editor bom**: VS Code, PyCharm, WebStorm, etc.
4. **Leia os logs**: Os scripts exibem informações úteis sobre erros

---

**Última atualização**: Novembro 2025
