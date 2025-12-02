from sqlalchemy.orm import Session
from . import models, schemas
from .utils import hash_password

# ========================
# USER OPERATIONS
# ========================


def get_user(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str):
    """Get user by username"""
    return db.query(models.User).filter(models.User.username == username).first()


def get_all_users(db: Session, skip: int = 0, limit: int = 100):
    """Get all users with pagination"""
    return db.query(models.User).offset(skip).limit(limit).all()


def create_user(db: Session, user: schemas.UserCreate):
    """Create a new user"""
    hashed_password = hash_password(user.password)
    db_user = models.User(
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: int, user: schemas.UserCreate):
    """Update user"""
    db_user = get_user(db, user_id)
    if db_user:
        if user.username:
            db_user.username = user.username
        if user.password:
            db_user.hashed_password = hash_password(user.password)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: int):
    """Delete user by ID"""
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
    return db_user


def update_user_profile(db: Session, user_id: int, user: schemas.UserUpdate):
    """Update user profile"""
    db_user = get_user(db, user_id)
    if db_user:
        if user.email is not None:
            db_user.email = user.email
        if user.full_name is not None:
            db_user.full_name = user.full_name
        if user.avatar is not None:
            db_user.avatar = user.avatar
        if user.cpf is not None:
            db_user.cpf = user.cpf
        if user.phone is not None:
            db_user.phone = user.phone
        if user.birth_date is not None:
            db_user.birth_date = user.birth_date
        if user.address is not None:
            db_user.address = user.address
        db.commit()
        db.refresh(db_user)
    return db_user


# ========================
# ACCOUNT OPERATIONS
# ========================

def get_account(db: Session, account_id: int):
    """Get account by ID"""
    return db.query(models.Account).filter(models.Account.id == account_id).first()


def get_all_accounts(db: Session, skip: int = 0, limit: int = 100):
    """Get all accounts"""
    return db.query(models.Account).offset(skip).limit(limit).all()


def get_user_accounts(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get all accounts for a specific user"""
    return db.query(models.Account).filter(
        models.Account.user_id == user_id
    ).offset(skip).limit(limit).all()


def create_account(db: Session, account: schemas.AccountCreate, user_id: int):
    """Create a new account"""
    db_account = models.Account(
        name=account.name,
        account_type=account.account_type,
        balance=account.balance,
        currency=account.currency,
        user_id=user_id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


def get_account_suggestions(db: Session, user_id: int, limit: int = 10):
    """Get account name suggestions from other users (most popular)"""
    from sqlalchemy import func

    # Buscar nomes de contas de outros usuários, agrupadas por nome, ordenadas por frequência
    suggestions = db.query(
        models.Account.name,
        func.count(models.Account.name).label('count')
    ).filter(
        models.Account.user_id != user_id  # Excluir contas do próprio usuário
    ).group_by(
        models.Account.name
    ).order_by(
        func.count(models.Account.name).desc()  # Mais populares primeiro
    ).limit(limit).all()

    # Retornar apenas os nomes
    return [suggestion.name for suggestion in suggestions]


def update_account(db: Session, account_id: int, account: schemas.AccountCreate):
    """Update account"""
    db_account = get_account(db, account_id)
    if db_account:
        db_account.name = account.name
        db_account.account_type = account.account_type
        db_account.balance = account.balance
        db_account.currency = account.currency
        db.commit()
        db.refresh(db_account)
    return db_account


def delete_account(db: Session, account_id: int):
    """Delete account by ID"""
    db_account = get_account(db, account_id)
    if db_account:
        db.delete(db_account)
        db.commit()
        return True
    return False


# ========================
# CATEGORY OPERATIONS
# ========================

def get_category(db: Session, category_id: int):
    """Get category by ID"""
    return db.query(models.Category).filter(models.Category.id == category_id).first()


def get_category_by_name(db: Session, name: str):
    """Get category by name (global - use apenas para compatibilidade)"""
    return db.query(models.Category).filter(models.Category.name == name).first()


def get_category_by_name_and_user(db: Session, name: str, user_id: int):
    """Get category by name for a specific user"""
    return db.query(models.Category).filter(
        models.Category.name == name,
        models.Category.user_id == user_id
    ).first()


def get_all_categories(db: Session, skip: int = 0, limit: int = 100):
    """Get all categories"""
    return db.query(models.Category).offset(skip).limit(limit).all()


def get_user_categories(db: Session, user_id: int, skip: int = 0,
                        limit: int = 100):
    """Get all categories for a specific user"""
    return db.query(models.Category).filter(
        models.Category.user_id == user_id
    ).offset(skip).limit(limit).all()


def create_category(db: Session, category: schemas.CategoryCreate, user_id: int):
    """Create a new category"""
    db_category = models.Category(
        name=category.name,
        icon=category.icon,
        user_id=user_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


def get_category_suggestions(db: Session, user_id: int, limit: int = 10):
    """Get category name suggestions from other users (most popular)"""
    from sqlalchemy import func

    # Buscar categorias de outros usuários, agrupadas por nome, ordenadas por frequência
    suggestions = db.query(
        models.Category.name,
        func.count(models.Category.name).label('count')
    ).filter(
        models.Category.user_id != user_id  # Excluir categorias do próprio usuário
    ).group_by(
        models.Category.name
    ).order_by(
        func.count(models.Category.name).desc()  # Mais populares primeiro
    ).limit(limit).all()

    # Retornar apenas os nomes
    return [suggestion.name for suggestion in suggestions]


def update_category(db: Session, category_id: int,
                    category: schemas.CategoryCreate):
    """Update category"""
    db_category = get_category(db, category_id)
    if db_category:
        db_category.name = category.name
        if category.icon:
            db_category.icon = category.icon
        db.commit()
        db.refresh(db_category)
    return db_category


def delete_category(db: Session, category_id: int):
    """Delete category by ID"""
    db_category = get_category(db, category_id)
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category


# ========================
# TRANSACTION OPERATIONS
# ========================

def get_transaction(db: Session, transaction_id: int):
    """Get transaction by ID"""
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()


def get_user_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get all transactions for a user"""
    return db.query(models.Transaction).filter(
        models.Transaction.user_id == user_id
    ).offset(skip).limit(limit).all()


def get_all_transactions(db: Session, skip: int = 0, limit: int = 100):
    """Get all transactions"""
    return db.query(models.Transaction).offset(skip).limit(limit).all()


def create_transaction(db: Session, transaction: schemas.TransactionCreate, user_id: int):
    """Create a new transaction"""
    db_transaction = models.Transaction(
        amount=transaction.amount,
        date=transaction.date,
        description=transaction.description,
        category_id=transaction.category_id,
        account_id=transaction.account_id,
        transaction_type=transaction.transaction_type,
        user_id=user_id
    )
    db.add(db_transaction)
    
    # Atualizar saldo da conta se account_id foi fornecido
    if transaction.account_id:
        account = get_account(db, transaction.account_id)
        if account:
            account.balance += transaction.amount
    
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def update_transaction(db: Session, transaction_id: int, transaction: schemas.TransactionCreate):
    """Update transaction"""
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        old_account_id = db_transaction.account_id
        old_amount = db_transaction.amount
        
        # Reverter saldo da conta antiga se houver
        if old_account_id:
            old_account = get_account(db, old_account_id)
            if old_account:
                old_account.balance -= old_amount
        
        # Atualizar campos da transação
        db_transaction.amount = transaction.amount
        db_transaction.date = transaction.date
        db_transaction.description = transaction.description
        db_transaction.category_id = transaction.category_id
        db_transaction.account_id = transaction.account_id
        db_transaction.transaction_type = transaction.transaction_type
        
        # Adicionar valor na nova conta se houver
        if transaction.account_id:
            new_account = get_account(db, transaction.account_id)
            if new_account:
                new_account.balance += transaction.amount
        
        db.commit()
        db.refresh(db_transaction)
    return db_transaction


def delete_transaction(db: Session, transaction_id: int):
    """Delete transaction by ID"""
    db_transaction = get_transaction(db, transaction_id)
    if db_transaction:
        # Reverter saldo da conta se houver
        if db_transaction.account_id:
            account = get_account(db, db_transaction.account_id)
            if account:
                account.balance -= db_transaction.amount
        
        db.delete(db_transaction)
        db.commit()
    return db_transaction
