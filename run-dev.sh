#!/bin/bash
# Finance App - Script para executar Backend e Frontend
# Este script abre dois terminais e inicia o projeto

# Cores
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  Finance App - Iniciando Desenvolvimento${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

# Verificar se os diretórios existem
if [ ! -d "./backend" ]; then
    echo -e "${RED}✗ Pasta 'backend' não encontrada!${NC}"
    exit 1
fi

if [ ! -d "./frontend" ]; then
    echo -e "${RED}✗ Pasta 'frontend' não encontrada!${NC}"
    exit 1
fi

# Função para iniciar backend
start_backend() {
    cd backend
    source venv/bin/activate
    echo -e "${GREEN}Iniciando servidor FastAPI na porta 8000...${NC}"
    uvicorn app.main:app --reload --port 8000
}

# Função para iniciar frontend
start_frontend() {
    cd frontend
    echo -e "${GREEN}Iniciando servidor React na porta 3000...${NC}"
    npm run dev
}

# Iniciar backend em background
echo -e "${YELLOW}Iniciando Backend (FastAPI)...${NC}"
start_backend &
BACKEND_PID=$!

# Aguardar um pouco
sleep 2

# Iniciar frontend em background
echo -e "${YELLOW}Iniciando Frontend (React)...${NC}"
start_frontend &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✓ Backend iniciado na porta 8000${NC}"
echo -e "${GREEN}✓ Frontend iniciado na porta 3000${NC}"
echo ""
echo -e "${CYAN}Endpoints:${NC}"
echo -e "  Frontend:  ${CYAN}http://localhost:3000${NC}"
echo -e "  Backend:   ${CYAN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${CYAN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Pressione Ctrl+C para parar os servidores${NC}"

# Trap para limpar processos ao sair
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo -e '\n${YELLOW}Servidores parados${NC}'; exit" INT TERM

# Aguardar processo
wait
