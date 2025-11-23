#!/bin/bash
# Finance App - Setup Script (macOS/Linux)
# Este script configura e inicializa o projeto Finance App

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para exibir seções
show_section() {
    echo ""
    echo -e "${CYAN}► $1${NC}"
    echo "─────────────────────────────────────────"
}

# Função para exibir mensagens de sucesso
show_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Função para exibir mensagens de erro
show_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Função para exibir informações
show_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Banner
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}  Finance App - Inicializador de Projeto${NC}"
echo -e "${CYAN}=========================================${NC}"

# ==============================================================================
# BACKEND SETUP
# ==============================================================================

show_section "Configurando Backend (FastAPI)"

BACKEND_PATH="./backend"

# Verificar se pasta backend existe
if [ ! -d "$BACKEND_PATH" ]; then
    show_error "Pasta 'backend' não encontrada!"
    exit 1
fi

# Entrar na pasta backend
cd "$BACKEND_PATH" || exit 1

# Verificar Python
show_info "Verificando Python..."
if ! command -v python3 &> /dev/null; then
    show_error "Python3 não está instalado ou não está no PATH"
    show_info "Instale com: brew install python3 (macOS) ou apt-get install python3 (Linux)"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1)
show_success "Python encontrado: $PYTHON_VERSION"

# Criar ambiente virtual
if [ ! -d "venv" ]; then
    show_info "Criando ambiente virtual..."
    python3 -m venv venv
    show_success "Ambiente virtual criado"
else
    show_success "Ambiente virtual já existe"
fi

# Ativar ambiente virtual
show_info "Ativando ambiente virtual..."
source venv/bin/activate
show_success "Ambiente virtual ativado"

# Instalar dependências
show_info "Instalando dependências Python..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1

if [ $? -eq 0 ]; then
    show_success "Dependências Python instaladas"
else
    show_error "Erro ao instalar dependências Python"
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    show_info "Criando arquivo .env..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Environment
ENVIRONMENT=development
EOF
    show_success "Arquivo .env criado (configure as variáveis!)"
    show_info "Edite .env com suas credenciais PostgreSQL"
else
    show_success "Arquivo .env já existe"
fi

# Voltar para diretório raiz
cd ..

show_success "Backend configurado com sucesso!"

# ==============================================================================
# FRONTEND SETUP
# ==============================================================================

show_section "Configurando Frontend (React)"

FRONTEND_PATH="./frontend"

# Verificar se pasta frontend existe
if [ ! -d "$FRONTEND_PATH" ]; then
    show_error "Pasta 'frontend' não encontrada!"
    exit 1
fi

# Entrar na pasta frontend
cd "$FRONTEND_PATH" || exit 1

# Verificar Node.js
show_info "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    show_error "Node.js não está instalado ou não está no PATH"
    show_info "Baixe em: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node --version 2>&1)
show_success "Node.js encontrado: $NODE_VERSION"

# Verificar npm
show_info "Verificando npm..."
if ! command -v npm &> /dev/null; then
    show_error "npm não está instalado"
    exit 1
fi
NPM_VERSION=$(npm --version 2>&1)
show_success "npm encontrado: $NPM_VERSION"

# Instalar dependências
if [ ! -d "node_modules" ]; then
    show_info "Instalando dependências Node.js (pode levar alguns minutos)..."
    npm install
    
    if [ $? -eq 0 ]; then
        show_success "Dependências Node.js instaladas"
    else
        show_error "Erro ao instalar dependências Node.js"
        exit 1
    fi
else
    show_success "Dependências Node.js já existem"
fi

# Voltar para diretório raiz
cd ..

show_success "Frontend configurado com sucesso!"

# ==============================================================================
# BANCO DE DADOS
# ==============================================================================

show_section "Informações sobre o Banco de Dados"

show_info "Este projeto usa PostgreSQL"
show_info "Próximas etapas:"
echo "  1. Instale PostgreSQL (brew install postgresql ou apt-get install postgresql)"
echo "  2. Crie um banco de dados: createdb finance_db"
echo "  3. Configure DATABASE_URL em backend/.env"
echo "  4. Execute migrações (quando implementadas)"

# ==============================================================================
# RESUMO FINAL
# ==============================================================================

show_section "Setup Concluído! 🎉"

echo ""
echo "Para iniciar o projeto, execute em dois terminais diferentes:"
echo ""

echo -e "${CYAN}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn app.main:app --reload --port 8000"
echo ""

echo -e "${CYAN}Terminal 2 - Frontend:${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo ""

echo -e "${CYAN}Endpoints:${NC}"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""

echo -e "${CYAN}=========================================${NC}"
echo -e "${GREEN}Pronto para começar a desenvolver! ✨${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
