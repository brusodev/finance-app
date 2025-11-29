# 🚂 Deploy no Railway - Finance App

Guia completo para fazer deploy do Finance App no Railway com PostgreSQL.

---

## 📋 Pré-requisitos

- Conta no [Railway](https://railway.app)
- Conta no GitHub (para conectar o repositório)
- Git instalado localmente

---

## 🔧 Parte 1: Preparar o Repositório

### 1. Inicializar Git (se ainda não tiver)

```bash
cd c:/Users/bruno/Desktop/Dev/finance-app
git init
```

### 2. Criar .gitignore

Certifique-se que o `.gitignore` já está configurado:

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
.venv/
*.db
*.sqlite3

# Env files
.env
.env.local
.env.production

# Frontend
node_modules/
dist/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### 3. Fazer commit inicial

```bash
git add .
git commit -m "feat: Preparar projeto para deploy no Railway"
```

### 4. Criar repositório no GitHub

1. Acesse https://github.com/new
2. Nome: `finance-app`
3. Deixe **privado** ou **público** (sua escolha)
4. **NÃO** inicialize com README

```bash
# Adicionar remote
git remote add origin https://github.com/SEU_USUARIO/finance-app.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

---

## 🚀 Parte 2: Deploy do Backend no Railway

### 1. Criar Projeto no Railway

1. Acesse https://railway.app
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Autorize o Railway a acessar seu GitHub
5. Selecione o repositório `finance-app`

### 2. Configurar o Backend

#### 2.1. Configurar Root Directory

Como temos backend e frontend separados, precisamos configurar:

1. Clique no serviço criado
2. Vá em **Settings** → **Build**
3. Em **Root Directory** coloque: `backend`
4. Em **Start Command** coloque: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 2.2. Adicionar PostgreSQL

1. No dashboard do projeto, clique em **"+ New"**
2. Selecione **"Database"** → **"Add PostgreSQL"**
3. O Railway vai criar automaticamente o banco
4. A variável `DATABASE_URL` será adicionada automaticamente ao backend

#### 2.3. Configurar Variáveis de Ambiente

Vá em **Variables** e adicione:

```env
ENVIRONMENT=production
FRONTEND_URL=https://SEU-FRONTEND.vercel.app
SECRET_KEY=gere-uma-chave-segura-aqui
```

**Gerar SECRET_KEY segura:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Deploy Automático

O Railway detectará o `requirements.txt` e fará o deploy automaticamente!

Aguarde o deploy finalizar (5-10 minutos na primeira vez).

### 4. Pegar a URL do Backend

1. Vá em **Settings** → **Domains**
2. Clique em **"Generate Domain"**
3. Copie a URL gerada (exemplo: `finance-backend.up.railway.app`)

---

## 🎨 Parte 3: Deploy do Frontend

### Opção A: Deploy no Vercel (Recomendado)

#### 1. Preparar o Frontend

```bash
cd frontend

# Editar .env.production
nano .env.production
```

Adicione a URL do backend do Railway:
```env
VITE_API_URL=https://finance-backend.up.railway.app
```

Commit:
```bash
git add .env.production
git commit -m "feat: Configurar URL do backend do Railway"
git push
```

#### 2. Deploy no Vercel

1. Acesse https://vercel.com
2. Clique em **"Add New Project"**
3. Importe seu repositório do GitHub
4. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. Em **Environment Variables** adicione:
   ```
   VITE_API_URL=https://finance-backend.up.railway.app
   ```

6. Clique em **"Deploy"**

#### 3. Atualizar CORS no Backend

Após deploy do frontend, pegue a URL do Vercel (ex: `finance-app.vercel.app`) e:

1. Volte no Railway
2. Adicione a variável:
   ```env
   FRONTEND_URL=https://finance-app.vercel.app
   ```

3. O Railway vai fazer redeploy automaticamente

### Opção B: Deploy Frontend no Railway

Se preferir tudo no Railway:

1. No projeto do Railway, clique em **"+ New"** → **"Empty Service"**
2. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Start Command**: `npx vite preview --host 0.0.0.0 --port $PORT`

3. Adicione variável:
   ```env
   VITE_API_URL=https://SEU-BACKEND.up.railway.app
   ```

---

## 🔒 Parte 4: Configurar SSL (Já incluído)

O Railway e Vercel já fornecem SSL automaticamente! 🎉

---

## 📊 Parte 5: Verificar e Testar

### 1. Testar Backend

```bash
curl https://SEU-BACKEND.up.railway.app
```

Deve retornar:
```json
{
  "message": "Finance App API está funcionando!",
  "status": "online",
  ...
}
```

### 2. Testar Frontend

Acesse `https://SEU-FRONTEND.vercel.app` no navegador e faça login.

### 3. Verificar Logs

**Railway:**
- Vá no serviço → **Logs**
- Acompanhe erros e requisições

**Vercel:**
- Project → **Deployments** → Clique no deployment → **View Function Logs**

---

## 🔄 Parte 6: Configurar CI/CD Automático

Já está configurado! 🎉

Toda vez que você fizer `git push`:
- Railway redeploya o backend automaticamente
- Vercel redeploya o frontend automaticamente

---

## 🗄️ Parte 7: Gerenciar Banco de Dados

### Acessar PostgreSQL do Railway

#### Opção 1: Via Railway CLI

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Conectar ao projeto
railway link

# Acessar PostgreSQL
railway run psql
```

#### Opção 2: Via Cliente PostgreSQL

No Railway, vá no serviço PostgreSQL → **Connect** e copie as credenciais:

```bash
psql "postgresql://user:password@host:port/database"
```

#### Opção 3: Via Ferramenta Gráfica (Recomendado)

Use [pgAdmin](https://www.pgadmin.org/) ou [DBeaver](https://dbeaver.io/):

1. Pegue as credenciais no Railway (PostgreSQL → Variables)
2. Configure nova conexão com:
   - Host
   - Port
   - Database
   - Username
   - Password

### Backup do Banco

```bash
# Fazer backup
railway run pg_dump > backup.sql

# Restaurar backup
railway run psql < backup.sql
```

---

## 🛠️ Troubleshooting

### Backend não inicia

**Erro:** `ModuleNotFoundError: No module named 'app'`

**Solução:** Verifique o Root Directory está como `backend`

---

### Erro de CORS

**Erro:** `Access to fetch at ... has been blocked by CORS policy`

**Solução:**
1. Verifique se `FRONTEND_URL` está correta no Railway
2. Certifique-se que a URL não tem `/` no final

---

### Banco de dados não conecta

**Erro:** `could not connect to server`

**Solução:**
1. Verifique se o PostgreSQL foi adicionado
2. Aguarde 2-3 minutos após criar o PostgreSQL
3. Verifique os logs do backend

---

### Build do frontend falha

**Erro:** `VITE_API_URL is not defined`

**Solução:**
1. Adicione `VITE_API_URL` nas variáveis de ambiente do Vercel/Railway
2. Faça novo deploy

---

## 💰 Custos

### Railway (Backend + PostgreSQL)
- **Free Tier**: $5/mês de crédito grátis
- **PostgreSQL**: ~$5/mês (se exceder free tier)
- **Backend**: Baseado em uso

### Vercel (Frontend)
- **Free Tier**: Grátis para projetos pessoais
- **Unlimited**: Grátis para deploy ilimitado

**Total estimado:** $0 - $5/mês (dentro do free tier)

---

## 📝 Checklist de Deploy

- [ ] Repositório no GitHub criado
- [ ] Backend deployado no Railway
- [ ] PostgreSQL adicionado no Railway
- [ ] Variáveis de ambiente configuradas no Railway
- [ ] URL do backend gerada
- [ ] `.env.production` do frontend configurado
- [ ] Frontend deployado no Vercel
- [ ] URL do frontend adicionada no Railway (CORS)
- [ ] Testado login e funcionalidades
- [ ] Logs verificados

---

## 🎯 URLs Finais

Após deploy completo, você terá:

- **Backend API**: `https://finance-backend.up.railway.app`
- **API Docs**: `https://finance-backend.up.railway.app/docs`
- **Frontend**: `https://finance-app.vercel.app`
- **PostgreSQL**: Acessível via Railway CLI ou cliente PostgreSQL

---

## 🔐 Segurança em Produção

### Recomendações:

1. **Mudar SECRET_KEY**: Gere uma chave forte
2. **Desabilitar usuário padrão**: Remova ou mude a senha do usuário "bruno"
3. **Rate Limiting**: Adicionar proteção contra força bruta
4. **Backup regular**: Configure backup automático do PostgreSQL
5. **Monitoramento**: Configure alertas no Railway

---

## 📚 Recursos Úteis

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [PostgreSQL Railway](https://docs.railway.app/databases/postgresql)

---

**Boa sorte com o deploy! 🚀**

Se tiver dúvidas, consulte os logs ou a documentação oficial.
