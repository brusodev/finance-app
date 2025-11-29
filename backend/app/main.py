from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, users, categories, transactions, accounts
from .database import engine, Base, SessionLocal
from .models import User
from .utils import hash_password
from sqlalchemy import text
import os

# Criar tabelas automaticamente se não existirem
Base.metadata.create_all(bind=engine)


def init_default_users():
    """Criar usuário padrão se nenhum usuário existir no banco"""
    db = SessionLocal()
    try:
        # Verificar se já existem usuários
        result = db.execute(text('SELECT COUNT(*) FROM users')).scalar()
        if result == 0:
            print("Criando usuários padrão...")
            # Criar usuário padrão
            default_user = User(
                username='bruno',
                hashed_password=hash_password('123456'),
                email='bruno@example.com',
                full_name='Bruno'
            )
            db.add(default_user)
            db.commit()
            print("Usuario padrao 'bruno' criado com sucesso")
        else:
            print(f"Banco de dados contem {result} usuario(s)")
    except Exception as e:
        print(f"Erro ao inicializar usuários: {e}")
        db.rollback()
    finally:
        db.close()


# Lifespan context manager


@asynccontextmanager
async def lifespan(app_instance):
    # Startup
    print("Iniciando Finance App...")
    init_default_users()
    yield
    # Shutdown
    print("Encerrando Finance App...")

app = FastAPI(
    title='Finance App API',
    description='API para gerenciamento de finanças pessoais',
    version='0.1.0',
    lifespan=lifespan
)

# Configurar CORS dinamicamente baseado no ambiente
ALLOWED_ORIGINS = [
    # Desenvolvimento local
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    # Railway
    'https://finance-app-bruno.up.railway.app',
]

# Adicionar origens personalizadas da variável de ambiente
custom_origins = os.getenv('ALLOWED_ORIGINS', '')
if custom_origins:
    ALLOWED_ORIGINS.extend(custom_origins.split(','))

# Adicionar FRONTEND_URL se definido
FRONTEND_URL = os.getenv('FRONTEND_URL')
if FRONTEND_URL and FRONTEND_URL not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(FRONTEND_URL)

# Modo de desenvolvimento - permite IPs locais
if os.getenv('ENVIRONMENT') == 'development':
    ALLOWED_ORIGINS.extend([
        'http://100.87.89.96:3000',
        'http://192.168.0.250:3000',
        'http://192.168.56.1:3000',
    ])

print(f"CORS configurado para: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allow_headers=['*'],
)

# Incluir rotas
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(accounts.router)
app.include_router(transactions.router)


@app.get('/')
async def root():
    return {
        'message': 'Finance App API está funcionando!',
        'status': 'online',
        'documentation': '/docs',
        'endpoints': {
            'auth': '/auth',
            'users': '/users',
            'categories': '/categories',
            'accounts': '/accounts',
            'transactions': '/transactions'
        }
    }
