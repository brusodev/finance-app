# ========================================
# Script de Migração - Railway → Docker Local (Windows PowerShell)
# ========================================

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "MIGRAÇÃO RAILWAY → DOCKER LOCAL" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Configurações Railway (origem)
$RAILWAY_HOST = "switchback.proxy.rlwy.net"
$RAILWAY_PORT = "25835"
$RAILWAY_DB = "railway"
$RAILWAY_USER = "postgres"
$RAILWAY_PASSWORD = "AipgyavIuQtKDvlGfycpkIgiVCYqkSxo"

# Configurações Docker Local (destino)
$DOCKER_HOST_ADDR = "localhost"
$DOCKER_PORT = "5432"
$DOCKER_DB = "finance_db"
$DOCKER_USER = "finance_user"
$DOCKER_PASSWORD = "finance_password_2024"

$BACKUP_DIR = ".\backups"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "$BACKUP_DIR\railway_backup_$TIMESTAMP.sql"

# Criar diretório de backup
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "PASSO 1: Fazendo backup do banco Railway..." -ForegroundColor Yellow
Write-Host "Conectando em: $RAILWAY_HOST`:$RAILWAY_PORT"
Write-Host "Banco de dados: $RAILWAY_DB"
Write-Host ""

# Garantir que o PostgreSQL 17 está no PATH
$pgPaths = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin"
)
foreach ($p in $pgPaths) {
    if ((Test-Path $p) -and ($env:PATH -notlike "*$p*")) {
        $env:PATH = "$p;" + $env:PATH
        break
    }
}

# Verificar se pg_dump está disponível
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: pg_dump não encontrado!" -ForegroundColor Red
    Write-Host "Instale o PostgreSQL client tools de: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

$pgDumpVersion = (pg_dump --version)
Write-Host "Usando: $pgDumpVersion" -ForegroundColor Gray

# Fazer dump do banco Railway
$env:PGPASSWORD = $RAILWAY_PASSWORD
pg_dump -h $RAILWAY_HOST -p $RAILWAY_PORT -U $RAILWAY_USER -d $RAILWAY_DB --no-owner --no-acl -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    $fileSize = (Get-Item $BACKUP_FILE).Length / 1KB
    Write-Host "Backup criado com sucesso: $BACKUP_FILE" -ForegroundColor Green
    Write-Host "Tamanho: $([math]::Round($fileSize, 2)) KB"
} else {
    Write-Host "Erro ao criar backup!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "PASSO 2: Verificando container PostgreSQL local..." -ForegroundColor Yellow

# Verificar se o container já está rodando
$postgresRunning = docker ps --filter "name=finance-postgres" --format "{{.Names}}"

if (-not $postgresRunning) {
    Write-Host "Container PostgreSQL não está rodando. Iniciando..."
    docker compose up -d postgres

    # Aguardar o banco ficar pronto
    Write-Host "Aguardando PostgreSQL inicializar..."
    Start-Sleep -Seconds 10

    # Verificar se está saudável
    $ready = $false
    for ($i = 1; $i -le 30; $i++) {
        docker exec finance-postgres pg_isready -U finance_user -d finance_db 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL pronto!" -ForegroundColor Green
            $ready = $true
            break
        }
        Write-Host "Tentativa $i/30..."
        Start-Sleep -Seconds 2
    }

    if (-not $ready) {
        Write-Host "PostgreSQL não ficou pronto após 60 segundos" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Container PostgreSQL já está rodando" -ForegroundColor Green
}

Write-Host ""
Write-Host "PASSO 3: Restaurando dados no PostgreSQL local..." -ForegroundColor Yellow

# Restaurar backup no banco local
$env:PGPASSWORD = $DOCKER_PASSWORD
psql -h $DOCKER_HOST_ADDR -p $DOCKER_PORT -U $DOCKER_USER -d $DOCKER_DB -f $BACKUP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "Dados restaurados com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Erro ao restaurar dados!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "PASSO 4: Verificando migração..." -ForegroundColor Yellow

# Contar registros em tabelas importantes
Write-Host "Verificando tabelas..."
$env:PGPASSWORD = $DOCKER_PASSWORD
psql -h $DOCKER_HOST_ADDR -p $DOCKER_PORT -U $DOCKER_USER -d $DOCKER_DB -c "SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM accounts) as accounts, (SELECT COUNT(*) FROM transactions) as transactions, (SELECT COUNT(*) FROM categories) as categories;"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "MIGRAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backup salvo em: $BACKUP_FILE"
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "1. Iniciar toda a stack: docker compose up -d"
Write-Host "2. Acessar frontend: http://localhost:3000"
Write-Host "3. Acessar backend API: http://localhost:8000"
Write-Host "4. Acessar docs API: http://localhost:8000/docs"
Write-Host ""
