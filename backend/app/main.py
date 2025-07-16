from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Deixe o import comentado até resolvermos o problema
# from app.routes import users

app = FastAPI(
    title='Finance App API',
    description='API para gerenciamento de finanças pessoais',
    version='0.1.0'
)

# Configurar CORS para permitir requisições do frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Remover temporariamente
# app.include_router(users.router)

@app.get('/')
async def root():
    return {
        'message': 'Finance App API está funcionando!',
        'status': 'online',
        'documentation': '/docs',
    }