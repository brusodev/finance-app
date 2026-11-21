from datetime import date, datetime

from sqlalchemy.orm import Session
from . import billing, models, schemas
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
        hashed_password=hashed_password,
        email=user.email,
        full_name=user.full_name
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
        if user.currency is not None:
            db_user.currency = user.currency
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


def get_user_accounts(db: Session, user_id: int, skip: int = 0, limit: int = 100, include_inactive: bool = False):
    """Get all accounts for a specific user"""
    query = db.query(models.Account).filter(models.Account.user_id == user_id)

    if not include_inactive:
        query = query.filter(models.Account.is_active == True)

    return query.offset(skip).limit(limit).all()


def create_account(db: Session, account: schemas.AccountCreate, user_id: int):
    """Create a new account"""
    db_account = models.Account(
        name=account.name,
        account_type=account.account_type,
        initial_balance=account.initial_balance,
        balance=account.initial_balance,  # Começa com o saldo inicial
        currency=account.currency,
        user_id=user_id
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


COMMON_ACCOUNT_NAMES = [
    "Nubank", "Itaú", "Bradesco", "Banco do Brasil", "Santander",
    "Caixa Econômica", "Inter", "C6 Bank", "PicPay", "Carteira",
    "Poupança", "XP Investimentos", "Mercado Pago",
]


def get_account_suggestions(db: Session, user_id: int, limit: int = 10):
    """Sugestões de nomes de conta a partir de uma lista curada (não usa dados de outros usuários)."""
    existing = {
        name for (name,) in db.query(models.Account.name).filter(
            models.Account.user_id == user_id
        ).all()
    }
    suggestions = [n for n in COMMON_ACCOUNT_NAMES if n not in existing]
    return suggestions[:limit]


def update_account(db: Session, account_id: int, account: schemas.AccountUpdate):
    """Update account (não altera initial_balance nem balance diretamente)"""
    db_account = get_account(db, account_id)
    if db_account:
        if account.name is not None:
            db_account.name = account.name
        if account.account_type is not None:
            db_account.account_type = account.account_type
        if account.is_active is not None:
            db_account.is_active = account.is_active
        db.commit()
        db.refresh(db_account)
    return db_account


def delete_account(db: Session, account_id: int, soft_delete: bool = True):
    """Delete account by ID (soft delete por padrão)"""
    db_account = get_account(db, account_id)
    if db_account:
        if soft_delete:
            # Soft delete: apenas marca como inativa
            db_account.is_active = False
            db.commit()
        else:
            # Hard delete: remove permanentemente
            db.delete(db_account)
            db.commit()
        return True
    return False


def calculate_account_balance(db: Session, account_id: int):
    """
    Calcula o saldo real baseado em initial_balance + transações
    Retorna tupla: (calculated_balance, total_transactions)
    """
    account = get_account(db, account_id)
    if not account:
        return None, 0

    # Somar todas as transações da conta
    from sqlalchemy import func
    result = db.query(
        func.sum(models.Transaction.amount),
        func.count(models.Transaction.id)
    ).filter(
        models.Transaction.account_id == account_id
    ).first()

    total_amount = result[0] if result[0] is not None else 0.0
    total_transactions = result[1] if result[1] is not None else 0

    calculated_balance = account.initial_balance + total_amount
    return calculated_balance, total_transactions


def audit_account_balance(db: Session, account_id: int):
    """
    Audita o saldo da conta comparando balance vs calculated_balance
    Retorna dict com informações detalhadas
    """
    account = get_account(db, account_id)
    if not account:
        return None

    calculated_balance, total_transactions = calculate_account_balance(
        db, account_id
    )

    difference = account.balance - calculated_balance
    is_consistent = abs(difference) < 0.01  # Tolerância de 1 centavo

    return {
        "account_id": account.id,
        "account_name": account.name,
        "initial_balance": account.initial_balance,
        "current_balance": account.balance,
        "calculated_balance": calculated_balance,
        "total_transactions": total_transactions,
        "is_consistent": is_consistent,
        "difference": difference
    }


def recalculate_account_balance(db: Session, account_id: int):
    """
    Recalcula e corrige o saldo da conta baseado nas transações
    Útil para corrigir inconsistências
    """
    calculated_balance, _ = calculate_account_balance(db, account_id)
    if calculated_balance is None:
        return None

    account = get_account(db, account_id)
    if account:
        old_balance = account.balance
        account.balance = calculated_balance
        db.commit()
        db.refresh(account)

        return {
            "account_id": account.id,
            "balance_before": old_balance,
            "balance_after": calculated_balance,
            "corrected": old_balance != calculated_balance
        }
    return None


def audit_all_user_accounts(db: Session, user_id: int):
    """
    Audita todas as contas de um usuário
    Retorna lista com status de cada conta
    """
    accounts = get_user_accounts(db, user_id, include_inactive=True)
    audits = []

    for account in accounts:
        audit = audit_account_balance(db, account.id)
        if audit:
            audits.append(audit)

    return audits


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
        expense_kind=category.expense_kind,
        user_id=user_id
    )
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


COMMON_CATEGORY_NAMES = [
    "Alimentação", "Transporte", "Saúde", "Educação", "Lazer",
    "Moradia", "Vestuário", "Beleza", "Pets", "Tecnologia",
    "Esportes", "Viagem", "Mercado", "Contas", "Investimentos",
    "Presentes", "Doação", "Salário", "Freelance",
]


def get_category_suggestions(db: Session, user_id: int, limit: int = 10):
    """Sugestões de nomes de categoria a partir de uma lista curada (não usa dados de outros usuários)."""
    existing = {
        name for (name,) in db.query(models.Category.name).filter(
            models.Category.user_id == user_id
        ).all()
    }
    suggestions = [n for n in COMMON_CATEGORY_NAMES if n not in existing]
    return suggestions[:limit]


def update_category(db: Session, category_id: int,
                    category: schemas.CategoryCreate):
    """Update category"""
    db_category = get_category(db, category_id)
    if db_category:
        db_category.name = category.name
        if category.icon:
            db_category.icon = category.icon
        db_category.expense_kind = category.expense_kind
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
    """Get all transactions for a user ordered by date (newest first)"""
    from sqlalchemy.orm import joinedload
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.category),
        joinedload(models.Transaction.account)
    ).filter(
        models.Transaction.user_id == user_id
    ).order_by(models.Transaction.date.desc()).offset(skip).limit(limit).all()


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

        # Desvincular ImportItems que referenciam esta transação (evita FK violation)
        db.query(models.ImportItem).filter(
            models.ImportItem.transaction_id == transaction_id
        ).update({"transaction_id": None}, synchronize_session=False)

        db.delete(db_transaction)
        db.commit()
    return db_transaction


def get_transaction_description_suggestions(
    db: Session,
    user_id: int,
    transaction_type: str = None,
    category_id: int = None,
    limit: int = 10
):
    """
    Get transaction description suggestions - prioritiza do usuário atual, depois outros usuários

    Args:
        user_id: ID do usuário atual
        transaction_type: Filtro opcional por tipo ('income' ou 'expense')
        category_id: Filtro opcional por categoria
        limit: Número máximo de sugestões (padrão: 10)

    Returns:
        Lista de descrições mais populares
    """
    from sqlalchemy import func

    # Query base: buscar descrições não vazias
    query = db.query(
        models.Transaction.description,
        func.count(models.Transaction.description).label('count')
    ).filter(
        models.Transaction.description.isnot(None),  # Não nulas
        models.Transaction.description != ''  # Não vazias
    )

    # Filtro opcional por tipo de transação
    if transaction_type:
        query = query.filter(
            models.Transaction.transaction_type == transaction_type)

    # Filtro opcional por categoria
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)

    # Agrupar, ordenar por popularidade e limitar
    suggestions = query.group_by(
        models.Transaction.description
    ).order_by(
        func.count(models.Transaction.description).desc()
    ).limit(limit).all()

    # Retornar apenas as descrições
    return [suggestion.description for suggestion in suggestions]


# ========================
# TRANSFER OPERATIONS
# ========================


def create_transfer(db: Session, transfer: schemas.TransferCreate, user_id: int, commit: bool = True):
    """
    Create a transfer between two accounts.
    Creates two linked transactions: one debit from source account and one credit to destination account.
    """
    import uuid

    # Validar que as contas existem e pertencem ao usuário
    from_account = get_account(db, transfer.from_account_id)
    to_account = get_account(db, transfer.to_account_id)

    if not from_account or from_account.user_id != user_id:
        raise ValueError("Conta de origem não encontrada ou não pertence ao usuário")

    if not to_account or to_account.user_id != user_id:
        raise ValueError("Conta de destino não encontrada ou não pertence ao usuário")

    if transfer.from_account_id == transfer.to_account_id:
        raise ValueError("Não é possível transferir para a mesma conta")

    if transfer.amount <= 0:
        raise ValueError("O valor da transferência deve ser positivo")

    # Gerar ID único para vincular as duas transações
    transfer_id = str(uuid.uuid4())

    # Obter ou criar categoria de transferência
    category_id = transfer.category_id
    if not category_id:
        # Buscar ou criar categoria padrão de transferência
        transfer_category = db.query(models.Category).filter(
            models.Category.user_id == user_id,
            models.Category.name == "Transferência"
        ).first()

        if not transfer_category:
            transfer_category = models.Category(
                name="Transferência",
                icon="swap_horiz",
                user_id=user_id
            )
            db.add(transfer_category)
            db.flush()

        category_id = transfer_category.id

    # Criar transação de saída (débito da conta origem)
    from_transaction = models.Transaction(
        amount=-abs(transfer.amount),  # Valor negativo para saída
        date=transfer.date,
        description=transfer.description or f"Transferência para {to_account.name}",
        transaction_type="transfer",
        category_id=category_id,
        account_id=transfer.from_account_id,
        transfer_id=transfer_id,
        transfer_account_id=transfer.to_account_id,
        user_id=user_id
    )
    db.add(from_transaction)

    # Criar transação de entrada (crédito na conta destino)
    to_transaction = models.Transaction(
        amount=abs(transfer.amount),  # Valor positivo para entrada
        date=transfer.date,
        description=transfer.description or f"Transferência de {from_account.name}",
        transaction_type="transfer",
        category_id=category_id,
        account_id=transfer.to_account_id,
        transfer_id=transfer_id,
        transfer_account_id=transfer.from_account_id,
        user_id=user_id
    )
    db.add(to_transaction)

    # Atualizar saldos das contas
    from_account.balance -= abs(transfer.amount)
    to_account.balance += abs(transfer.amount)

    if commit:
        db.commit()
    else:
        db.flush()

    db.refresh(from_transaction)
    db.refresh(to_transaction)

    return {
        "transfer_id": transfer_id,
        "from_transaction": from_transaction,
        "to_transaction": to_transaction,
        "amount": transfer.amount,
        "date": transfer.date,
        "description": transfer.description or "Transferência entre contas"
    }


def get_transfer_transactions(db: Session, transfer_id: str, user_id: int):
    """
    Get both transactions from a transfer by transfer_id
    """
    transactions = db.query(models.Transaction).filter(
        models.Transaction.transfer_id == transfer_id,
        models.Transaction.user_id == user_id
    ).all()

    return transactions


def _card_days(db: Session, account_id: int):
    """(closing_day, due_day) do cartão, ou None sem configuração."""
    cfg = get_credit_card_config(db, account_id)
    if not cfg:
        return None
    return cfg.closing_day, cfg.due_day


def get_statement(db: Session, statement_id: int, user_id: int):
    return db.query(models.CreditCardStatement).filter(
        models.CreditCardStatement.id == statement_id,
        models.CreditCardStatement.user_id == user_id,
    ).first()


def get_statement_for_month(db: Session, account_id: int, user_id: int, due_month):
    return db.query(models.CreditCardStatement).filter(
        models.CreditCardStatement.account_id == account_id,
        models.CreditCardStatement.user_id == user_id,
        models.CreditCardStatement.reference_month == billing.month_start(due_month),
    ).first()


def get_credit_card_statement_by_batch(db: Session, batch_id: int, user_id: int):
    """Fatura do mês a que o lote pertence."""
    batch = get_import_batch(db, batch_id, user_id)
    if batch and batch.statement_id:
        return get_statement(db, batch.statement_id, user_id)
    return db.query(models.CreditCardStatement).filter(
        models.CreditCardStatement.batch_id == batch_id,
        models.CreditCardStatement.user_id == user_id,
    ).first()


def _sync_credit_card_statement_status(statement):
    outstanding = max(statement.total_amount - statement.paid_amount, 0.0)
    if statement.total_amount <= 0 or outstanding <= 0:
        statement.status = models.CreditCardStatementStatusEnum.PAID
    elif statement.paid_amount <= 0:
        statement.status = models.CreditCardStatementStatusEnum.OPEN
    else:
        statement.status = models.CreditCardStatementStatusEnum.PARTIAL


def statement_display_status(statement, today=None) -> str:
    """Status para exibição: inclui 'overdue' (vencida e não quitada)."""
    status = statement.status.value if hasattr(statement.status, 'value') else statement.status
    today = today or date.today()
    if status in ('open', 'partial') and statement.due_date and statement.due_date < today:
        return 'overdue'
    return status


def _apply_statement_cycle(db: Session, statement):
    days = _card_days(db, statement.account_id)
    if not days:
        return
    cycle = billing.statement_cycle(days[0], days[1], statement.reference_month)
    statement.period_start = cycle['period_start']
    statement.closing_date = cycle['closing_date']
    statement.due_date = cycle['due_date']


def recalculate_statement_total(db: Session, statement):
    """Total = soma dos itens não ignorados de todos os lotes confirmados."""
    db.flush()
    batches = db.query(models.ImportBatch).filter(
        models.ImportBatch.statement_id == statement.id,
        models.ImportBatch.status == models.ImportBatchStatusEnum.CONFIRMED,
    ).all()
    statement.total_amount = sum(
        abs(item.amount)
        for b in batches
        for item in b.items
        if item.status != models.ImportItemStatusEnum.IGNORED
    )
    _sync_credit_card_statement_status(statement)


def attach_batch_to_statement(db: Session, batch, user_id: int):
    """
    Liga um lote confirmado à fatura do seu mês de vencimento (criando-a
    se preciso) e recalcula o total. Não faz commit.
    """
    due_month = billing.month_start(batch.reference_month)
    statement = get_statement_for_month(db, batch.account_id, user_id, due_month)
    if not statement:
        statement = models.CreditCardStatement(
            batch_id=batch.id,
            account_id=batch.account_id,
            user_id=user_id,
            reference_month=due_month,
            total_amount=0.0,
            paid_amount=0.0,
            status=models.CreditCardStatementStatusEnum.OPEN,
        )
        db.add(statement)
        db.flush()
    batch.statement_id = statement.id
    _apply_statement_cycle(db, statement)
    recalculate_statement_total(db, statement)
    return statement


def register_statement_payment(
    db: Session,
    statement_id: int,
    payment: schemas.CreditCardStatementPaymentCreate,
    user_id: int,
):
    statement = get_statement(db, statement_id, user_id)
    if not statement:
        raise ValueError("Fatura não encontrada")

    if payment.amount <= 0:
        raise ValueError("O valor do pagamento deve ser positivo")

    outstanding = max(statement.total_amount - statement.paid_amount, 0.0)
    if payment.amount > outstanding + 0.005:
        raise ValueError("O pagamento não pode ser maior que o saldo em aberto")

    from_account = get_account(db, payment.from_account_id)
    if not from_account or from_account.user_id != user_id:
        raise ValueError("Conta de origem não encontrada ou não pertence ao usuário")
    if from_account.id == statement.account_id:
        raise ValueError("A conta de origem não pode ser o próprio cartão")

    payment_description = payment.description or (
        f"Pagamento da fatura {statement.reference_month.strftime('%m/%Y')}"
    )
    transfer_payload = schemas.TransferCreate(
        from_account_id=payment.from_account_id,
        to_account_id=statement.account_id,
        amount=payment.amount,
        date=payment.date,
        description=payment_description,
    )
    transfer_result = create_transfer(db, transfer_payload, user_id, commit=False)

    db.add(models.CreditCardStatementPayment(
        statement_id=statement.id,
        from_account_id=payment.from_account_id,
        transfer_id=transfer_result["transfer_id"],
        date=payment.date,
        amount=payment.amount,
        description=payment_description,
        user_id=user_id,
    ))

    statement.paid_amount += payment.amount
    _sync_credit_card_statement_status(statement)

    db.commit()
    db.refresh(statement)
    return statement


def register_credit_card_statement_payment(
    db: Session,
    batch_id: int,
    payment: schemas.CreditCardStatementPaymentCreate,
    user_id: int,
):
    """Compatibilidade: paga a fatura do mês a que o lote pertence."""
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status != models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("A fatura precisa estar confirmada antes de receber pagamentos")

    statement = get_credit_card_statement_by_batch(db, batch_id, user_id)
    if not statement:
        statement = attach_batch_to_statement(db, batch, user_id)
        db.commit()
    return register_statement_payment(db, statement.id, payment, user_id)


def delete_transfer(db: Session, transfer_id: str, user_id: int):
    """
    Delete a transfer by removing both linked transactions
    """
    transactions = get_transfer_transactions(db, transfer_id, user_id)

    if not transactions:
        raise ValueError("Transferência não encontrada")

    # Reverter saldos das contas
    for transaction in transactions:
        if transaction.account_id:
            account = get_account(db, transaction.account_id)
            if account:
                account.balance -= transaction.amount

    # Deletar transações
    for transaction in transactions:
        db.delete(transaction)

    db.commit()
    return True


# ========================
# INVESTMENT OPERATIONS
# ========================

# --- Investment Assets ---

def create_investment_asset(db: Session, asset: schemas.InvestmentAssetCreate, user_id: int):
    """Create a new investment asset"""
    db_asset = models.InvestmentAsset(
        name=asset.name,
        type=asset.type,
        broker=asset.broker,
        currency=asset.currency,
        user_id=user_id
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset


def get_investment_assets(db: Session, user_id: int):
    """Get all investment assets for a user"""
    return db.query(models.InvestmentAsset).filter(
        models.InvestmentAsset.user_id == user_id
    ).order_by(models.InvestmentAsset.created_at.desc()).all()


def get_investment_asset(db: Session, asset_id: int, user_id: int):
    """Get a specific investment asset"""
    return db.query(models.InvestmentAsset).filter(
        models.InvestmentAsset.id == asset_id,
        models.InvestmentAsset.user_id == user_id
    ).first()


def update_investment_asset(db: Session, asset_id: int, asset: schemas.InvestmentAssetUpdate, user_id: int):
    """Update an investment asset"""
    db_asset = get_investment_asset(db, asset_id, user_id)
    if not db_asset:
        return None

    if asset.name is not None:
        db_asset.name = asset.name
    if asset.type is not None:
        db_asset.type = asset.type
    if asset.broker is not None:
        db_asset.broker = asset.broker
    if asset.currency is not None:
        db_asset.currency = asset.currency

    db.commit()
    db.refresh(db_asset)
    return db_asset


def delete_investment_asset(db: Session, asset_id: int, user_id: int):
    """Delete an investment asset and all its transactions"""
    db_asset = get_investment_asset(db, asset_id, user_id)
    if not db_asset:
        return False

    db.delete(db_asset)
    db.commit()
    return True


# --- Investment Transactions ---

def _get_or_create_investment_category(db: Session, user_id: int) -> int:
    category = get_category_by_name_and_user(db, "Investimentos", user_id)
    if not category:
        category = models.Category(
            name="Investimentos", icon="📈", user_id=user_id,
            expense_kind="investment",
        )
        db.add(category)
        db.flush()
    elif not category.expense_kind:
        category.expense_kind = "investment"
    return category.id


def get_flow_totals(db: Session, user_id: int, filters: list) -> dict:
    """
    Receitas/despesas do período, separando movimentos de investimento
    (categorias com expense_kind='investment') dos totais operacionais.
    """
    from sqlalchemy import func, case, or_

    investment_ids = db.query(models.Category.id).filter(
        models.Category.user_id == user_id,
        models.Category.expense_kind == "investment",
    )
    is_investment = models.Transaction.category_id.in_(investment_ids)
    not_investment = or_(
        models.Transaction.category_id.is_(None),
        models.Transaction.category_id.notin_(investment_ids),
    )
    amount = func.abs(models.Transaction.amount)
    tx_type = models.Transaction.transaction_type

    def total(kind, investment):
        return func.sum(case(
            (
                (tx_type == kind) & (is_investment if investment else not_investment),
                amount,
            ),
            else_=0,
        ))

    row = db.query(
        total("income", False),
        total("expense", False),
        total("expense", True),
        total("income", True),
    ).filter(models.Transaction.user_id == user_id, *filters).one()

    income, expense, invested, redeemed = (float(v or 0) for v in row)
    return {
        "total_income": income,
        "total_expense": expense,
        "total_invested": invested,
        "total_redeemed": redeemed,
    }


def create_investment_transaction(db: Session, transaction: schemas.InvestmentTransactionCreate, user_id: int):
    asset = get_investment_asset(db, transaction.asset_id, user_id)
    if not asset:
        raise ValueError("Ativo não encontrado ou não pertence ao usuário")

    account_transaction_id = None
    if transaction.account_id and transaction.type in ("APORTE", "RESGATE"):
        account = get_account(db, transaction.account_id)
        if not account or account.user_id != user_id:
            raise ValueError("Conta bancária não encontrada ou não pertence ao usuário")

        # APORTE: sai da conta (negativo). RESGATE: entra na conta (positivo).
        tx_amount = -abs(transaction.amount_brl) if transaction.type == "APORTE" else abs(transaction.amount_brl)
        description = f"{'Aporte' if transaction.type == 'APORTE' else 'Resgate'} — {asset.name}"
        investment_category_id = _get_or_create_investment_category(db, user_id)
        acc_tx = models.Transaction(
            description=description,
            amount=tx_amount,
            date=transaction.date,
            transaction_type="expense" if transaction.type == "APORTE" else "income",
            account_id=transaction.account_id,
            category_id=investment_category_id,
            user_id=user_id,
        )
        db.add(acc_tx)
        db.flush()
        account.balance += tx_amount
        account_transaction_id = acc_tx.id

    db_transaction = models.InvestmentTransaction(
        asset_id=transaction.asset_id,
        date=transaction.date,
        type=transaction.type,
        amount_brl=transaction.amount_brl,
        quantity=transaction.quantity,
        unit_price=transaction.unit_price,
        notes=transaction.notes,
        user_id=user_id,
        account_id=transaction.account_id if transaction.account_id and transaction.type in ("APORTE", "RESGATE") else None,
        account_transaction_id=account_transaction_id,
    )
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def get_investment_transactions(db: Session, user_id: int, asset_id: int = None,
                                 from_date: str = None, to_date: str = None,
                                 transaction_type: str = None):
    """Get investment transactions with filters"""
    query = db.query(models.InvestmentTransaction).filter(
        models.InvestmentTransaction.user_id == user_id
    )

    if asset_id:
        query = query.filter(models.InvestmentTransaction.asset_id == asset_id)
    if from_date:
        query = query.filter(models.InvestmentTransaction.date >= from_date)
    if to_date:
        query = query.filter(models.InvestmentTransaction.date <= to_date)
    if transaction_type:
        query = query.filter(models.InvestmentTransaction.type == transaction_type)

    return query.order_by(models.InvestmentTransaction.date.desc()).all()


def get_investment_transaction(db: Session, transaction_id: int, user_id: int):
    """Get a specific investment transaction"""
    return db.query(models.InvestmentTransaction).filter(
        models.InvestmentTransaction.id == transaction_id,
        models.InvestmentTransaction.user_id == user_id
    ).first()


def update_investment_transaction(db: Session, transaction_id: int,
                                   transaction: schemas.InvestmentTransactionUpdate, user_id: int):
    """Update an investment transaction"""
    db_transaction = get_investment_transaction(db, transaction_id, user_id)
    if not db_transaction:
        return None

    if transaction.date is not None:
        db_transaction.date = transaction.date
    if transaction.type is not None:
        db_transaction.type = transaction.type
    if transaction.amount_brl is not None:
        db_transaction.amount_brl = transaction.amount_brl
    if transaction.quantity is not None:
        db_transaction.quantity = transaction.quantity
    if transaction.unit_price is not None:
        db_transaction.unit_price = transaction.unit_price
    if transaction.notes is not None:
        db_transaction.notes = transaction.notes

    db.commit()
    db.refresh(db_transaction)
    return db_transaction


def delete_investment_transaction(db: Session, transaction_id: int, user_id: int):
    db_transaction = get_investment_transaction(db, transaction_id, user_id)
    if not db_transaction:
        return False

    if db_transaction.account_transaction_id:
        acc_tx = db.query(models.Transaction).filter(
            models.Transaction.id == db_transaction.account_transaction_id,
            models.Transaction.user_id == user_id,
        ).first()
        if acc_tx:
            account = get_account(db, acc_tx.account_id)
            if account:
                account.balance -= acc_tx.amount
            db.delete(acc_tx)

    db.delete(db_transaction)
    db.commit()
    return True


# --- Goal Plans ---

def create_goal_plan(db: Session, goal: schemas.GoalPlanCreate, user_id: int):
    """Create a new goal plan with steps"""
    # Delete existing goal plan if any (only one goal per user)
    existing = db.query(models.GoalPlan).filter(
        models.GoalPlan.user_id == user_id
    ).first()
    if existing:
        db.delete(existing)
        db.flush()

    db_goal = models.GoalPlan(
        goal_name=goal.goal_name,
        target_value_brl=goal.target_value_brl,
        start_date=goal.start_date,
        months=goal.months,
        default_monthly_rate=goal.default_monthly_rate,
        plan_mode=goal.plan_mode,
        user_id=user_id
    )
    db.add(db_goal)
    db.flush()

    # Add steps
    if goal.steps:
        for step in goal.steps:
            db_step = models.GoalPlanStep(
                goal_plan_id=db_goal.id,
                start_month=step.start_month,
                end_month=step.end_month,
                monthly_contribution_brl=step.monthly_contribution_brl
            )
            db.add(db_step)
    elif goal.plan_mode == "ESCADA":
        # Create default ladder steps (1k/2k/3k)
        default_steps = [
            {"start_month": 1, "end_month": 36, "monthly_contribution_brl": 1000.0},
            {"start_month": 37, "end_month": 72, "monthly_contribution_brl": 2000.0},
            {"start_month": 73, "end_month": 120, "monthly_contribution_brl": 3000.0},
        ]
        for step_data in default_steps:
            db_step = models.GoalPlanStep(
                goal_plan_id=db_goal.id,
                start_month=step_data["start_month"],
                end_month=step_data["end_month"],
                monthly_contribution_brl=step_data["monthly_contribution_brl"]
            )
            db.add(db_step)

    db.commit()
    db.refresh(db_goal)
    return db_goal


def get_goal_plan(db: Session, user_id: int):
    """Get the user's goal plan"""
    return db.query(models.GoalPlan).filter(
        models.GoalPlan.user_id == user_id
    ).first()


def update_goal_plan(db: Session, goal_id: int, goal: schemas.GoalPlanUpdate, user_id: int):
    """Update a goal plan"""
    db_goal = db.query(models.GoalPlan).filter(
        models.GoalPlan.id == goal_id,
        models.GoalPlan.user_id == user_id
    ).first()

    if not db_goal:
        return None

    if goal.goal_name is not None:
        db_goal.goal_name = goal.goal_name
    if goal.target_value_brl is not None:
        db_goal.target_value_brl = goal.target_value_brl
    if goal.months is not None:
        db_goal.months = goal.months
    if goal.default_monthly_rate is not None:
        db_goal.default_monthly_rate = goal.default_monthly_rate
    if goal.plan_mode is not None:
        db_goal.plan_mode = goal.plan_mode

    # Update steps if provided
    if goal.steps is not None:
        # Delete existing steps
        db.query(models.GoalPlanStep).filter(
            models.GoalPlanStep.goal_plan_id == goal_id
        ).delete()

        # Add new steps
        for step in goal.steps:
            db_step = models.GoalPlanStep(
                goal_plan_id=goal_id,
                start_month=step.start_month,
                end_month=step.end_month,
                monthly_contribution_brl=step.monthly_contribution_brl
            )
            db.add(db_step)

    db.commit()
    db.refresh(db_goal)
    return db_goal


def delete_goal_plan(db: Session, goal_id: int, user_id: int):
    """Delete a goal plan"""
    db_goal = db.query(models.GoalPlan).filter(
        models.GoalPlan.id == goal_id,
        models.GoalPlan.user_id == user_id
    ).first()

    if not db_goal:
        return False

    db.delete(db_goal)
    db.commit()
    return True


# --- Investment Summary ---

def get_investment_summary(db: Session, user_id: int):
    """Get investment portfolio summary"""
    from sqlalchemy import func
    from datetime import datetime, timedelta

    # Calculate total invested (aportes - resgates - taxas)
    transactions = get_investment_transactions(db, user_id)

    total_invested = 0.0
    for t in transactions:
        if t.type == "APORTE":
            total_invested += t.amount_brl
        elif t.type in ["RESGATE", "TAXA"]:
            total_invested += t.amount_brl  # Already negative

    # Calculate contributions this month
    now = datetime.now()
    month_start = now.replace(day=1)
    month_transactions = [t for t in transactions if t.date >= month_start.date()]

    total_contributions_month = sum(
        t.amount_brl for t in month_transactions if t.type == "APORTE"
    )

    # Group by asset
    assets = get_investment_assets(db, user_id)
    by_asset = []

    for asset in assets:
        asset_transactions = [t for t in transactions if t.asset_id == asset.id]
        asset_total = sum(
            t.amount_brl for t in asset_transactions
            if t.type in ["APORTE", "RESGATE", "TAXA"]
        )

        by_asset.append({
            "asset_id": asset.id,
            "asset_name": asset.name,
            "asset_type": asset.type,
            "total_invested": asset_total,
            "transaction_count": len(asset_transactions)
        })

    # Last 12 months contributions
    twelve_months_ago = now - timedelta(days=365)
    last_12_months = []

    for i in range(12):
        month_date = now - timedelta(days=30 * i)
        month_start = month_date.replace(day=1)
        if i == 0:
            month_end = now
        else:
            month_end = month_start.replace(day=28) + timedelta(days=4)
            month_end = month_end.replace(day=1) - timedelta(days=1)

        month_transactions = [
            t for t in transactions
            if month_start.date() <= t.date <= month_end.date() and t.type == "APORTE"
        ]

        month_total = sum(t.amount_brl for t in month_transactions)

        last_12_months.append({
            "month": month_start.strftime("%Y-%m"),
            "total": month_total
        })

    last_12_months.reverse()

    return {
        "total_invested": total_invested,
        "total_contributions_month": total_contributions_month,
        "by_asset": by_asset,
        "last_12_months": last_12_months
    }


# ============================================================
# CREDIT CARD OPERATIONS
# ============================================================

def get_credit_card_config(db: Session, account_id: int):
    """Retorna a config de cartão vinculada a uma conta."""
    return db.query(models.CreditCardConfig).filter(
        models.CreditCardConfig.account_id == account_id
    ).first()


def create_credit_card_config(
    db: Session,
    config: schemas.CreditCardConfigCreate,
    user_id: int
):
    """Cria ou substitui a config de cartão de uma conta."""
    # Garante que a conta pertence ao usuário
    account = get_account(db, config.account_id)
    if not account or account.user_id != user_id:
        raise ValueError(
            "Conta não encontrada ou não pertence ao usuário"
        )
    if account.account_type != 'credit_card':
        raise ValueError(
            "A conta deve ser do tipo 'credit_card'"
        )

    existing = get_credit_card_config(db, config.account_id)
    if existing:
        db.delete(existing)
        db.flush()

    db_config = models.CreditCardConfig(
        account_id=config.account_id,
        closing_day=config.closing_day,
        due_day=config.due_day,
        bank_name=config.bank_name,
        credit_limit=config.credit_limit,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


def update_credit_card_config(
    db: Session,
    account_id: int,
    config: schemas.CreditCardConfigUpdate,
    user_id: int
):
    """Atualiza a config de cartão de uma conta."""
    account = get_account(db, account_id)
    if not account or account.user_id != user_id:
        raise ValueError(
            "Conta não encontrada ou não pertence ao usuário"
        )

    db_config = get_credit_card_config(db, account_id)
    if not db_config:
        raise ValueError("Configuração de cartão não encontrada")

    if config.closing_day is not None:
        db_config.closing_day = config.closing_day
    if config.due_day is not None:
        db_config.due_day = config.due_day
    if config.bank_name is not None:
        db_config.bank_name = config.bank_name
    if config.credit_limit is not None:
        db_config.credit_limit = config.credit_limit

    # Fechamento/vencimento mudaram: recalcula as datas das faturas.
    db.flush()
    for statement in db.query(models.CreditCardStatement).filter(
        models.CreditCardStatement.account_id == account_id,
    ).all():
        _apply_statement_cycle(db, statement)

    db.commit()
    db.refresh(db_config)
    return db_config


# ---- Import Batch ----

def _normalize_import_item_signature(item: dict):
    """Gera uma assinatura estável para comparar itens importados."""
    raw_description = (item.get('raw_description') or item.get('description') or '').strip()
    raw_amount = float(item.get('raw_amount') or item.get('amount') or 0.0)
    raw_date = item.get('raw_date') or item.get('date')
    if isinstance(raw_date, str):
        raw_date = date.fromisoformat(raw_date)
    installment_current = item.get('installment_current')
    installment_total = item.get('installment_total')
    return (
        raw_description.lower(),
        round(raw_amount, 2),
        raw_date.isoformat() if raw_date else None,
        installment_current,
        installment_total,
    )


def _normalize_import_items_list(items_data):
    """Normaliza a lista de itens para comparação sem depender da ordem."""
    return sorted(
        (_normalize_import_item_signature(item) for item in items_data or []),
        key=lambda item: (
            item[0],
            str(item[1]),
            str(item[2] or ''),
            str(item[3] or ''),
            str(item[4] or ''),
        )
    )


def find_duplicate_import_batch(
    db: Session,
    account_id: int,
    user_id: int,
    reference_month,
    items_data: list,
):
    """Retorna um lote equivalente já existente para a mesma conta/mês/conteúdo."""
    from datetime import date as date_type

    ref = reference_month
    if isinstance(ref, date_type):
        ref = ref.replace(day=1)

    if not items_data:
        return None

    normalized_items = _normalize_import_items_list(items_data)
    if not normalized_items:
        return None

    batches = (
        db.query(models.ImportBatch)
        .filter(
            models.ImportBatch.user_id == user_id,
            models.ImportBatch.account_id == account_id,
            models.ImportBatch.reference_month == ref,
            models.ImportBatch.status != models.ImportBatchStatusEnum.CANCELLED,
        )
        .all()
    )

    for batch in batches:
        existing_items = _normalize_import_items_list([
            {
                'raw_description': item.raw_description or item.description,
                'raw_amount': item.raw_amount,
                'raw_date': item.raw_date,
                'installment_current': item.installment_current,
                'installment_total': item.installment_total,
            }
            for item in batch.items
        ])
        if len(existing_items) == len(normalized_items) and existing_items == normalized_items:
            return batch
    return None


def create_import_batch(
    db: Session,
    account_id: int,
    reference_month,
    file_name: str = None,
    file_type: str = None,
    user_id: int = None,
    period_start=None,
    period_end=None,
    statement_balance=None,
    statement_balance_date=None,
):
    """Cria um novo lote de importação (staging)."""
    from datetime import date as date_type
    # Normaliza para o primeiro dia do mês
    ref = reference_month
    if isinstance(ref, date_type):
        ref = ref.replace(day=1)

    batch = models.ImportBatch(
        account_id=account_id,
        user_id=user_id,
        reference_month=ref,
        file_name=file_name,
        file_type=file_type,
        period_start=period_start,
        period_end=period_end,
        statement_balance=statement_balance,
        statement_balance_date=statement_balance_date,
        status=models.ImportBatchStatusEnum.PENDING,
        updated_at=datetime.utcnow(),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


def get_import_batch(db: Session, batch_id: int, user_id: int):
    return db.query(models.ImportBatch).filter(
        models.ImportBatch.id == batch_id,
        models.ImportBatch.user_id == user_id
    ).first()


def list_import_batches(
    db: Session,
    user_id: int,
    account_id: int = None
):
    """Lista lotes de importação do usuário, do mais recente para o mais antigo."""
    query = db.query(models.ImportBatch).filter(
        models.ImportBatch.user_id == user_id
    )
    if account_id:
        query = query.filter(
            models.ImportBatch.account_id == account_id
        )
    return query.order_by(
        models.ImportBatch.updated_at.desc(),
        models.ImportBatch.created_at.desc(),
        models.ImportBatch.id.desc()
    ).all()


def cancel_import_batch(db: Session, batch_id: int, user_id: int):
    """Cancela um lote pendente/revisado."""
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já confirmado não pode ser cancelado")

    batch.status = models.ImportBatchStatusEnum.CANCELLED
    batch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(batch)
    return batch


# ---- Import Items ----

def add_import_items(
    db: Session,
    batch_id: int,
    items_data: list,
    user_id: int
):
    """
    Insere uma lista de dicts com dados brutos no lote.

    Cada dict deve ter: raw_description, raw_amount, raw_date
    e opcionalmente: installment_current, installment_total.
    """
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")

    created = []
    for data in items_data:
        item = models.ImportItem(
            batch_id=batch_id,
            user_id=user_id,
            raw_description=data.get('raw_description'),
            raw_amount=data['raw_amount'],
            raw_date=data['raw_date'],
            description=data.get('raw_description'),
            amount=data['raw_amount'],
            date=data['raw_date'],
            transaction_type=(
                'income' if data['raw_amount'] > 0 else 'expense'
            ),
            installment_current=data.get('installment_current'),
            installment_total=data.get('installment_total'),
            external_id=data.get('external_id'),
            status=models.ImportItemStatusEnum.PENDING,
        )
        db.add(item)
        created.append(item)

    db.flush()
    flag_duplicate_items(db, batch, created)
    batch.updated_at = datetime.utcnow()
    db.commit()
    for item in created:
        db.refresh(item)
    return created


def add_manual_import_item(
    db: Session,
    batch_id: int,
    item: schemas.ImportItemCreate,
    user_id: int
):
    """Adiciona um item manualmente a um lote."""
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já confirmado")

    db_item = models.ImportItem(
        batch_id=batch_id,
        user_id=user_id,
        raw_description=item.description,
        raw_amount=item.amount,
        raw_date=item.date,
        description=item.description,
        amount=item.amount,
        date=item.date,
        category_id=item.category_id,
        transaction_type=(
            item.transaction_type
            or ('income' if item.amount > 0 else 'expense')
        ),
        installment_current=item.installment_current,
        installment_total=item.installment_total,
        status=models.ImportItemStatusEnum.PENDING,
    )
    db.add(db_item)
    batch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_item)
    return db_item


def update_import_item(
    db: Session,
    item_id: int,
    data: schemas.ImportItemUpdate,
    user_id: int
):
    """Edita descrição, valor, data, categoria ou status de um item."""
    item = db.query(models.ImportItem).filter(
        models.ImportItem.id == item_id,
        models.ImportItem.user_id == user_id
    ).first()
    if not item:
        raise ValueError("Item não encontrado")
    if item.batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já confirmado, item não pode ser editado")

    if data.description is not None:
        item.description = data.description
    if data.amount is not None:
        item.amount = data.amount
    if data.date is not None:
        from datetime import date as date_type
        item.date = date_type.fromisoformat(data.date) if isinstance(data.date, str) else data.date
    if data.category_id is not None:
        item.category_id = data.category_id
    if data.transaction_type is not None:
        if data.transaction_type not in ('income', 'expense'):
            raise ValueError(
                "transaction_type inválido: use 'income' ou 'expense'"
            )
        item.transaction_type = data.transaction_type
    if data.installment_current is not None:
        item.installment_current = data.installment_current
    if data.installment_total is not None:
        item.installment_total = data.installment_total
    if data.status is not None:
        status_map = {
            'pending': models.ImportItemStatusEnum.PENDING,
            'ignored': models.ImportItemStatusEnum.IGNORED,
        }
        if data.status not in status_map:
            raise ValueError("Status inválido: use 'pending' ou 'ignored'")
        item.status = status_map[data.status]

    # Marca o lote como revisado
    if item.batch.status == models.ImportBatchStatusEnum.PENDING:
        item.batch.status = models.ImportBatchStatusEnum.REVIEWED

    item.batch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)
    return item


def _normalize_description(text: str) -> str:
    """Normaliza descrição para agrupar o mesmo merchant: lower, strip,
    remove sufixo de parcela (ex: '3/10') e espaços repetidos."""
    import re
    from .parsers import _INSTALLMENT_RE

    if not text:
        return ""
    s = _INSTALLMENT_RE.sub('', text)
    s = re.sub(r'\s+', ' ', s).strip().lower()
    return s


def get_merchant_alias_map(db: Session, user_id: int) -> dict:
    """
    Mapa raw_key -> {category_id, transaction_type, friendly_name}
    aprendido do histórico de confirmações do usuário. Usado como
    cache na classificação (acerta sem chamar a IA).
    """
    aliases = (
        db.query(models.MerchantAlias)
        .filter(models.MerchantAlias.user_id == user_id)
        .all()
    )
    return {
        a.raw_key: {
            "category_id": a.category_id,
            "transaction_type": a.transaction_type,
            "friendly_name": a.friendly_name,
        }
        for a in aliases
    }


def upsert_merchant_alias(
    db: Session,
    user_id: int,
    raw_description: str,
    friendly_name: str,
    category_id,
    transaction_type,
):
    """
    Registra/atualiza a associação aprendida para um merchant.
    Chamado na confirmação do lote. Não faz commit (o chamador commita).
    """
    raw_key = _normalize_description(raw_description or friendly_name or "")
    if not raw_key:
        return

    alias = (
        db.query(models.MerchantAlias)
        .filter(
            models.MerchantAlias.user_id == user_id,
            models.MerchantAlias.raw_key == raw_key,
        )
        .first()
    )
    if alias is None:
        alias = models.MerchantAlias(
            user_id=user_id,
            raw_key=raw_key,
            raw_description=raw_description,
            friendly_name=friendly_name,
            category_id=category_id,
            transaction_type=transaction_type,
            hits=1,
        )
        db.add(alias)
    else:
        alias.hits += 1
        alias.raw_description = raw_description or alias.raw_description
        if friendly_name:
            alias.friendly_name = friendly_name
        if category_id is not None:
            alias.category_id = category_id
        if transaction_type in ('income', 'expense'):
            alias.transaction_type = transaction_type


_MEMO_PREFIX_RE = None
_TOKEN_STOPWORDS = {
    'ltda', 'eireli', 'comercio', 'servicos', 'agencia', 'conta', 'bco',
    'banco', 'pagamento', 'brasil', 'unibanco', 'parcela', 'shop', 'loja',
    'lojas', 'com', 'para', 'dos', 'das', 'the',
}


def _strip_accents(text: str) -> str:
    import unicodedata
    return ''.join(
        ch for ch in unicodedata.normalize('NFKD', text)
        if not unicodedata.combining(ch)
    )


def _merchant_tokens(text: str) -> set:
    """
    Extrai os tokens que identificam o estabelecimento/contato de um memo
    bruto, ignorando o meio de pagamento ('Transferência enviada pelo
    Pix -', 'Compra no débito -'), documentos, banco, agência e conta.

    Ex.: 'Transferência enviada pelo Pix - Agua (RAUL ESTEVES - •••.595 -
    BCO DO BRASIL ... Conta: 24228-4)' -> {'agua', 'raul', 'esteves'}.
    """
    global _MEMO_PREFIX_RE
    import re
    if _MEMO_PREFIX_RE is None:
        _MEMO_PREFIX_RE = re.compile(
            r'^(estorno\s*-\s*)?'
            r'(compra no debito( via nupay)?'
            r'|transferencia (enviada|recebida)( pelo pix)?'
            r'|pagamento de boleto efetuado|pix (enviado|recebido)'
            r')\s*-\s*'
        )
    s = _strip_accents(_normalize_description(text))
    s = _MEMO_PREFIX_RE.sub('', s)
    # Corta CPF/CNPJ mascarado, banco, agência e conta
    s = re.split(r'\s-\s(?=[•*\d.]{4,}|.*ag[eê]ncia)', s)[0]
    s = re.split(r'ag[eê]ncia:|conta:', s)[0]
    tokens = set(re.findall(r'[a-z][a-z0-9]{2,}', s))
    return tokens - _TOKEN_STOPWORDS


def _alias_example(alias, category_name):
    raw = (alias.raw_description or alias.raw_key or '').strip()
    return {
        "raw_description": raw[:140],
        "description": (alias.friendly_name or raw).strip(),
        "category_name": category_name,
        "transaction_type": alias.transaction_type,
        "hits": alias.hits,
    }


def get_alias_examples(db: Session, user_id: int, limit: int = 15):
    """
    Exemplos gerais (pares bruto -> nome amigável/categoria) a partir da
    memória de confirmações, priorizando os mais usados e a diversidade
    de categorias. Cai para o histórico de transações se a memória
    estiver vazia.
    """
    rows = (
        db.query(models.MerchantAlias, models.Category.name)
        .join(
            models.Category,
            models.MerchantAlias.category_id == models.Category.id,
        )
        .filter(models.MerchantAlias.user_id == user_id)
        .order_by(models.MerchantAlias.hits.desc())
        .all()
    )
    if not rows:
        return get_classification_examples(db, user_id, limit=limit)

    seen, diverse, leftover = set(), [], []
    for alias, cat_name in rows:
        target = leftover if alias.category_id in seen else diverse
        seen.add(alias.category_id)
        target.append(_alias_example(alias, cat_name))
    return (diverse + leftover)[:limit]


def find_similar_aliases(
    db: Session,
    user_id: int,
    raw_descriptions: list,
    per_item: int = 4,
):
    """
    Recuperação (o 'R' do RAG): para cada memo bruto, devolve os
    lançamentos já confirmados do mesmo estabelecimento/contato, por
    sobreposição de tokens do merchant. Lista paralela a
    raw_descriptions.
    """
    rows = (
        db.query(models.MerchantAlias, models.Category.name)
        .outerjoin(
            models.Category,
            models.MerchantAlias.category_id == models.Category.id,
        )
        .filter(models.MerchantAlias.user_id == user_id)
        .all()
    )
    indexed = [
        (_merchant_tokens(a.raw_description or a.raw_key), a, name)
        for a, name in rows
    ]
    indexed = [x for x in indexed if x[0]]

    out = []
    for raw in raw_descriptions:
        query = _merchant_tokens(raw or '')
        scored = []
        if query:
            for tokens, alias, name in indexed:
                shared = query & tokens
                if not shared:
                    continue
                score = len(shared) / len(query | tokens)
                scored.append((score, alias.hits, alias, name))
        scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
        out.append([
            _alias_example(alias, name)
            for score, _, alias, name in scored[:per_item]
            if score >= 0.2
        ])
    return out


def get_classification_examples(
    db: Session,
    user_id: int,
    limit: int = 30
):
    """
    Constrói exemplos few-shot do histórico do usuário para a IA:
    pares descrição -> categoria/tipo mais frequentes, priorizando
    diversidade de categorias.

    Retorna lista de dicts: {description, category_name, transaction_type}.
    """
    rows = (
        db.query(models.Transaction)
        .join(
            models.Category,
            models.Transaction.category_id == models.Category.id,
        )
        .filter(
            models.Transaction.user_id == user_id,
            models.Transaction.category_id.isnot(None),
        )
        .order_by(models.Transaction.date.desc())
        .limit(2000)
        .all()
    )

    # Agrupa por descrição normalizada; guarda contagem e dados
    groups: dict = {}
    for t in rows:
        key = _normalize_description(t.description or "")
        if not key:
            continue
        g = groups.get(key)
        if g is None:
            groups[key] = {
                "description": (t.description or "").strip(),
                "raw_description": (t.description or "").strip(),
                "category_id": t.category_id,
                "category_name": t.category.name if t.category else None,
                "transaction_type": t.transaction_type,
                "count": 1,
            }
        else:
            g["count"] += 1

    # Ordena por frequência e prioriza diversidade de categorias
    ordered = sorted(
        groups.values(), key=lambda g: g["count"], reverse=True
    )
    seen_categories: set = set()
    diverse = []
    leftover = []
    for g in ordered:
        if g["category_id"] not in seen_categories:
            seen_categories.add(g["category_id"])
            diverse.append(g)
        else:
            leftover.append(g)

    selected = (diverse + leftover)[:limit]
    return [
        {
            "description": g["description"],
            "raw_description": g["raw_description"],
            "category_name": g["category_name"],
            "transaction_type": g["transaction_type"],
        }
        for g in selected
    ]


def classify_import_batch(
    db: Session,
    batch_id: int,
    user_id: int,
    on_progress=None,
):
    """
    Classifica via IA os itens PENDING de um lote: pré-preenche
    category_id e transaction_type. O usuário revisa depois.

    Retorna {classified, unmatched, ai_skipped, items}.
    Levanta MissingGroqKey se a key não estiver configurada.

    on_progress(processed, total) é repassado ao classificador para
    reportar andamento ao job em background.
    """
    from .ai_classifier import classify_items

    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já confirmado não pode ser reclassificado")

    pending = [
        item for item in batch.items
        if item.status == models.ImportItemStatusEnum.PENDING
    ]

    # 1) Cache: aplica o que já foi aprendido (sem chamar a IA)
    alias_map = get_merchant_alias_map(db, user_id)
    classified = 0
    classified_by_cache = 0
    remaining = []
    valid_category_ids = {
        c.id for c in get_user_categories(db, user_id, limit=1000)
    }
    for item in pending:
        raw = item.raw_description or item.description or ""
        hit = alias_map.get(_normalize_description(raw))
        if hit and hit.get("category_id") in valid_category_ids:
            item.category_id = hit["category_id"]
            if hit.get("transaction_type") in ('income', 'expense'):
                item.transaction_type = hit["transaction_type"]
            if hit.get("friendly_name"):
                item.description = hit["friendly_name"]
            classified += 1
            classified_by_cache += 1
        else:
            remaining.append(item)

    # 2) IA: classifica apenas os que o cache não resolveu
    items_payload = [
        {
            "id": item.id,
            "raw_description": item.raw_description or item.description or "",
            "description": item.description or item.raw_description or "",
            "amount": item.amount,
        }
        for item in remaining
    ]

    categories = [
        {"id": c.id, "name": c.name}
        for c in get_user_categories(db, user_id, limit=1000)
    ]
    examples = get_alias_examples(db, user_id)
    similar = find_similar_aliases(
        db, user_id, [i["raw_description"] for i in items_payload]
    )
    for payload_item, sims in zip(items_payload, similar):
        payload_item["similar"] = sims

    result_map = (
        classify_items(items_payload, categories, examples, on_progress)
        if items_payload else {}
    )

    ai_skipped = bool(items_payload) and not result_map
    for item in remaining:
        r = result_map.get(item.id)
        if not r:
            continue
        if r.get("category_id") is not None:
            item.category_id = r["category_id"]
            classified += 1
        if r.get("transaction_type") in ('income', 'expense'):
            item.transaction_type = r["transaction_type"]
        if r.get("description"):
            item.description = r["description"]

    if batch.status == models.ImportBatchStatusEnum.PENDING and classified:
        batch.status = models.ImportBatchStatusEnum.REVIEWED

    db.commit()
    db.refresh(batch)

    unmatched = len(pending) - classified
    return {
        "classified": classified,
        "classified_by_cache": classified_by_cache,
        "unmatched": unmatched,
        "ai_skipped": ai_skipped,
        "items": batch.items,
    }


def confirm_import_batch(
    db: Session,
    batch_id: int,
    user_id: int
):
    """
    Converte todos os itens PENDING/REVIEWED em transactions oficiais.
    Itens com status IGNORED são pulados.
    """
    from datetime import datetime as dt

    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já foi confirmado")
    if batch.status == models.ImportBatchStatusEnum.CANCELLED:
        raise ValueError("Lote cancelado não pode ser confirmado")

    account = get_account(db, batch.account_id)
    if not account:
        raise ValueError("Conta não encontrada")

    is_credit_card = account.account_type == 'credit_card'

    confirmed_count = 0
    ignored_count = 0
    transaction_ids = []

    for item in batch.items:
        if item.status == models.ImportItemStatusEnum.IGNORED:
            ignored_count += 1
            continue

        # Monta a descrição com parcela se houver
        description = item.description or item.raw_description or ""
        if item.installment_current and item.installment_total:
            description = (
                f"{description} "
                f"{item.installment_current}/{item.installment_total}"
            ).strip()

        if is_credit_card:
            # Cartão: tudo é despesa negativa (comportamento original)
            tx_type = 'expense'
            amount = -abs(item.amount)
        else:
            # Conta comum: tipo por item (default pelo sinal) e sinal
            # coerente com o tipo.
            tx_type = item.transaction_type
            if tx_type not in ('income', 'expense'):
                tx_type = 'income' if item.amount > 0 else 'expense'
            amount = abs(item.amount) if tx_type == 'income' \
                else -abs(item.amount)

        transaction = models.Transaction(
            amount=amount,
            date=item.date,
            description=description,
            raw_description=item.raw_description,
            external_id=item.external_id,
            transaction_type=tx_type,
            category_id=item.category_id,
            account_id=batch.account_id,
            user_id=user_id,
            installment_current=item.installment_current,
            installment_total=item.installment_total,
        )
        db.add(transaction)
        db.flush()  # Gera o ID antes de atribuir

        # Atualiza saldo da conta
        account.balance += transaction.amount

        # Aprende a associação merchant -> categoria/tipo/nome amigável
        if item.raw_description and item.category_id:
            upsert_merchant_alias(
                db,
                user_id=user_id,
                raw_description=item.raw_description,
                friendly_name=item.description,
                category_id=item.category_id,
                transaction_type=tx_type,
            )

        item.status = models.ImportItemStatusEnum.CONFIRMED
        item.transaction_id = transaction.id
        transaction_ids.append(transaction.id)
        confirmed_count += 1

    batch.status = models.ImportBatchStatusEnum.CONFIRMED
    batch.confirmed_at = dt.utcnow()
    batch.updated_at = dt.utcnow()

    # Fatura (statement) só faz sentido para cartão de crédito
    if is_credit_card:
        attach_batch_to_statement(db, batch, user_id)

    db.commit()

    return {
        "batch_id": batch_id,
        "confirmed_count": confirmed_count,
        "ignored_count": ignored_count,
        "transactions_created": transaction_ids,
    }


# ========================
# PARCELAMENTOS (cross-fatura)
# ========================

import re as _re  # noqa: E402

# Sufixo de parcela: " - Parcela 3/10", " 3/10", "(3/10)" etc.
_INSTALLMENT_SUFFIX_RE = _re.compile(
    r'\s*[-(]?\s*(?:parcela\s*)?\d{1,3}\s*[/\\]\s*\d{1,3}\)?\s*$',
    _re.IGNORECASE,
)


def _strip_installment_suffix(description: str) -> str:
    """Remove sufixos de parcela, inclusive repetidos ('X - Parcela 1/3 1/3')."""
    text = (description or '').strip()
    while True:
        stripped = _INSTALLMENT_SUFFIX_RE.sub('', text).strip()
        if stripped == text:
            return text
        text = stripped


def _installment_base_key(description: str) -> str:
    """Descrição sem o sufixo de parcela, normalizada para agrupar."""
    return _strip_installment_suffix(description).lower()


def _installment_groups(db: Session, user_id: int, account_id: int):
    """
    Agrupa as parcelas já lançadas de um cartão por compra.

    Uma compra é (descrição-base, total de parcelas, mês da 1ª parcela).
    O mês de cada parcela vem da fatura (lote) em que ela foi importada,
    e não da data do lançamento: bancos datam parcelas pela compra
    original ou pelo fechamento, e os centavos variam entre parcelas.
    Lançamentos manuais sem lote usam o ciclo do cartão pela data.
    """
    rows = (
        db.query(models.Transaction, models.ImportBatch.reference_month)
        .outerjoin(models.ImportItem, models.ImportItem.transaction_id == models.Transaction.id)
        .outerjoin(models.ImportBatch, models.ImportBatch.id == models.ImportItem.batch_id)
        .filter(
            models.Transaction.user_id == user_id,
            models.Transaction.account_id == account_id,
            models.Transaction.installment_total.isnot(None),
            models.Transaction.installment_current.isnot(None),
        )
        .order_by(models.Transaction.date.asc(), models.Transaction.id.asc())
        .all()
    )
    days = _card_days(db, account_id)

    groups: dict = {}
    for t, batch_month in rows:
        cur, total = t.installment_current, t.installment_total
        if not total or not cur or cur > total:
            continue
        if batch_month:
            month = billing.month_start(batch_month)
        elif days:
            month = billing.due_month_for_purchase(t.date, *days)
        else:
            month = billing.month_start(t.date)
        first_month = billing.add_months(month, -(cur - 1))
        base = _strip_installment_suffix(t.description)
        match_key = _installment_base_key(t.raw_description or t.description)
        key = (match_key, total, first_month)
        g = groups.setdefault(key, {
            'match_key': match_key,
            'description': base,
            'total': total,
            'first_month': first_month,
            'by_number': {},
            'first_date': t.date,
            'category_id': t.category_id,
        })
        g['by_number'].setdefault(cur, []).append(abs(t.amount))
        g['first_date'] = min(g['first_date'], t.date)

    result = []
    for g in groups.values():
        latest = max(g['by_number'])
        per = round(sum(g['by_number'][latest]), 2)
        total = g['total']
        remaining = max(total - latest, 0)
        result.append({
            'match_key': g['match_key'],
            'description': g['description'],
            'current': latest,
            'total': total,
            'remaining': remaining,
            'per_installment': per,
            'remaining_amount': round(remaining * per, 2),
            'paid_installments': len(g['by_number']),
            'first_month': g['first_month'],
            'latest_month': billing.add_months(g['first_month'], latest - 1),
            'end_month': billing.add_months(g['first_month'], total - 1),
            'purchase_date': g['first_date'],
            'latest_date': g['first_date'],
            'category_id': g['category_id'],
        })
    return result


def get_active_installments(db: Session, user_id: int, account_id: int):
    """Parcelamentos de um cartão que ainda têm parcelas por vir."""
    result = [g for g in _installment_groups(db, user_id, account_id) if g['remaining'] > 0]
    result.sort(key=lambda x: x['remaining_amount'], reverse=True)
    return result


def get_installment_schedule(
    db: Session, user_id: int, account_id: int, months_ahead: int = 12,
    from_month=None,
):
    """
    Projeção das próximas parcelas por mês de vencimento. Só calcula —
    nada é lançado. Começa no mês seguinte à última parcela importada de
    cada compra (ou em `from_month`, se informado, para recortar).
    """
    by_month: dict = {}
    for g in get_active_installments(db, user_id, account_id):
        for n in range(g['current'] + 1, g['total'] + 1):
            month = billing.add_months(g['first_month'], n - 1)
            by_month.setdefault(month, []).append({
                'description': g['description'],
                'number': n,
                'total': g['total'],
                'amount': g['per_installment'],
                'end_month': g['end_month'],
                'category_id': g['category_id'],
            })
    start = billing.month_start(from_month) if from_month else (
        min(by_month) if by_month else billing.month_start(date.today())
    )
    limit = billing.add_months(start, months_ahead)
    out = []
    for month in sorted(by_month):
        if month < start or month >= limit:
            continue
        items = sorted(by_month[month], key=lambda i: -i['amount'])
        out.append({
            'due_month': month,
            'items': items,
            'total': round(sum(i['amount'] for i in items), 2),
        })
    return out


def check_batch_against_projection(db: Session, batch):
    """
    Confere as parcelas de um lote de cartão ainda não confirmado com a
    projeção do mês da fatura.

    - missing: parcelas que a projeção esperava neste mês e não vieram
      no arquivo (nem em outro lote já confirmado do mesmo mês);
    - unexpected: parcelas (n > 1) do arquivo que nenhuma compra
      conhecida explicava — compra antiga não importada ou mês errado.
    """
    month = billing.month_start(batch.reference_month)
    expected, already_here = {}, set()
    for g in _installment_groups(db, batch.user_id, batch.account_id):
        n = (month.year - g['first_month'].year) * 12 + month.month - g['first_month'].month + 1
        if not (1 < n <= g['total']):
            continue
        key = (g['match_key'], g['total'], n)
        if g['latest_month'] >= month:
            already_here.add(key)
        else:
            expected[key] = {
                'description': g['description'],
                'number': n,
                'total': g['total'],
                'amount': g['per_installment'],
            }

    items = [
        i for i in batch.items
        if i.installment_total and i.installment_current
        and i.status == models.ImportItemStatusEnum.PENDING
    ]
    found = {}
    for i in items:
        found[(_installment_base_key(i.raw_description or i.description),
               i.installment_total, i.installment_current)] = i

    missing = [v for k, v in expected.items() if k not in found]
    unexpected = [
        {
            'item_id': i.id,
            'description': i.description or i.raw_description,
            'number': i.installment_current,
            'total': i.installment_total,
            'amount': abs(i.amount),
        }
        for k, i in found.items()
        if i.installment_current > 1 and k not in expected and k not in already_here
    ]
    return {'missing': missing, 'unexpected': unexpected}


# ------------------------------------------------------------------ #
#  Duplicidade e cobertura de período na importação                   #
# ------------------------------------------------------------------ #

DUPLICATE_DATE_WINDOW_DAYS = 2


def _fmt_brl(value: float) -> str:
    s = f"{abs(value):,.2f}".replace(",", "X").replace(".", ",")
    return "R$ " + s.replace("X", ".")


def _dup_candidates(db: Session, batch, date_from, date_to):
    """
    Lançamentos já existentes na conta que um item novo pode repetir:
    transações gravadas e itens ainda não confirmados de outros lotes.
    """
    from datetime import timedelta

    lo = date_from - timedelta(days=DUPLICATE_DATE_WINDOW_DAYS)
    hi = date_to + timedelta(days=DUPLICATE_DATE_WINDOW_DAYS)

    txs = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id == batch.account_id,
            models.Transaction.user_id == batch.user_id,
            models.Transaction.date >= lo,
            models.Transaction.date <= hi,
        )
        .all()
    )
    origin = {}
    if txs:
        for it in (
            db.query(models.ImportItem)
            .filter(models.ImportItem.transaction_id.in_([t.id for t in txs]))
            .all()
        ):
            origin[it.transaction_id] = it.batch_id

    cands = []
    for t in txs:
        where = (
            f"lote #{origin[t.id]}" if t.id in origin else "lançamento manual"
        )
        cands.append({
            "date": t.date,
            "cents": round(abs(t.amount or 0) * 100),
            "raw": _normalize_description(t.raw_description or ""),
            "tokens": _merchant_tokens(t.raw_description or t.description or ""),
            "external_id": t.external_id,
            "label": (
                f"{t.date.strftime('%d/%m')} · {t.description or '—'} · "
                f"{_fmt_brl(t.amount or 0)} ({where})"
            ),
        })

    pending = (
        db.query(models.ImportItem)
        .join(models.ImportBatch)
        .filter(
            models.ImportBatch.account_id == batch.account_id,
            models.ImportBatch.user_id == batch.user_id,
            models.ImportBatch.id != batch.id,
            models.ImportBatch.status.in_([
                models.ImportBatchStatusEnum.PENDING,
                models.ImportBatchStatusEnum.REVIEWED,
            ]),
            models.ImportItem.status == models.ImportItemStatusEnum.PENDING,
            models.ImportItem.date >= lo,
            models.ImportItem.date <= hi,
        )
        .all()
    )
    for it in pending:
        cands.append({
            "date": it.date,
            "cents": round(abs(it.amount or 0) * 100),
            "raw": _normalize_description(it.raw_description or ""),
            "tokens": _merchant_tokens(it.raw_description or it.description or ""),
            "external_id": it.external_id,
            "label": (
                f"{it.date.strftime('%d/%m')} · {it.description or '—'} · "
                f"{_fmt_brl(it.amount or 0)} (lote #{it.batch_id}, "
                "ainda não confirmado)"
            ),
        })
    return cands


def _dup_match_level(item, cand, raw, tokens):
    """'certain', 'possible' ou None para um par item novo x existente."""
    if item.external_id and cand["external_id"]:
        # Com id do banco dos dois lados a resposta é exata
        return "certain" if item.external_id == cand["external_id"] else None
    if round(abs(item.amount) * 100) != cand["cents"]:
        return None
    gap = abs((item.date - cand["date"]).days)
    if gap > DUPLICATE_DATE_WINDOW_DAYS:
        return None
    if raw and cand["raw"] == raw:
        # Mesmo memo e valor: no mesmo dia é certeza; dias vizinhos podem
        # ser gastos recorrentes (ex.: passagem diária), então só avisa.
        return "certain" if gap == 0 else "possible"
    if tokens and cand["tokens"]:
        overlap = len(tokens & cand["tokens"]) / len(tokens | cand["tokens"])
        if overlap >= 0.5:
            return "possible"
    if gap == 0:
        # Mesmo valor no mesmo dia com texto diferente: o banco às vezes
        # muda o memo entre exportações ('Débito em conta' x 'Débito
        # automático - CLARO'), e lançamentos manuais não têm memo.
        return "possible"
    return None


def flag_duplicate_items(db: Session, batch, items):
    """
    Marca itens recém-importados que repetem lançamentos já existentes
    na conta. Certeza -> status IGNORED; possível -> fica pendente com
    aviso. Cada lançamento existente casa com no máximo um item novo,
    para que compras repetidas de verdade (2 cafés iguais) não sumam.
    Não faz commit.
    """
    items = [i for i in items if i.date is not None and i.amount is not None]
    if not items:
        return {"certain": 0, "possible": 0}

    cands = _dup_candidates(
        db, batch, min(i.date for i in items), max(i.date for i in items)
    )
    used = set()
    keys = {
        i.id: (
            _normalize_description(i.raw_description or ""),
            _merchant_tokens(i.raw_description or ""),
        )
        for i in items
    }
    counts = {"certain": 0, "possible": 0}

    for level in ("certain", "possible"):
        for item in items:
            if item.duplicate_status:
                continue
            raw, tokens = keys[item.id]
            best = None
            for idx, cand in enumerate(cands):
                if idx in used:
                    continue
                if _dup_match_level(item, cand, raw, tokens) != level:
                    continue
                gap = abs((item.date - cand["date"]).days)
                if best is None or gap < best[0]:
                    best = (gap, idx)
            if best is None:
                continue
            used.add(best[1])
            cand = cands[best[1]]
            item.duplicate_status = level
            if level == "certain":
                item.status = models.ImportItemStatusEnum.IGNORED
                item.duplicate_note = f"Já importado: {cand['label']}"
            else:
                item.duplicate_note = f"Parece repetir: {cand['label']}"
            counts[level] += 1
    return counts


def get_import_coverage(db: Session, account_id: int, user_id: int):
    """
    Períodos já importados de uma conta e os buracos entre eles.

    Conta comum: usa o período declarado pelo OFX (exato) ou, sem ele,
    as datas do primeiro e do último item (aproximado: dias sem
    movimento parecem buraco, por isso só avisa buracos de 3+ dias).
    Cartão: o que importa é a sequência de faturas, então aponta os
    meses de referência que ficaram sem lote.
    """
    from datetime import timedelta

    account = get_account(db, account_id)
    batches = (
        db.query(models.ImportBatch)
        .filter(
            models.ImportBatch.account_id == account_id,
            models.ImportBatch.user_id == user_id,
            models.ImportBatch.status != models.ImportBatchStatusEnum.CANCELLED,
        )
        .all()
    )

    if account and account.account_type == 'credit_card':
        months = sorted({b.reference_month.replace(day=1) for b in batches})
        missing = []
        if months:
            y, m = months[0].year, months[0].month
            last = months[-1]
            have = set(months)
            while (y, m) < (last.year, last.month):
                m += 1
                if m > 12:
                    y, m = y + 1, 1
                d = months[0].replace(year=y, month=m)
                if d not in have:
                    missing.append(d)
        return {
            "kind": "months",
            "covered_until": months[-1] if months else None,
            "missing_months": missing,
            "gaps": [],
            "balance_check": None,
        }

    ranges = []
    for b in batches:
        dates = [i.date for i in b.items if i.date]
        start = b.period_start or (min(dates) if dates else None)
        end = b.period_end or (max(dates) if dates else None)
        if start and end:
            ranges.append({
                "start": start, "end": end,
                "exact": bool(b.period_start and b.period_end),
                "batch_ids": [b.id],
            })
    ranges.sort(key=lambda r: r["start"])

    merged = []
    for r in ranges:
        if merged and r["start"] <= merged[-1]["end"] + timedelta(days=1):
            last = merged[-1]
            if r["end"] > last["end"]:
                last["end"], last["exact_end"] = r["end"], r["exact"]
            last["batch_ids"] += r["batch_ids"]
        else:
            merged.append({**r, "exact_end": r["exact"], "exact_start": r["exact"]})

    gaps = []
    for prev, nxt in zip(merged, merged[1:]):
        start = prev["end"] + timedelta(days=1)
        end = nxt["start"] - timedelta(days=1)
        days = (end - start).days + 1
        exact = prev["exact_end"] and nxt["exact_start"]
        if days >= (1 if exact else 3):
            gaps.append({
                "start": start, "end": end, "days": days, "exact": exact,
            })

    latest = max(
        (b for b in batches if b.statement_balance is not None
         and b.statement_balance_date),
        key=lambda b: (b.statement_balance_date, b.id),
        default=None,
    )
    return {
        "kind": "days",
        "covered_until": merged[-1]["end"] if merged else None,
        "missing_months": [],
        "gaps": gaps,
        "balance_check": get_balance_check(db, latest) if latest else None,
    }


def _item_signed_amount(item) -> float:
    """Valor com sinal que o item terá ao virar transação (conta comum)."""
    tx_type = item.transaction_type
    if tx_type not in ('income', 'expense'):
        tx_type = 'income' if item.amount > 0 else 'expense'
    return abs(item.amount) if tx_type == 'income' else -abs(item.amount)


def get_balance_check(db: Session, batch):
    """
    Conferência de saldo: saldo final do extrato (OFX LEDGERBAL) contra
    o saldo do app na mesma data = saldo inicial + transações até a data
    + itens ainda pendentes deste lote (o que entraria ao confirmar).

    Se não bater, aponta itens ignorados ou transações com exatamente o
    valor da diferença (lançamento esquecido ou duplicado).
    Só para contas comuns; cartão de crédito retorna None.
    """
    from sqlalchemy import func

    if batch is None or batch.statement_balance is None \
            or not batch.statement_balance_date:
        return None
    account = get_account(db, batch.account_id)
    if not account or account.account_type == 'credit_card':
        return None

    asof = batch.statement_balance_date
    tx_sum = db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0)) \
        .filter(
            models.Transaction.account_id == account.id,
            models.Transaction.date <= asof,
        ).scalar() or 0.0
    app_balance = round((account.initial_balance or 0.0) + tx_sum, 2)

    pending = []
    if batch.status not in (models.ImportBatchStatusEnum.CONFIRMED,
                            models.ImportBatchStatusEnum.CANCELLED):
        pending = [
            i for i in batch.items
            if i.status == models.ImportItemStatusEnum.PENDING
            and i.date and i.date <= asof
        ]
    pending_effect = round(sum(_item_signed_amount(i) for i in pending), 2)
    projected = round(app_balance + pending_effect, 2)
    bank = round(batch.statement_balance, 2)
    difference = round(bank - projected, 2)
    matches = abs(difference) < 0.01

    hints = []
    if not matches:
        cents = round(difference * 100)
        # Falta no app: item ignorado deste lote com o valor da diferença
        for i in batch.items:
            if i.status == models.ImportItemStatusEnum.IGNORED \
                    and round(_item_signed_amount(i) * 100) == cents:
                hints.append(
                    f"O item ignorado '{i.description or i.raw_description}' "
                    f"de {i.date.strftime('%d/%m')} tem exatamente esse valor"
                )
        # Sobra: item pendente deste lote que entraria em dobro
        for i in pending:
            if round(_item_signed_amount(i) * 100) == -cents:
                hints.append(
                    f"O item pendente '{i.description or i.raw_description}' "
                    f"de {i.date.strftime('%d/%m')} tem exatamente esse valor"
                    " (já foi lançado?)"
                )
        # Sobra no app: transação (talvez duplicada) com o valor oposto
        start = batch.period_start or min(
            (i.date for i in batch.items if i.date), default=asof)
        extra = db.query(models.Transaction).filter(
            models.Transaction.account_id == account.id,
            models.Transaction.date >= start,
            models.Transaction.date <= asof,
        ).all()
        for t in extra:
            if round(t.amount * 100) == -cents:
                hints.append(
                    f"A transação '{t.description}' de "
                    f"{t.date.strftime('%d/%m')} tem exatamente esse valor "
                    "(está duplicada ou não aconteceu?)"
                )
        hints = hints[:5]

    return {
        "batch_id": batch.id,
        "date": asof,
        "bank_balance": bank,
        "app_balance": app_balance,
        "pending_effect": pending_effect,
        "pending_count": len(pending),
        "projected_balance": projected,
        "difference": difference,
        "matches": matches,
        "confirmed": batch.status == models.ImportBatchStatusEnum.CONFIRMED,
        "hints": hints,
    }


# ------------------------------------------------------------------ #
#  Faturas por mês de vencimento                                      #
# ------------------------------------------------------------------ #

def _purchase_dates(items):
    """Datas que indicam o ciclo: compras à vista não ignoradas."""
    def get(i, k):
        return i.get(k) if isinstance(i, dict) else getattr(i, k, None)

    # Enum de status herda de str: compara igual a 'ignored'.
    live = [i for i in items if get(i, 'status') != 'ignored']
    plain = [get(i, 'date') or get(i, 'raw_date') for i in live if not get(i, 'installment_total')]
    if plain:
        return plain
    return [get(i, 'date') or get(i, 'raw_date') for i in live]


def suggest_reference_month(db: Session, account_id: int, items_data, period_end=None):
    """
    Mês de referência sugerido para um arquivo novo. Cartão configurado:
    mês de vencimento da fatura em que caem as compras. Senão: mês da
    data mais recente.
    """
    dates = [d for d in _purchase_dates(items_data) if d]
    account = get_account(db, account_id)
    days = _card_days(db, account_id) if account and account.account_type == 'credit_card' else None
    if days:
        return billing.suggest_due_month(dates, days[0], days[1], period_end)
    ref = period_end or (max(dates) if dates else date.today())
    return billing.month_start(ref)


def batch_cycle_info(db: Session, batch):
    """Ciclo da fatura do lote e itens com data fora dele."""
    account = get_account(db, batch.account_id)
    if not account or account.account_type != 'credit_card':
        return None
    days = _card_days(db, batch.account_id)
    if not days:
        return None
    cycle = billing.statement_cycle(days[0], days[1], batch.reference_month)
    out = [
        i.id for i in batch.items
        if i.status != models.ImportItemStatusEnum.IGNORED
        and not i.installment_total
        and not (cycle['period_start'] <= i.date <= cycle['closing_date'])
    ]
    suggested = billing.suggest_due_month(_purchase_dates(batch.items), *days)
    projection = None
    if batch.status in (models.ImportBatchStatusEnum.PENDING, models.ImportBatchStatusEnum.REVIEWED):
        projection = check_batch_against_projection(db, batch)
    return {
        **cycle,
        'out_of_cycle_item_ids': out,
        'suggested_month': suggested,
        'projection_check': projection,
    }


def update_batch_reference_month(db: Session, batch_id: int, user_id: int, month):
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status in (models.ImportBatchStatusEnum.CONFIRMED, models.ImportBatchStatusEnum.CANCELLED):
        raise ValueError("Só é possível mudar o mês de um lote ainda não confirmado")
    batch.reference_month = billing.month_start(month)
    batch.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(batch)
    return batch


def _statement_payload(db: Session, statement, today):
    outstanding = round(max(statement.total_amount - statement.paid_amount, 0.0), 2)
    payments = sorted(statement.payments, key=lambda p: (p.date, p.id))
    batches = db.query(models.ImportBatch).filter(
        models.ImportBatch.statement_id == statement.id,
    ).order_by(models.ImportBatch.id).all()
    return {
        'id': statement.id,
        'total_amount': round(statement.total_amount, 2),
        'paid_amount': round(statement.paid_amount, 2),
        'outstanding': outstanding,
        'status': statement_display_status(statement, today),
        'payments': [
            {
                'id': p.id,
                'date': p.date,
                'amount': round(p.amount, 2),
                'from_account_id': p.from_account_id,
                'from_account_name': p.from_account.name if p.from_account else None,
                'description': p.description,
            }
            for p in payments
        ],
        'paid_on': payments[-1].date if payments and outstanding <= 0 else None,
        'batches': [
            {
                'id': b.id,
                'file_name': b.file_name,
                'file_type': b.file_type,
                'status': b.status.value if hasattr(b.status, 'value') else b.status,
                'item_count': len(b.items),
            }
            for b in batches
        ],
    }


def get_statement_timeline(
    db: Session, user_id: int, account_id: int,
    months_back: int = 12, months_ahead: int = 6, today=None,
):
    """
    Linha do tempo de faturas por mês de vencimento: passadas (com status
    e pagamentos), a do ciclo atual e as futuras com parcelas projetadas.
    """
    today = today or date.today()
    days = _card_days(db, account_id)
    current = (billing.due_month_for_purchase(today, *days) if days
               else billing.month_start(today))

    statements = {
        s.reference_month: s
        for s in db.query(models.CreditCardStatement).filter(
            models.CreditCardStatement.account_id == account_id,
            models.CreditCardStatement.user_id == user_id,
        ).all()
    }
    pending = {}
    for b in db.query(models.ImportBatch).filter(
        models.ImportBatch.account_id == account_id,
        models.ImportBatch.user_id == user_id,
        models.ImportBatch.status.in_([
            models.ImportBatchStatusEnum.PENDING,
            models.ImportBatchStatusEnum.REVIEWED,
        ]),
    ).all():
        pending.setdefault(billing.month_start(b.reference_month), []).append(b.id)

    first = billing.add_months(current, -months_back)
    if statements:
        first = max(min(min(statements), first), billing.add_months(current, -36))
    last = billing.add_months(current, months_ahead)

    schedule = {
        m['due_month']: m
        for m in get_installment_schedule(
            db, user_id, account_id, months_ahead=months_back + months_ahead + 36,
            from_month=first,
        )
    }

    months = []
    m = first
    while m <= last:
        stmt = statements.get(m)
        cycle = (billing.statement_cycle(days[0], days[1], m) if days else {
            'reference_month': m, 'period_start': None,
            'closing_date': None, 'due_date': None,
        })
        if stmt and stmt.due_date:
            cycle = {
                'reference_month': m,
                'period_start': stmt.period_start or cycle['period_start'],
                'closing_date': stmt.closing_date or cycle['closing_date'],
                'due_date': stmt.due_date,
            }
        if m < current:
            phase = 'past'
        elif m == current:
            phase = 'current'
        else:
            phase = 'future'
        projected = schedule.get(m)
        entry = {
            **cycle,
            'phase': phase,
            'closed': bool(cycle['closing_date'] and cycle['closing_date'] < today),
            'statement': _statement_payload(db, stmt, today) if stmt else None,
            'pending_batch_ids': pending.get(m, []),
            'projected_installments': projected['items'] if projected else [],
            'projected_total': projected['total'] if projected else 0.0,
        }
        if stmt:
            entry['status'] = entry['statement']['status']
        elif pending.get(m):
            entry['status'] = 'pending_review'
        elif phase == 'past':
            entry['status'] = 'missing'
        elif phase == 'current':
            entry['status'] = 'open_cycle'
        else:
            entry['status'] = 'forecast'
        months.append(entry)
        m = billing.add_months(m, 1)

    return {
        'account_id': account_id,
        'configured': bool(days),
        'current_month': current,
        'months': months,
    }


def get_statement_detail(db: Session, statement, today=None):
    """Fatura com todos os itens dos lotes confirmados que a compõem."""
    today = today or date.today()
    groups = {
        (g['match_key'], g['total'], g['first_month']): g
        for g in _installment_groups(db, statement.user_id, statement.account_id)
    }
    batches = db.query(models.ImportBatch).filter(
        models.ImportBatch.statement_id == statement.id,
        models.ImportBatch.status == models.ImportBatchStatusEnum.CONFIRMED,
    ).all()
    month = statement.reference_month
    items = []
    for b in batches:
        for i in b.items:
            if i.status == models.ImportItemStatusEnum.IGNORED:
                continue
            end_month = None
            if i.installment_total and i.installment_current:
                first = billing.add_months(month, -(i.installment_current - 1))
                end_month = billing.add_months(first, i.installment_total - 1)
                g = groups.get((_installment_base_key(i.raw_description or i.description),
                                i.installment_total, first))
                if g:
                    end_month = g['end_month']
            items.append({
                'id': i.id,
                'batch_id': b.id,
                'date': i.date,
                'description': i.description or i.raw_description,
                'raw_description': i.raw_description,
                'amount': round(abs(i.amount), 2),
                'category_id': i.category_id,
                'category_name': i.category.name if i.category else None,
                'installment_current': i.installment_current,
                'installment_total': i.installment_total,
                'installment_end_month': end_month,
                'out_of_cycle': bool(
                    statement.period_start and statement.closing_date
                    and not i.installment_total
                    and not (statement.period_start <= i.date <= statement.closing_date)
                ),
            })
    items.sort(key=lambda x: (x['date'], x['id']))
    return {
        'reference_month': month,
        'period_start': statement.period_start,
        'closing_date': statement.closing_date,
        'due_date': statement.due_date,
        **_statement_payload(db, statement, today),
        'items': items,
    }


def realign_card_statements(db: Session):
    """
    Converte faturas antigas (uma por lote, mês escolhido à mão) para o
    modelo de uma fatura por cartão e mês de VENCIMENTO.

    Só trata faturas ainda sem `closing_date` de cartões configurados:
    1. recalcula o mês de cada lote confirmado pelas datas das compras;
    2. junta faturas que caem no mesmo mês (soma pagamentos);
    3. liga os lotes à fatura, recalcula total, ciclo e status.
    Retorna linhas de log.
    """
    log = []
    legacy = db.query(models.CreditCardStatement).filter(
        models.CreditCardStatement.closing_date.is_(None),
    ).order_by(models.CreditCardStatement.id).all()
    by_account: dict = {}
    for s in legacy:
        by_account.setdefault(s.account_id, []).append(s)

    for account_id, stmts in by_account.items():
        days = _card_days(db, account_id)
        if not days:
            continue
        targets: dict = {}
        for s in stmts:
            batch = db.get(models.ImportBatch, s.batch_id)
            month = s.reference_month
            if batch:
                suggested = billing.suggest_due_month(_purchase_dates(batch.items), *days)
                if suggested:
                    month = suggested
                if batch.reference_month != month:
                    log.append(
                        f"lote #{batch.id}: mes {batch.reference_month:%m/%Y} -> "
                        f"{month:%m/%Y} (vencimento)"
                    )
                batch.reference_month = month
            targets.setdefault(month, []).append((s, batch))

        legacy_ids = {s.id for s in stmts}
        for month, pairs in targets.items():
            existing = db.query(models.CreditCardStatement).filter(
                models.CreditCardStatement.account_id == account_id,
                models.CreditCardStatement.reference_month == month,
                ~models.CreditCardStatement.id.in_(legacy_ids),
            ).first()
            keep = existing or pairs[0][0]
            for s, batch in pairs:
                if batch:
                    batch.statement_id = keep.id
                if s is keep:
                    continue
                for p in list(s.payments):
                    p.statement_id = keep.id
                keep.paid_amount += s.paid_amount
                log.append(f"fatura #{s.id} unida a #{keep.id} ({month:%m/%Y})")
                db.flush()
                db.expire(s, ['payments'])
                db.delete(s)
            db.flush()
            keep.reference_month = month
            _apply_statement_cycle(db, keep)
            recalculate_statement_total(db, keep)
        db.flush()

    # Lotes cancelados não mudam mais: seguem o mês das próprias compras
    # para não aparecerem misturados a outra fatura no histórico.
    for b in db.query(models.ImportBatch).join(
        models.Account, models.Account.id == models.ImportBatch.account_id,
    ).filter(
        models.Account.account_type == 'credit_card',
        models.ImportBatch.status == models.ImportBatchStatusEnum.CANCELLED,
    ).all():
        days = _card_days(db, b.account_id)
        month = days and billing.suggest_due_month(_purchase_dates(b.items), *days)
        if month and b.reference_month != month:
            log.append(f"lote cancelado #{b.id}: mes {b.reference_month:%m/%Y} -> {month:%m/%Y}")
            b.reference_month = month

    # Lotes confirmados de faturas já alinhadas que ainda não têm vínculo.
    for s in db.query(models.CreditCardStatement).all():
        b = db.get(models.ImportBatch, s.batch_id)
        if b and not b.statement_id:
            b.statement_id = s.id
    db.commit()
    return log
