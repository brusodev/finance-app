# 🚀 Guia de Migração - Railway → Docker Local

Este guia detalha o processo completo de migração da aplicação Finance App do Railway para um ambiente Docker local.

---

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Visão Geral da Migração](#visão-geral-da-migração)
3. [Estrutura Docker](#estrutura-docker)
4. [Passo a Passo](#passo-a-passo)
5. [Verificação e Testes](#verificação-e-testes)
6. [Troubleshooting](#troubleshooting)
7. [Rollback](#rollback)

---

## 🛠️ Pré-requisitos

### Software Necessário
- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
- **Docker Compose** v2.x ou superior
- **PostgreSQL Client Tools** (para backup/restore)
  - Windows: https://www.postgresql.org/download/windows/
  - Linux: `sudo apt install postgresql-client`
  - Mac: `brew install postgresql`

### Verificar Instalações
```bash
# Verificar Docker
docker --version
docker-compose --version

# Verificar PostgreSQL tools
pg_dump --version
psql --version
```

---

## 📊 Visão Geral da Migração

### Arquitetura Atual (Railway)
```
Railway Cloud
├── Backend (FastAPI)
│   └── DATABASE_URL: postgresql://switchback.proxy.rlwy.net:25835/railway
└── Frontend (React/Vite)
    └── Deploy estático
```

### Arquitetura Nova (Docker Local)
```
Docker Compose
├── postgres (container)
│   └── PostgreSQL 15
│   └── Volume: postgres_data
├── backend (container)
│   └── FastAPI
│   └── Conecta ao postgres
└── frontend (container)
    └── Nginx + React build
    └── Conecta ao backend
```

---

## 🏗️ Estrutura Docker

### Arquivos Criados

```
finance-app/
├── docker-compose.yml          # Orquestração dos containers
├── .env.docker                 # Variáveis de ambiente
├── migrate_from_railway.ps1    # Script de migração (Windows)
├── migrate_from_railway.sh     # Script de migração (Linux/Mac)
├── backups/                    # Backups do banco Railway
├── backend/
│   ├── Dockerfile              # Imagem do backend
│   └── requirements.txt
└── frontend/
    ├── Dockerfile              # Imagem do frontend
    └── nginx.conf              # Configuração do Nginx
```

### Serviços Docker

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **postgres** | 5432 | Banco de dados PostgreSQL 15 |
| **backend** | 8000 | API FastAPI |
| **frontend** | 3000 | React App (Nginx) |

---

## 📝 Passo a Passo

### FASE 1: Preparação (5 minutos)

#### 1.1 Instalar PostgreSQL Client (se não tiver)

**Windows:**
```powershell
# Baixar e instalar de: https://www.postgresql.org/download/windows/
# Adicionar ao PATH: C:\Program Files\PostgreSQL\15\bin
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql-client
```

**Mac:**
```bash
brew install postgresql
```

#### 1.2 Verificar Docker

```bash
docker ps
docker-compose version
```

---

### FASE 2: Backup do Railway (10 minutos)

#### 2.1 Executar Script de Migração

**Windows (PowerShell como Administrador):**
```powershell
cd C:\Users\bruno\Desktop\Dev\finance-app
.\migrate_from_railway.ps1
```

**Linux/Mac:**
```bash
cd ~/Desktop/Dev/finance-app
chmod +x migrate_from_railway.sh
./migrate_from_railway.sh
```

#### O que o script faz:
1. ✅ Conecta no banco Railway
2. ✅ Faz dump completo (pg_dump)
3. ✅ Sobe container PostgreSQL local
4. ✅ Restaura os dados no banco local
5. ✅ Valida quantidade de registros

#### 2.2 Verificar Backup

```bash
ls -lh backups/
# Deve aparecer: railway_backup_YYYYMMDD_HHMMSS.sql
```

---

### FASE 3: Deploy Local (15 minutos)

#### 3.1 Subir todos os containers

```bash
docker-compose up -d
```

#### 3.2 Verificar status

```bash
docker-compose ps
```

Saída esperada:
```
NAME                STATUS              PORTS
finance-postgres    running (healthy)   0.0.0.0:5432->5432/tcp
finance-backend     running             0.0.0.0:8000->8000/tcp
finance-frontend    running             0.0.0.0:3000->80/tcp
```

#### 3.3 Acompanhar logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas postgres
docker-compose logs -f postgres
```

---

### FASE 4: Verificação (5 minutos)

#### 4.1 Testar Backend

```bash
# Health check
curl http://localhost:8000/

# Documentação interativa
# Abrir navegador: http://localhost:8000/docs
```

#### 4.2 Testar Frontend

```
Abrir navegador: http://localhost:3000
```

#### 4.3 Testar Login

```
Usuário: bruno
Senha: 123456
```

#### 4.4 Verificar Dados Migrados

```bash
# Conectar no PostgreSQL
docker exec -it finance-postgres psql -U finance_user -d finance_db

# Dentro do psql:
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM accounts;
SELECT COUNT(*) FROM transactions;
SELECT COUNT(*) FROM categories;

# Sair
\q
```

---

## ✅ Verificação e Testes

### Checklist de Validação

- [ ] Container `postgres` está saudável
- [ ] Container `backend` está rodando
- [ ] Container `frontend` está rodando
- [ ] Backend responde em http://localhost:8000
- [ ] Frontend carrega em http://localhost:3000
- [ ] Login funciona com credenciais existentes
- [ ] Dashboard exibe dados migrados
- [ ] Transações estão visíveis
- [ ] Contas bancárias estão corretas

### Testes Funcionais

```bash
# Teste de login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"bruno","password":"123456"}'

# Teste de dashboard (precisa do token)
curl -X GET http://localhost:8000/dashboard \
  -H "Authorization: Bearer <seu-token-aqui>"
```

---

## 🔧 Troubleshooting

### Problema: "pg_dump: command not found"

**Solução:**
Instalar PostgreSQL client tools (ver [Pré-requisitos](#pré-requisitos))

---

### Problema: Container postgres não fica healthy

**Verificar logs:**
```bash
docker-compose logs postgres
```

**Solução:**
```bash
# Remover container e volume
docker-compose down -v

# Subir novamente
docker-compose up -d postgres

# Aguardar 30 segundos e verificar
docker-compose ps
```

---

### Problema: Backend não conecta no banco

**Verificar variáveis de ambiente:**
```bash
docker exec finance-backend env | grep DATABASE
```

**Deve retornar:**
```
DATABASE_URL=postgresql://finance_user:finance_password_2024@postgres:5432/finance_db
```

**Solução:**
```bash
# Recriar container backend
docker-compose up -d --force-recreate backend
```

---

### Problema: Frontend não conecta no backend

**Verificar configuração:**
```bash
docker exec finance-frontend cat /etc/nginx/conf.d/default.conf
```

**Solução:**
Editar [frontend/Dockerfile](frontend/Dockerfile) e rebuildar:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

---

### Problema: Porta já está em uso

**Verificar portas:**
```bash
# Windows
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Linux/Mac
lsof -i :8000
lsof -i :3000
lsof -i :5432
```

**Solução:**
Parar o processo ou mudar as portas no [docker-compose.yml](docker-compose.yml)

---

## 🔄 Rollback

### Se algo der errado, você tem 3 opções:

#### Opção 1: Reverter para Railway (imediato)
O ambiente Railway continua funcionando. Basta apontar o frontend para a URL do Railway.

#### Opção 2: Restaurar backup específico
```bash
# Listar backups
ls backups/

# Restaurar um backup específico
BACKUP_FILE="backups/railway_backup_20240328_150000.sql"
PGPASSWORD="finance_password_2024" psql -h localhost -U finance_user -d finance_db -f $BACKUP_FILE
```

#### Opção 3: Limpar tudo e recomeçar
```bash
# Parar e remover tudo
docker-compose down -v

# Remover imagens
docker rmi finance-app-backend finance-app-frontend

# Recomeçar do zero
docker-compose up -d
```

---

## 📊 Comandos Úteis

### Gerenciamento Docker

```bash
# Ver logs em tempo real
docker-compose logs -f

# Reiniciar um serviço
docker-compose restart backend

# Parar tudo
docker-compose stop

# Iniciar tudo
docker-compose start

# Remover tudo (mantém volumes)
docker-compose down

# Remover tudo (incluindo volumes - CUIDADO!)
docker-compose down -v

# Rebuildar imagens
docker-compose build

# Rebuildar e subir
docker-compose up -d --build
```

### Gerenciamento PostgreSQL

```bash
# Conectar no banco
docker exec -it finance-postgres psql -U finance_user -d finance_db

# Backup manual
docker exec finance-postgres pg_dump -U finance_user finance_db > backup_manual.sql

# Restore manual
cat backup_manual.sql | docker exec -i finance-postgres psql -U finance_user -d finance_db

# Ver tamanho do banco
docker exec finance-postgres psql -U finance_user -d finance_db -c "SELECT pg_size_pretty(pg_database_size('finance_db'));"
```

### Monitoramento

```bash
# Ver uso de recursos
docker stats

# Ver volumes
docker volume ls

# Inspecionar volume de dados
docker volume inspect finance-app_postgres_data

# Ver espaço em disco
docker system df
```

---

## 🎯 Próximos Passos

Após a migração bem-sucedida:

1. **Configurar backups automáticos**
   - Criar cronjob/task scheduler para backups diários
   - Exemplo: `0 2 * * * /path/to/backup_script.sh`

2. **Configurar domínio (opcional)**
   - Usar nginx reverse proxy
   - Configurar SSL com Let's Encrypt

3. **Monitoramento**
   - Instalar Portainer para interface web
   - Configurar alertas de saúde dos containers

4. **Segurança**
   - Mudar senhas padrão no `.env.docker`
   - Configurar firewall para portas Docker
   - Habilitar autenticação no PostgreSQL

---

## 📞 Suporte

### Documentação Oficial
- Docker: https://docs.docker.com/
- PostgreSQL: https://www.postgresql.org/docs/
- FastAPI: https://fastapi.tiangolo.com/

### Logs de Erro
Se encontrar problemas, colete os logs:
```bash
docker-compose logs > debug_logs.txt
```

---

## ✨ Conclusão

Parabéns! Você migrou com sucesso sua aplicação do Railway para Docker local.

**Benefícios conquistados:**
- ✅ Controle total da infraestrutura
- ✅ Sem custos de cloud
- ✅ Ambiente isolado e reproduzível
- ✅ Facilidade para desenvolvimento e testes
- ✅ Dados locais seguros

**Lembre-se:**
- Fazer backups regulares
- Manter volumes Docker seguros
- Atualizar imagens periodicamente

Bom trabalho! 🎉
