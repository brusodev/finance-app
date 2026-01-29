#!/usr/bin/env python
"""
Servidor API - Roda indefinidamente em modo reload
"""
import subprocess
import sys
import os
import signal
from pathlib import Path

# Carregar variáveis de ambiente do .env ANTES de iniciar o servidor
from dotenv import load_dotenv
env_path = Path(__file__).parent / 'backend' / '.env'
load_dotenv(env_path)

os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')

# Verificar qual banco está sendo usado
db_url = os.getenv('DATABASE_URL', 'sqlite (padrão)')
db_type = 'PostgreSQL (Railway)' if 'postgresql' in db_url else 'SQLite (local)'

print("=" * 70)
print("🚀 INICIANDO SERVIDOR FINANCE APP")
print("=" * 70)
print(f"Diretório: {os.getcwd()}")
print(f"Banco de dados: {db_type}")
print(f"Comando: python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000")
print("=" * 70)

# Ignorar SIGINT para deixar o uvicorn lidar com isso
if sys.platform != 'win32':
    signal.signal(signal.SIGINT, signal.SIG_IGN)

try:
    process = subprocess.Popen([
        sys.executable, "-m", "uvicorn",
        "backend.app.main:app",
        "--reload",
        "--port", "8000",
        "--host", "0.0.0.0"
    ])
    process.wait()
except KeyboardInterrupt:
    print("\n⚠️ Servidor interrompido pelo usuário")
    process.terminate()
    process.wait()
