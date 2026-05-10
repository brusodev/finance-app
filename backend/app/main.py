from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .routes import (
    auth, users, categories, transactions,
    accounts, transfers, investments, credit_cards,
)
from .database import engine, Base, SessionLocal, get_db
from sqlalchemy import text, and_
from .models import User
import os
from datetime import date

# Criar tabelas automaticamente se não existirem
Base.metadata.create_all(bind=engine)


def run_migrations():
    """Executar migrações do banco de dados"""
    print("[INFO] Verificando migracoes do banco de dados...")

    # Verificar se estamos usando PostgreSQL ou SQLite
    db_url = str(engine.url)
    is_postgres = 'postgresql' in db_url

    print(
        f"[INFO] Banco de dados detectado: {'PostgreSQL' if is_postgres else 'SQLite'}")

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
            ("ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR DEFAULT 'BRL'", "currency"),
            # Account migrations
            (f"ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance {float_type} DEFAULT 0.0", "initial_balance"),
            (f"ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT {bool_default}", "is_active"),
            ("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "created_at"),
            ("ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP", "updated_at"),
            # Transaction migrations for transfers
            (
                "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
                "transfer_id VARCHAR",
                "transfer_id"
            ),
            (
                "ALTER TABLE transactions ADD COLUMN IF NOT EXISTS "
                "transfer_account_id INTEGER REFERENCES accounts(id)",
                "transfer_account_id"
            ),
            # Investment transaction migrations
            (
                "ALTER TABLE investment_transactions ADD COLUMN IF NOT EXISTS "
                "account_id INTEGER REFERENCES accounts(id)",
                "investment_transactions.account_id"
            ),
            (
                "ALTER TABLE investment_transactions ADD COLUMN IF NOT EXISTS "
                "account_transaction_id INTEGER REFERENCES transactions(id)",
                "investment_transactions.account_transaction_id"
            ),
        ]
    else:
        migrations = [
            # User migrations
            ("ALTER TABLE users ADD COLUMN cpf VARCHAR", "cpf"),
            ("ALTER TABLE users ADD COLUMN phone VARCHAR", "phone"),
            ("ALTER TABLE users ADD COLUMN birth_date DATE", "birth_date"),
            ("ALTER TABLE users ADD COLUMN address VARCHAR", "address"),
            (
                "ALTER TABLE users ADD COLUMN currency VARCHAR DEFAULT 'BRL'",
                "currency"
            ),
            # Account migrations
            (
                f"ALTER TABLE accounts ADD COLUMN initial_balance "
                f"{float_type} DEFAULT 0.0",
                "initial_balance"
            ),
            (
                f"ALTER TABLE accounts ADD COLUMN is_active "
                f"INTEGER DEFAULT {bool_default}",
                "is_active"
            ),
            (
                "ALTER TABLE accounts ADD COLUMN created_at "
                "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "created_at"
            ),
            (
                "ALTER TABLE accounts ADD COLUMN updated_at "
                "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
                "updated_at"
            ),
            # Transaction migrations for transfers
            (
                "ALTER TABLE transactions ADD COLUMN transfer_id VARCHAR",
                "transfer_id"
            ),
            (
                "ALTER TABLE transactions ADD COLUMN "
                "transfer_account_id INTEGER REFERENCES accounts(id)",
                "transfer_account_id"
            ),
            # Investment transaction migrations
            (
                "ALTER TABLE investment_transactions ADD COLUMN "
                "account_id INTEGER REFERENCES accounts(id)",
                "investment_transactions.account_id"
            ),
            (
                "ALTER TABLE investment_transactions ADD COLUMN "
                "account_transaction_id INTEGER REFERENCES transactions(id)",
                "investment_transactions.account_transaction_id"
            ),
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
                    print(
                        f"  [DATA] Migrados {result.rowcount} saldos iniciais")
            except Exception as e:
                print(f"  [WARN] Erro ao migrar saldos: {e}")

        print("[OK] Migracoes verificadas com sucesso!")
    except Exception as e:
        print(f"[ERRO] Erro ao verificar migracoes: {str(e)}")
        import traceback
        traceback.print_exc()


def check_users():
    """Verificar se existem usuários cadastrados"""
    db = SessionLocal()
    try:
        result = db.execute(text('SELECT COUNT(*) FROM users')).scalar()
        if result == 0:
            print("[AVISO] Nenhum usuário cadastrado. Crie um usuário via POST /auth/register")
        else:
            print(f"[INFO] Banco de dados contém {result} usuário(s)")
    except Exception as e:
        print(f"[ERRO] Erro ao verificar usuários: {e}")
    finally:
        db.close()


# Lifespan context manager


@asynccontextmanager
async def lifespan(app_instance):
    # Startup
    print("Iniciando Finance App...")
    run_migrations()
    check_users()
    yield
    # Shutdown
    print("Encerrando Finance App...")

app = FastAPI(
    title='Finance App API',
    description='API para gerenciamento de finanças pessoais',
    version='0.1.0',
    lifespan=lifespan
)


# Configurar CORS
# Em produção o frontend faz proxy via nginx (mesmo domínio) — sem cross-origin.
# Em desenvolvimento, permite localhost para facilitar o dev local.
environment = os.getenv("ENVIRONMENT", "production")

if environment == "production":
    # Requisições chegam do nginx no mesmo host: origem é o próprio domínio
    allowed_origins = [
        "https://finance.projdev.site",
        "http://finance-frontend",   # container interno
    ]
else:
    # Dev local: Vite roda em portas separadas
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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
app.include_router(transfers.router)
app.include_router(investments.router)
app.include_router(credit_cards.router)


@app.get('/')
async def root():
    return {
        'message': 'Prospera API está funcionando!',
        'status': 'online',
        'documentation': '/docs',
        'endpoints': {
            'auth': '/auth',
            'users': '/users',
            'categories': '/categories',
            'accounts': '/accounts',
            'transactions': '/transactions',
            'dashboard': '/dashboard'
        }
    }


@app.get('/dashboard')
async def dashboard(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Dashboard com resumo geral das finanças do usuário.

    Retorna:
    - total_accounts: Número de contas ativas
    - total_categories: Número de categorias
    - total_transactions: Número de transações
    - total_balance: Saldo total de todas as contas
    - total_income: Total de receitas
    - total_expense: Total de despesas
    - net_balance: Balanço líquido (receitas - despesas)
    """
    from sqlalchemy import func
    from .models import Account, Transaction, Category

    # Contar contas ativas
    total_accounts = db.query(func.count(Account.id)).filter(
        Account.user_id == current_user.id,
        Account.is_active == True
    ).scalar() or 0

    # Saldo total de todas as contas
    total_balance = db.query(func.sum(Account.balance)).filter(
        Account.user_id == current_user.id,
        Account.is_active == True
    ).scalar() or 0.0

    # Contar categorias
    total_categories = db.query(func.count(Category.id)).filter(
        Category.user_id == current_user.id
    ).scalar() or 0

    # Filtros de transação
    transaction_filters = [Transaction.user_id == current_user.id]
    if start_date:
        transaction_filters.append(Transaction.date >= start_date)
    if end_date:
        transaction_filters.append(Transaction.date <= end_date)

    # Contar transações
    total_transactions = db.query(func.count(Transaction.id)).filter(
        and_(*transaction_filters)
    ).scalar() or 0

    # Calcular receitas e despesas
    income_result = db.query(func.sum(Transaction.amount)).filter(
        and_(*transaction_filters),
        Transaction.transaction_type == 'income'
    ).scalar() or 0.0

    expense_result = db.query(func.sum(func.abs(Transaction.amount))).filter(
        and_(*transaction_filters),
        Transaction.transaction_type == 'expense'
    ).scalar() or 0.0

    return {
        "total_accounts": total_accounts,
        "total_categories": total_categories,
        "total_transactions": total_transactions,
        "total_balance": float(total_balance),
        "total_income": float(income_result),
        "total_expense": float(expense_result),
        "net_balance": float(income_result) - float(expense_result)
    }

    return {
        "total_accounts": total_accounts,
        "total_categories": total_categories,
        "total_transactions": total_transactions,
        "total_balance": float(total_balance),
        "total_income": float(income_result),
        "total_expense": float(expense_result),
        "net_balance": float(income_result) - float(expense_result)
    }


@app.get('/dashboard/summary')
async def dashboard_summary(
    start_date: date = None,
    end_date: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth.get_current_user)
):
    """
    Dashboard otimizado - retorna TUDO em uma única requisição.

    Retorna estatísticas + últimas 10 transações.
    Reduz de 3 requisições para 1 única requisição.
    """
    from sqlalchemy import func
    from .models import Account, Transaction, Category
    from . import schemas

    # Queries agregadas otimizadas (executadas em paralelo pelo DB)
    total_accounts = db.query(func.count(Account.id)).filter(
        Account.user_id == current_user.id,
        Account.is_active == True
    ).scalar() or 0

    total_balance = db.query(func.sum(Account.balance)).filter(
        Account.user_id == current_user.id,
        Account.is_active == True
    ).scalar() or 0.0

    total_categories = db.query(func.count(Category.id)).filter(
        Category.user_id == current_user.id
    ).scalar() or 0

    # Filtros de transação
    transaction_filters = [Transaction.user_id == current_user.id]
    if start_date:
        transaction_filters.append(Transaction.date >= start_date)
    if end_date:
        transaction_filters.append(Transaction.date <= end_date)

    total_transactions = db.query(func.count(Transaction.id)).filter(
        and_(*transaction_filters)
    ).scalar() or 0

    income_result = db.query(func.sum(Transaction.amount)).filter(
        and_(*transaction_filters),
        Transaction.transaction_type == 'income'
    ).scalar() or 0.0

    expense_result = db.query(func.sum(func.abs(Transaction.amount))).filter(
        and_(*transaction_filters),
        Transaction.transaction_type == 'expense'
    ).scalar() or 0.0

    # Buscar últimas 10 transações com joins otimizados
    from sqlalchemy.orm import joinedload
    recent_transactions = db.query(Transaction).options(
        joinedload(Transaction.category),
        joinedload(Transaction.account),
        joinedload(Transaction.user)
    ).filter(
        and_(*transaction_filters)
    ).order_by(Transaction.date.desc()).limit(10).all()

    # Serializar transações (Pydantic v2 com from_attributes=True)
    transactions_data = [
        schemas.Transaction.model_validate(t) for t in recent_transactions
    ]

    return {
        "stats": {
            "total_accounts": total_accounts,
            "total_categories": total_categories,
            "total_transactions": total_transactions,
            "total_balance": float(total_balance),
            "total_income": float(income_result),
            "total_expense": float(expense_result),
            "net_balance": float(income_result) - float(expense_result)
        },
        "recent_transactions": transactions_data
    }
