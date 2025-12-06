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
    print("[INFO] Verificando migracoes do banco de dados...")

    # Verificar se estamos usando PostgreSQL ou SQLite
    db_url = str(engine.url)
    is_postgres = 'postgresql' in db_url

    print(f"[INFO] Banco de dados detectado: {'PostgreSQL' if is_postgres else 'SQLite'}")

    # Usar tipo correto dependendo do banco
    float_type = "DOUBLE PRECISION" if is_postgres else "REAL"
    bool_default = "TRUE" if is_postgres else "1"

    # PostgreSQL suporta IF NOT EXISTS, SQLite não
    if is_postgres:
        migrations = [
            # User migrations
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR", "cpf"),
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR", "phone"),
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE", "birth_date"),
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR", "address"),
            # Account migrations
            (f"ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance {float_type} DEFAULT 0.0", "initial_balance"),
            (f"ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT {bool_default}", "is_active"),
            ("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "created_at"),
            ("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "updated_at"),
        ]
    else:
        migrations = [
            # User migrations
            ("ALTER TABLE users ADD COLUMN cpf VARCHAR", "cpf"),
            ("ALTER TABLE users ADD COLUMN phone VARCHAR", "phone"),
            ("ALTER TABLE users ADD COLUMN birth_date DATE", "birth_date"),
            ("ALTER TABLE users ADD COLUMN address VARCHAR", "address"),
            # Account migrations
            (f"ALTER TABLE accounts ADD COLUMN initial_balance {float_type} DEFAULT 0.0", "initial_balance"),
            (f"ALTER TABLE accounts ADD COLUMN is_active INTEGER DEFAULT {bool_default}", "is_active"),
            ("ALTER TABLE accounts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "created_at"),
            ("ALTER TABLE accounts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "updated_at"),
        ]

    try:
        with engine.begin() as conn:
            for migration_sql, column_name in migrations:
                try:
                    conn.execute(text(migration_sql))
                    print(f"  [OK] Migracao aplicada: {column_name}")
                except Exception as e:
                    error_msg = str(e).lower()
                    if 'already exists' in error_msg or 'duplicate column' in error_msg:
                        print(f"  [SKIP] Coluna ja existe: {column_name}")
                    else:
                        print(f"  [WARN] Erro ao migrar {column_name}: {e}")

            # Migrar dados existentes: initial_balance = balance
            try:
                result = conn.execute(text("""
                    UPDATE accounts
                    SET initial_balance = balance
                    WHERE initial_balance IS NULL OR initial_balance = 0.0
                """))
                if result.rowcount > 0:
                    print(f"  [DATA] Migrados {result.rowcount} saldos iniciais")
            except Exception as e:
                print(f"  [WARN] Erro ao migrar saldos: {e}")

        print("[OK] Migracoes verificadas com sucesso!")
    except Exception as e:
        print(f"[ERRO] Erro ao verificar migracoes: {str(e)}")
        import traceback
        traceback.print_exc()


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
