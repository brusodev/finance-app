# Finance App - Setup Script (Windows PowerShell)
# Este script configura e inicializa o projeto Finance App

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Finance App - Inicializador de Projeto" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Cores para output
$Success = "Green"
$ErrorColor = "Red"
$Info = "Yellow"
$Section = "Cyan"

# Funcao para exibir secoes
function Show-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ">> $Title" -ForegroundColor $Section
    Write-Host "---------------------------------------------" -ForegroundColor DarkGray
}

# Funcao para exibir mensagens de sucesso
function Show-Success {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor $Success
}

# Funcao para exibir mensagens de erro
function Show-Error {
    param([string]$Message)
    Write-Host "[ERRO] $Message" -ForegroundColor $ErrorColor
}

# Funcao para exibir informacoes
function Show-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Info
}

# ==============================================================================
# BACKEND SETUP
# ==============================================================================

Show-Section "Configurando Backend (FastAPI)"

$backendPath = ".\backend"

# Verificar se pasta backend existe
if (-not (Test-Path $backendPath)) {
    Show-Error "Pasta backend nao encontrada!"
    exit 1
}

# Entrar na pasta backend
Push-Location $backendPath

# Verificar Python
Show-Info "Verificando Python..."
try {
    $pythonVersion = python --version 2>&1
    Show-Success "Python encontrado: $pythonVersion"
} catch {
    Show-Error "Python nao esta instalado ou nao esta no PATH"
    Show-Info "Baixe em: https://www.python.org/"
    exit 1
}

# Criar ambiente virtual
if (-not (Test-Path "venv")) {
    Show-Info "Criando ambiente virtual..."
    python -m venv venv
    Show-Success "Ambiente virtual criado"
} else {
    Show-Success "Ambiente virtual ja existe"
}

# Ativar ambiente virtual
Show-Info "Ativando ambiente virtual..."
& ".\venv\Scripts\Activate.ps1"
Show-Success "Ambiente virtual ativado"

# Instalar dependencias
Show-Info "Instalando dependencias Python..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

if ($LASTEXITCODE -eq 0) {
    Show-Success "Dependencias Python instaladas"
} else {
    Show-Error "Erro ao instalar dependencias Python"
    exit 1
}

# Criar arquivo .env se nao existir
if (-not (Test-Path ".env")) {
    Show-Info "Criando arquivo .env..."
    $envContent = @"
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/finance_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production

# Environment
ENVIRONMENT=development
"@
    $envContent | Out-File -Encoding UTF8 ".env"
    Show-Success "Arquivo .env criado (configure as variaveis!)"
    Show-Info "Edite .env com suas credenciais PostgreSQL"
} else {
    Show-Success "Arquivo .env ja existe"
}

# Voltar para diretorio raiz
Pop-Location

Show-Success "Backend configurado com sucesso!"

# ==============================================================================
# FRONTEND SETUP
# ==============================================================================

Show-Section "Configurando Frontend (React)"

$frontendPath = ".\frontend"

# Verificar se pasta frontend existe
if (-not (Test-Path $frontendPath)) {
    Show-Error "Pasta frontend nao encontrada!"
    exit 1
}

# Entrar na pasta frontend
Push-Location $frontendPath

# Verificar Node.js
Show-Info "Verificando Node.js..."
try {
    $nodeVersion = node --version 2>&1
    Show-Success "Node.js encontrado: $nodeVersion"
} catch {
    Show-Error "Node.js nao esta instalado ou nao esta no PATH"
    Show-Info "Baixe em: https://nodejs.org/"
    exit 1
}

# Verificar npm
Show-Info "Verificando npm..."
try {
    $npmVersion = npm --version 2>&1
    Show-Success "npm encontrado: $npmVersion"
} catch {
    Show-Error "npm nao esta instalado"
    exit 1
}

# Instalar dependencias
if (-not (Test-Path "node_modules")) {
    Show-Info "Instalando dependencias Node.js (pode levar alguns minutos)..."
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Show-Success "Dependencias Node.js instaladas"
    } else {
        Show-Error "Erro ao instalar dependencias Node.js"
        exit 1
    }
} else {
    Show-Success "Dependencias Node.js ja existem"
}

# Voltar para diretorio raiz
Pop-Location

Show-Success "Frontend configurado com sucesso!"

# ==============================================================================
# BANCO DE DADOS
# ==============================================================================

Show-Section "Informacoes sobre o Banco de Dados"

Show-Info "Este projeto usa PostgreSQL"
Show-Info "Proximas etapas:"
Write-Host "  1. Instale PostgreSQL (https://www.postgresql.org/download/)" -ForegroundColor Gray
Write-Host "  2. Crie um banco de dados: createdb finance_db" -ForegroundColor Gray
Write-Host "  3. Configure DATABASE_URL em backend/.env" -ForegroundColor Gray
Write-Host "  4. Execute migracoes (quando implementadas)" -ForegroundColor Gray

# ==============================================================================
# RESUMO FINAL
# ==============================================================================

Show-Section "Setup Concluido! Pronto para usar"

Write-Host ""
Write-Host "Para iniciar o projeto, execute em dois terminais diferentes:" -ForegroundColor White
Write-Host ""

Write-Host "Terminal 1 - Backend:" -ForegroundColor $Section
Write-Host "  cd backend" -ForegroundColor DarkCyan
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor DarkCyan
Write-Host "  uvicorn app.main:app --reload --port 8000" -ForegroundColor DarkCyan
Write-Host ""

Write-Host "Terminal 2 - Frontend:" -ForegroundColor $Section
Write-Host "  cd frontend" -ForegroundColor DarkCyan
Write-Host "  npm run dev" -ForegroundColor DarkCyan
Write-Host ""

Write-Host "Endpoints:" -ForegroundColor $Section
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor DarkCyan
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor DarkCyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor DarkCyan
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Pronto para comcar a desenvolver! Sucesso!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
