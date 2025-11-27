# 🔧 GUIA SETUP - Primeira Execução

**Importante**: Siga estes passos para rodar o projeto com sucesso!

## ⚡ Passo 1: Limpar Banco de Dados Antigo (se houver)

```powershell
cd backend
# Remover banco de dados antigo
Remove-Item finance.db -ErrorAction SilentlyContinue
```

## ⚡ Passo 2: Instalar Dependências

### Backend
```powershell
cd backend
pip install -r requirements.txt
```

### Frontend
```powershell
cd frontend
npm install
```

## ⚡ Passo 3: Iniciar Servidores

### Terminal 1 - Backend
```powershell
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Você deve ver:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Quando o servidor inicia, o banco de dados é criado **automaticamente**.

### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```

**Você deve ver:**
```
  VITE v... dev server running at:
  > Local:    http://localhost:3000
```

## ⚡ Passo 4: Acessar a App

Abra o browser em:
```
http://localhost:3000
```

## ✅ Testar Registro

1. Clique em "Cadastre-se aqui"
2. Preencha:
   - Username: `testuser`
   - Senha: `password123`
   - Confirmar: `password123`
3. Clique "Registrar"
4. ✅ Deve redirecionar para login

## ✅ Testar Login

1. Preencha:
   - Username: `testuser`
   - Senha: `password123`
2. Clique "Entrar"
3. ✅ Deve redirecionar para dashboard

## 🎉 Se Tudo Funcionou!

- ✅ Usuário criado com sucesso
- ✅ Login funcionando
- ✅ Dashboard carregado
- ✅ App pronta para usar!

---

## 🆘 Troubleshooting

### Erro: "Access to XMLHttpRequest... CORS"
**Solução**: Certifique-se de que:
- Backend rodando em `http://localhost:8000`
- Frontend rodando em `http://localhost:3000` ou `3001`

### Erro: "No response from API"
**Solução**: 
1. Verifique se backend está rodando
2. Verifique se banco de dados foi criado em `backend/finance.db`

### Banco de dados não foi criado
**Solução**: 
```powershell
cd backend
python init_db.py
# Depois reinicie o servidor
```

### Porta 8000 ou 3000 em uso
**Solução**: Mude a porta:
```powershell
# Backend em porta 8001
python -m uvicorn app.main:app --reload --port 8001

# Frontend em porta 3002
npm run dev -- --port 3002
```

### Módulo não encontrado
**Solução**:
```powershell
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## 📊 Estrutura de Pastas

```
finance-app/
├── backend/
│   ├── app/
│   │   ├── main.py           (FastAPI setup - cria banco automaticamente)
│   │   ├── models.py
│   │   ├── crud.py
│   │   ├── routes/
│   │   └── ...
│   ├── finance.db            (criado automaticamente)
│   ├── init_db.py            (script para inicializar manual)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── ...
```

---

## 🚀 Dica: Script Automático (Windows)

Crie um arquivo `start.ps1` na raiz do projeto:

```powershell
# start.ps1
Write-Host "Iniciando Finance App..." -ForegroundColor Green

# Terminal 1: Backend
Start-Process powershell -ArgumentList "cd backend; python -m uvicorn app.main:app --reload --port 8000"

# Aguardar 3 segundos
Start-Sleep -Seconds 3

# Terminal 2: Frontend
Start-Process powershell -ArgumentList "cd frontend; npm run dev"

Write-Host "✅ Servidores iniciados!" -ForegroundColor Green
Write-Host "👉 Acesse: http://localhost:3000" -ForegroundColor Cyan
```

Depois use:
```powershell
./start.ps1
```

---

**Status**: ✅ Sistema pronto para primeira execução!

Aproveite! 🎉
