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


def run_migrations():
    """Executar migrações do banco de dados"""
    print("Verificando migrações do banco de dados...")

    migrations = [
        # User migrations
        "ALTER TABLE users ADD COLUMN cpf VARCHAR",
        "ALTER TABLE users ADD COLUMN phone VARCHAR",
        "ALTER TABLE users ADD COLUMN birth_date DATE",
        "ALTER TABLE users ADD COLUMN address VARCHAR",
        # Account migrations
        "ALTER TABLE accounts ADD COLUMN initial_balance REAL DEFAULT 0.0",
        "ALTER TABLE accounts ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE accounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
    ]

    try:
        with engine.begin() as conn:
            for migration in migrations:
                try:
                    conn.execute(text(migration))
                    print(f"Migracao executada: {migration}")
                except Exception as e:
                    # Coluna pode já existir
                    pass

            # Migrar dados existentes: initial_balance = balance
            try:
                result = conn.execute(text("""
                    UPDATE accounts
                    SET initial_balance = balance
                    WHERE initial_balance = 0.0 OR initial_balance IS NULL
                """))
                if result.rowcount > 0:
                    print(f"Migrados {result.rowcount} saldos iniciais")
            except Exception as e:
                pass

        print("Migrações verificadas com sucesso!")
    except Exception as e:
        print(f"Aviso ao verificar migrações: {str(e)}")


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
    run_migrations()
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

# Configurar CORS - TEMPORARIAMENTE PERMITINDO TODAS AS ORIGENS
# TODO: Restringir após testes
print("CORS: Permitindo todas as origens (modo debug)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir TODAS as origens temporariamente
    allow_credentials=False,  # Deve ser False quando allow_origins=["*"]
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
