# ⚡ Guia Rápido - Deploy no Railway

## 📦 1. Enviar para GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/SEU_USUARIO/finance-app.git
git push -u origin main
```

---

## 🔧 2. Backend no Railway

1. **Railway** → New Project → Deploy from GitHub → `finance-app`
2. **Settings**:
   - Service Name: `backend`
   - Root Directory: `backend`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. **+ New** → Database → PostgreSQL
4. **Variables** → Adicionar:
   ```
   ENVIRONMENT=production
   SECRET_KEY=<gerar com: python -c "import secrets; print(secrets.token_urlsafe(32))">
   ```
5. **Settings** → **Networking** → Generate Domain
6. **Copiar URL**: `https://backend-xxx.railway.app`

---

## 🎨 3. Frontend no Railway

1. **+ New** → GitHub Repo → `finance-app`
2. **Settings**:
   - Service Name: `frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npx vite preview --host 0.0.0.0 --port $PORT`
3. **Variables** → Adicionar:
   ```
   VITE_API_URL=https://backend-xxx.railway.app
   ```
4. **Settings** → **Networking** → Generate Domain
5. **Copiar URL frontend**: `https://frontend-xxx.railway.app`

---

## 🔄 4. Configurar CORS

1. Voltar no serviço **backend**
2. **Variables** → Adicionar:
   ```
   FRONTEND_URL=https://frontend-xxx.railway.app
   ```

---

## ✅ 5. Testar

- Backend: `https://backend-xxx.railway.app`
- Frontend: `https://frontend-xxx.railway.app`
- Login: `bruno` / `123456`

---

## 📊 Resumo de Variáveis

### Backend
```
ENVIRONMENT=production
SECRET_KEY=...
FRONTEND_URL=https://frontend-xxx.railway.app
DATABASE_URL=postgresql://... (automático)
```

### Frontend
```
VITE_API_URL=https://backend-xxx.railway.app
```

---

**Pronto! 🎉**

Deploy automático configurado - todo `git push` atualiza automaticamente!
