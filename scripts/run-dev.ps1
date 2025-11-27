# Finance App - Script para executar Backend e Frontend
# Este script abre dois terminais e inicia o projeto

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Finance App - Iniciando Desenvolvimento" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se os diretórios existem
if (-not (Test-Path ".\backend")) {
    Write-Host "[ERRO] Pasta backend nao encontrada!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".\frontend")) {
    Write-Host "[ERRO] Pasta frontend nao encontrada!" -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando Backend (FastAPI)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\backend'; .\venv\Scripts\Activate.ps1; Write-Host 'Iniciando servidor FastAPI...' -ForegroundColor Green; uvicorn app.main:app --reload --port 8000"

Write-Host "Aguardando 3 segundos..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host "Iniciando Frontend (React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$(Get-Location)\frontend'; npm run dev"

Write-Host ""
Write-Host "[OK] Backend iniciado na porta 8000" -ForegroundColor Green
Write-Host "[OK] Frontend iniciado na porta 3000" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor DarkCyan
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor DarkCyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Pressione Ctrl+C para parar os servidores" -ForegroundColor Yellow
