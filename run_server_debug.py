#!/usr/bin/env python
"""
Servidor rodando com logging detalhado
"""
import subprocess
import sys
import os

os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')

print("=" * 70)
print("🚀 INICIANDO COM LOGGING STDERR DETALHADO")
print("=" * 70)

process = subprocess.Popen([
    sys.executable, "-m", "uvicorn",
    "backend.app.main:app",
    "--port", "8000",
    "--log-level", "info"
], 
    stdout=sys.stdout, 
    stderr=sys.stderr,
    text=True
)

try:
    process.wait()
except KeyboardInterrupt:
    process.terminate()
    process.wait()
