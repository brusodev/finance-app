#!/bin/bash

# ========================================
# Script de Migração - Railway → Docker Local
# ========================================

set -e

echo "========================================="
echo "MIGRAÇÃO RAILWAY → DOCKER LOCAL"
echo "========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurações Railway (origem)
RAILWAY_HOST="switchback.proxy.rlwy.net"
RAILWAY_PORT="25835"
RAILWAY_DB="railway"
RAILWAY_USER="postgres"
RAILWAY_PASSWORD="AipgyavIuQtKDvlGfycpkIgiVCYqkSxo"

# Configurações Docker Local (destino)
DOCKER_HOST="localhost"
DOCKER_PORT="5432"
DOCKER_DB="finance_db"
DOCKER_USER="finance_user"
DOCKER_PASSWORD="finance_password_2024"

BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/railway_backup_$(date +%Y%m%d_%H%M%S).sql"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}PASSO 1: Fazendo backup do banco Railway...${NC}"
echo "Conectando em: $RAILWAY_HOST:$RAILWAY_PORT"
echo "Banco de dados: $RAILWAY_DB"
echo ""

# Fazer dump do banco Railway
PGPASSWORD="$RAILWAY_PASSWORD" pg_dump \
    -h "$RAILWAY_HOST" \
    -p "$RAILWAY_PORT" \
    -U "$RAILWAY_USER" \
    -d "$RAILWAY_DB" \
    --no-owner \
    --no-acl \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup criado com sucesso: $BACKUP_FILE${NC}"
    echo "Tamanho: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo -e "${RED}✗ Erro ao criar backup!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}PASSO 2: Verificando container PostgreSQL local...${NC}"

# Verificar se o container já está rodando
if ! docker ps | grep -q finance-postgres; then
    echo "Container PostgreSQL não está rodando. Iniciando..."
    docker-compose up -d postgres

    # Aguardar o banco ficar pronto
    echo "Aguardando PostgreSQL inicializar..."
    sleep 10

    # Verificar se está saudável
    for i in {1..30}; do
        if docker exec finance-postgres pg_isready -U finance_user -d finance_db > /dev/null 2>&1; then
            echo -e "${GREEN}✓ PostgreSQL pronto!${NC}"
            break
        fi
        echo "Tentativa $i/30..."
        sleep 2
    done
else
    echo -e "${GREEN}✓ Container PostgreSQL já está rodando${NC}"
fi

echo ""
echo -e "${YELLOW}PASSO 3: Restaurando dados no PostgreSQL local...${NC}"

# Restaurar backup no banco local
PGPASSWORD="$DOCKER_PASSWORD" psql \
    -h "$DOCKER_HOST" \
    -p "$DOCKER_PORT" \
    -U "$DOCKER_USER" \
    -d "$DOCKER_DB" \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dados restaurados com sucesso!${NC}"
else
    echo -e "${RED}✗ Erro ao restaurar dados!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}PASSO 4: Verificando migração...${NC}"

# Contar registros em tabelas importantes
echo "Verificando tabelas..."
PGPASSWORD="$DOCKER_PASSWORD" psql \
    -h "$DOCKER_HOST" \
    -p "$DOCKER_PORT" \
    -U "$DOCKER_USER" \
    -d "$DOCKER_DB" \
    -c "SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM accounts) as accounts,
        (SELECT COUNT(*) FROM transactions) as transactions,
        (SELECT COUNT(*) FROM categories) as categories;"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}MIGRAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Backup salvo em: $BACKUP_FILE"
echo ""
echo "Próximos passos:"
echo "1. Iniciar toda a stack: docker-compose up -d"
echo "2. Acessar frontend: http://localhost:3000"
echo "3. Acessar backend API: http://localhost:8000"
echo "4. Acessar docs API: http://localhost:8000/docs"
echo ""
