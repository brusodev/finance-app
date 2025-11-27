# Finance App - Script para executar Backend e Frontend
# Este script abre dois terminais e inicia o projeto

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Finance App - Iniciando Desenvolvimento" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Obter o diretório do script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Verificar se os diretórios existem
if (-not (Test-Path "$scriptDir\backend")) {
    Write-Host "[ERRO] Pasta backend nao encontrada!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "$scriptDir\frontend")) {
    Write-Host "[ERRO] Pasta frontend nao encontrada!" -ForegroundColor Red
    exit 1
}

# Parar qualquer processo anterior
Write-Host "Limpando processos anteriores..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Write-Host "Iniciando Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; python -m uvicorn backend.app.main:app --port 8000; Write-Host 'Pressione qualquer tecla para fechar...' -ForegroundColor Yellow; `$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')"

Write-Host "Aguardando 3 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Iniciando Frontend (React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm run dev; Write-Host 'Pressione qualquer tecla para fechar...' -ForegroundColor Yellow; `$null = `$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')"

Write-Host ""
Write-Host "[OK] Backend iniciado na porta 8000" -ForegroundColor Green
Write-Host "[OK] Frontend iniciado na porta 3000" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor DarkCyan
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor DarkCyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Usuário padrão criado automaticamente:" -ForegroundColor Cyan
Write-Host "  Username: bruno" -ForegroundColor DarkCyan
Write-Host "  Password: 123456" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Feche os terminais para parar os servidores" -ForegroundColor Yellow
