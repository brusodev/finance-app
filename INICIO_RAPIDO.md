# 🚀 Início Rápido - Finance App

## Opção 1: Usar Scripts (Recomendado)

### Backend:
```bash
cd backend
./start.sh
```

### Frontend:
```bash
cd frontend
./start.sh
```

### Ambos (em terminais separados):
```bash
# Terminal 1
cd backend
./start.sh

# Terminal 2
cd frontend
./start.sh
```

---

## Opção 2: Comandos Manuais

### Backend:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend:
```bash
cd frontend
npm run dev
```

---

## 🌐 URLs de Acesso

Após iniciar os servidores, acesse:

### Local:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### VPN:
- Frontend: http://100.87.89.96:3000
- Backend: http://100.87.89.96:8000

### Rede Local:
- Frontend: http://192.168.0.250:3000
- Backend: http://192.168.0.250:8000

---

## ⚙️ Configuração do IP

Para usar um IP diferente, edite o arquivo `frontend/.env.local`:

```env
VITE_API_URL=http://SEU_IP:8000
```

Depois reinicie o frontend (Ctrl+C e rode `./start.sh` novamente).

---

## 🔐 Login Padrão

- **Usuário**: bruno
- **Senha**: 123456

---

## ❌ Problemas Comuns

### 1. Erro de CORS
**Solução**: Certifique-se que o backend está rodando com `--host 0.0.0.0`

### 2. Conexão recusada
**Solução**: Verifique se o firewall está bloqueando as portas 3000 e 8000

### 3. Frontend não conecta ao backend
**Solução**:
1. Verifique o arquivo `frontend/.env.local`
2. Reinicie o frontend
3. Limpe o cache do navegador (Ctrl+Shift+R)

---

## 🔥 Firewall (Windows)

Se não conseguir acessar de outros dispositivos, execute como Administrador:

```powershell
New-NetFirewallRule -DisplayName "Finance App Backend" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
New-NetFirewallRule -DisplayName "Finance App Frontend" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 📝 Notas

- O backend usa SQLite - o banco fica em `backend/finance.db`
- Logs do backend aparecem no terminal
- Hot reload está ativado em ambos (mudanças recarregam automaticamente)
