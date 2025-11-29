# 🚂 Deploy Completo no Railway - Frontend + Backend

Guia simplificado para fazer deploy do **Frontend e Backend** no Railway.

---

## 📋 Pré-requisitos

- ✅ Conta no [Railway](https://railway.app)
- ✅ Conta no [GitHub](https://github.com)
- ✅ Git instalado

---

## 🚀 Passo a Passo Completo

### 1️⃣ Preparar e Enviar para GitHub

```bash
cd c:/Users/bruno/Desktop/Dev/finance-app

# Inicializar git (se ainda não tiver)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "feat: Preparar projeto para Railway"

# Criar repositório no GitHub
# Acesse: https://github.com/new
# Nome: finance-app
# Deixe público ou privado

# Adicionar remote (substitua SEU_USUARIO)
git remote add origin https://github.com/SEU_USUARIO/finance-app.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

---

### 2️⃣ Deploy do Backend no Railway

#### A. Criar Projeto

1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway no GitHub (se primeira vez)
5. Selecione o repositório **`finance-app`**

#### B. Configurar Backend Service

1. O Railway vai criar um serviço automaticamente
2. Clique no serviço criado
3. Vá em **Settings**:
   - **Service Name**: Renomeie para `backend`
   - **Root Directory**: Digite `backend`
   - **Build Command**: Deixe vazio (detecta automaticamente)
   - **Start Command**: Digite `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**IMPORTANTE:** Após configurar, clique em **Deploy** ou faça um novo commit para reaplicar as configurações.

#### C. Adicionar PostgreSQL

1. No dashboard do projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. Aguarde o PostgreSQL ser provisionado (1-2 minutos)
4. A variável `DATABASE_URL` será adicionada automaticamente ao backend

#### D. Configurar Variáveis de Ambiente do Backend

1. No serviço **backend**, vá em **Variables**
2. Clique em **"+ New Variable"** e adicione:

```env
ENVIRONMENT=production
SECRET_KEY=GERE_UMA_CHAVE_SEGURA_AQUI
```

**Para gerar SECRET_KEY segura:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### E. Gerar Domínio do Backend

1. No serviço **backend**, vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. **COPIE A URL GERADA** (exemplo: `finance-backend.up.railway.app`)
4. Você vai precisar dessa URL no próximo passo!

#### F. Aguardar Deploy do Backend

- Vá em **Deployments** e aguarde o deploy finalizar
- Status deve ficar **"SUCCESS"** (pode levar 5-10 minutos)

---

### 3️⃣ Deploy do Frontend no Railway

#### A. Adicionar Segundo Serviço

1. No dashboard do projeto, clique em **"+ New"**
2. Selecione **"GitHub Repo"**
3. Selecione o mesmo repositório **`finance-app`**
4. Railway vai criar outro serviço

#### B. Configurar Frontend Service

1. Clique no novo serviço
2. Vá em **Settings**:
   - **Service Name**: Renomeie para `frontend`
   - **Root Directory**: Digite `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx vite preview --host 0.0.0.0 --port $PORT`

#### C. Configurar Variáveis de Ambiente do Frontend

1. No serviço **frontend**, vá em **Variables**
2. Adicione a URL do backend (que você copiou no passo 2E):

```env
VITE_API_URL=https://finance-backend.up.railway.app
```

**⚠️ IMPORTANTE:** Use a URL **sem barra no final** e com `https://`

#### D. Gerar Domínio do Frontend

1. No serviço **frontend**, vá em **Settings** → **Networking**
2. Clique em **"Generate Domain"**
3. **COPIE A URL DO FRONTEND** (exemplo: `finance-app.up.railway.app`)

---

### 4️⃣ Configurar CORS (Backend)

Agora que o frontend tem URL, precisamos adicionar no backend:

1. Volte no serviço **backend**
2. Vá em **Variables**
3. Adicione:

```env
FRONTEND_URL=https://finance-app.up.railway.app
```

4. O Railway vai fazer **redeploy automático** do backend

---

### 5️⃣ Verificar e Testar

#### Verificar Deployments

1. Ambos os serviços devem estar com status **"SUCCESS"**
2. Se houver erro, veja os logs clicando no deployment

#### Testar Backend

Acesse no navegador:
```
https://SEU-BACKEND.up.railway.app
```

Deve retornar JSON:
```json
{
  "message": "Finance App API está funcionando!",
  "status": "online"
}
```

#### Testar Frontend

Acesse:
```
https://SEU-FRONTEND.up.railway.app
```

Deve abrir a tela de login!

#### Testar Login

- **Usuário**: `bruno`
- **Senha**: `123456`

---

## 📊 Estrutura Final no Railway

Você terá 3 serviços:

```
finance-app (projeto)
├── backend (serviço)
│   ├── URL: https://finance-backend.up.railway.app
│   ├── Variables: ENVIRONMENT, SECRET_KEY, FRONTEND_URL, DATABASE_URL
│   └── Root: backend/
│
├── frontend (serviço)
│   ├── URL: https://finance-app.up.railway.app
│   ├── Variables: VITE_API_URL
│   └── Root: frontend/
│
└── PostgreSQL (banco de dados)
    └── Conectado automaticamente ao backend
```

---

## 🔄 Atualizações Automáticas

Agora toda vez que você fizer push no GitHub:

```bash
git add .
git commit -m "feat: Nova funcionalidade"
git push
```

O Railway vai **automaticamente**:
1. Detectar mudanças
2. Fazer rebuild
3. Redeploy dos serviços

---

## 📝 Variáveis de Ambiente - Resumo

### Backend
```env
ENVIRONMENT=production
SECRET_KEY=sua-chave-super-secreta
FRONTEND_URL=https://SEU-FRONTEND.up.railway.app
DATABASE_URL=postgresql://... (fornecido automaticamente)
PORT=... (fornecido automaticamente)
```

### Frontend
```env
VITE_API_URL=https://SEU-BACKEND.up.railway.app
PORT=... (fornecido automaticamente)
```

---

## 🛠️ Comandos Úteis

### Ver Logs

```bash
# Instalar CLI do Railway
npm i -g @railway/cli

# Login
railway login

# Link ao projeto
railway link

# Ver logs do backend
railway logs -s backend

# Ver logs do frontend
railway logs -s frontend
```

### Acessar PostgreSQL

```bash
# Via Railway CLI
railway connect PostgreSQL

# Ou pegar credenciais
railway variables -s PostgreSQL
```

---

## 💰 Custos Estimados

### Railway Free Tier
- **Crédito mensal**: $5 grátis
- **Backend**: ~$2-3/mês
- **Frontend**: ~$1-2/mês
- **PostgreSQL**: ~$2-3/mês

**Total:** ~$5-8/mês (primeiros $5 grátis)

Para hobby/projetos pessoais, geralmente fica **GRÁTIS** ou muito barato!

---

## 🔧 Troubleshooting

### Backend não inicia

**Erro:** `Script start.sh not found` ou `No start command was found`

**Solução:**
1. Vá em **Settings** do serviço backend
2. Na seção **Deploy**, configure:
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Vá em **Deployments** e clique em **Redeploy**

---

**Erro:** `ModuleNotFoundError: No module named 'app'`

**Solução:**
- Verifique **Root Directory**: deve estar `backend`
- Verifique **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Redeploy o serviço

---

### Frontend mostra erro de API

**Erro:** `Failed to fetch`

**Solução:**
1. Verifique `VITE_API_URL` no frontend
2. Teste a URL do backend no navegador
3. Verifique `FRONTEND_URL` no backend (CORS)

---

### PostgreSQL não conecta

**Solução:**
1. Aguarde 2-3 minutos após criar o PostgreSQL
2. Verifique se `DATABASE_URL` está nas variáveis do backend
3. Veja os logs do backend

---

### Build do frontend falha

**Erro:** `VITE_API_URL is not defined`

**Solução:**
1. Adicione `VITE_API_URL` nas variáveis do frontend
2. Faça redeploy manual: Settings → Deploy

---

## ✅ Checklist Final

- [ ] Código no GitHub
- [ ] Projeto criado no Railway
- [ ] Backend deployado com Root Directory correto
- [ ] PostgreSQL adicionado
- [ ] Variáveis do backend configuradas
- [ ] Domínio do backend gerado
- [ ] Frontend deployado com Root Directory correto
- [ ] Variável VITE_API_URL configurada no frontend
- [ ] Domínio do frontend gerado
- [ ] FRONTEND_URL adicionada no backend
- [ ] Ambos serviços com status SUCCESS
- [ ] Login funcionando no frontend

---

## 🎯 URLs Importantes

Salve essas URLs:

```
Backend API: https://SEU-BACKEND.up.railway.app
API Docs: https://SEU-BACKEND.up.railway.app/docs
Frontend: https://SEU-FRONTEND.up.railway.app
PostgreSQL: (credenciais no Railway)
```

---

## 🎉 Pronto!

Seu app está no ar com:
- ✅ Backend FastAPI
- ✅ Frontend React
- ✅ PostgreSQL
- ✅ SSL/HTTPS automático
- ✅ Deploy automático (CI/CD)
- ✅ Logs e monitoramento

**Compartilhe a URL do frontend e teste em qualquer lugar! 🚀**
