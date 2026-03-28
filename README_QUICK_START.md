# ⚡ Quick Start - Migração em 3 Passos

## 🎯 Resumo Executivo

Migrar sua aplicação do Railway para Docker local em **menos de 30 minutos**.

---

## 📋 Pré-requisitos Rápidos

```powershell
# Verificar se tem tudo instalado
docker --version          # Precisa estar instalado
docker-compose --version  # Precisa estar instalado
pg_dump --version        # Precisa estar instalado
```

**Não tem PostgreSQL tools?**
- Windows: https://www.postgresql.org/download/windows/
- Adicione ao PATH: `C:\Program Files\PostgreSQL\15\bin`

---

## 🚀 3 Passos para Migrar

### PASSO 1: Backup do Railway (5 min)

```powershell
# PowerShell como Administrador
cd C:\Users\bruno\Desktop\Dev\finance-app
.\migrate_from_railway.ps1
```

**O que acontece:**
- ✅ Conecta no banco Railway
- ✅ Faz backup completo
- ✅ Cria container PostgreSQL local
- ✅ Restaura todos os dados

---

### PASSO 2: Subir Containers (2 min)

```bash
docker-compose up -d
```

**Aguarde os containers iniciarem:**
```bash
docker-compose ps
```

Deve mostrar 3 containers rodando:
- `finance-postgres` (healthy)
- `finance-backend` (running)
- `finance-frontend` (running)

---

### PASSO 3: Verificar (3 min)

**Abrir no navegador:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Docs API: http://localhost:8000/docs

**Login:**
- Usuário: `bruno`
- Senha: `123456`

---

## ✅ Validação

### Todos os dados foram migrados?

```bash
# Conectar no banco
docker exec -it finance-postgres psql -U finance_user -d finance_db

# Verificar registros
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM accounts;
SELECT COUNT(*) FROM transactions;

# Sair
\q
```

---

## 🔧 Problemas Comuns

### "pg_dump: command not found"
➡️ Instale PostgreSQL client tools

### "Container postgres não fica healthy"
```bash
docker-compose down -v
docker-compose up -d
```

### "Backend não conecta no banco"
```bash
docker-compose logs backend
docker-compose restart backend
```

### "Porta já está em uso"
```bash
# Ver o que está usando a porta
netstat -ano | findstr :8000
# Mate o processo ou mude a porta no docker-compose.yml
```

---

## 📊 Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar um serviço
docker-compose restart backend

# Parar tudo
docker-compose stop

# Iniciar tudo
docker-compose start

# Remover tudo (CUIDADO: apaga dados!)
docker-compose down -v
```

---

## 🔄 Rollback

Se algo der errado, o Railway continua funcionando!

Ou restaure um backup:
```bash
ls backups/  # Ver backups disponíveis
# Restaurar backup específico com o script
```

---

## 📚 Documentação Completa

Para detalhes completos, veja [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

---

## 🎉 Pronto!

Sua aplicação agora roda 100% local com Docker!

**Portas:**
- PostgreSQL: `localhost:5432`
- Backend: `localhost:8000`
- Frontend: `localhost:3000`

**Dados:**
- Volume PostgreSQL: `finance-app_postgres_data`
- Backups: `./backups/`
