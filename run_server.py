#!/usr/bin/env python
"""
Servidor API - Roda indefinidamente em modo reload
"""
import subprocess
import sys
import os

os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')

print("=" * 70)
print("🚀 INICIANDO SERVIDOR FINANCE APP")
print("=" * 70)
print(f"Diretório: {os.getcwd()}")
print(f"Comando: python -m uvicorn backend.app.main:app --reload --port 8000")
print("=" * 70)

subprocess.run([
    sys.executable, "-m", "uvicorn", 
    "backend.app.main:app",
    "--port", "8000",
    "--host", "127.0.0.1"
], check=False)
