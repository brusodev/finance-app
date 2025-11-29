#!/usr/bin/env python
"""
Servidor com lifespan events para debug
"""
from backend.app.database import engine, Base
from backend.app.routes import auth, users, categories, transactions
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import sys
import os
from contextlib import asynccontextmanager

sys.path.insert(0, os.path.abspath('.'))
os.chdir('c:\\Users\\bruno\\Desktop\\Dev\\finance-app')


# Debug: Criar tabelas
print("[STARTUP] Criando tabelas...", flush=True)
Base.metadata.create_all(bind=engine)
print("[STARTUP] Tabelas criadas!", flush=True)

# Debug: Lifespan events


@asynccontextmanager
async def lifespan(app_instance):
    print("[LIFESPAN] Iniciando...", flush=True)
    yield
    print("[LIFESPAN] Encerrando...", flush=True)

# Criar app COM lifespan
app = FastAPI(
    title='Finance App API',
    description='API para gerenciamento de finanças pessoais',
    version='0.1.0',
    lifespan=lifespan
)

print("[APP] Configurando CORS...", flush=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
    ],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

print("[APP] Incluindo rotas...", flush=True)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(transactions.router)


@app.get('/')
async def root():
    return {
        'message': 'Finance App API está funcionando!',
        'status': 'online',
    }

if __name__ == "__main__":
    print("[MAIN] Importando uvicorn...", flush=True)
    import uvicorn
    print("[MAIN] Iniciando servidor...", flush=True)
    uvicorn.run(app, host="127.0.0.1", port=8000)
