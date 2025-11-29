#!/usr/bin/env python
"""
Loop servidor - Re-inicia quando fecha
Apenas roda uma vez e NUNCA fecha
"""
import subprocess
import sys
import os

os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')

print("\n" + "=" * 70)
print("🚀 INICIANDO SERVIDOR (Modo contínuo)")
print("=" * 70)

subprocess.call([
    sys.executable, "-m", "uvicorn",
    "backend.app.main:app",
    "--port", "8000",
    "--host", "127.0.0.1"
])
