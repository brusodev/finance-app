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


def get_credit_card_statement_by_batch(db: Session, batch_id: int, user_id: int):
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


def create_or_update_credit_card_statement(
    db: Session,
    batch_id: int,
    user_id: int,
    total_amount: float,
    due_date=None,
):
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")

    statement = get_credit_card_statement_by_batch(db, batch_id, user_id)
    if not statement:
        statement = models.CreditCardStatement(
            batch_id=batch.id,
            account_id=batch.account_id,
            user_id=user_id,
            reference_month=batch.reference_month,
            due_date=due_date,
            total_amount=abs(total_amount),
            paid_amount=0.0,
            status=models.CreditCardStatementStatusEnum.OPEN,
        )
        db.add(statement)
    else:
        statement.total_amount = abs(total_amount)
        if due_date is not None:
            statement.due_date = due_date

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
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status != models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("A fatura precisa estar confirmada antes de receber pagamentos")

    statement = get_credit_card_statement_by_batch(db, batch_id, user_id)
    if not statement:
        statement_total = sum(
            abs(item.amount)
            for item in batch.items
            if item.status != models.ImportItemStatusEnum.IGNORED
        )
        statement = create_or_update_credit_card_statement(
            db, batch_id=batch_id, user_id=user_id, total_amount=statement_total
        )

    if payment.amount <= 0:
        raise ValueError("O valor do pagamento deve ser positivo")

    outstanding = max(statement.total_amount - statement.paid_amount, 0.0)
    if payment.amount > outstanding:
        raise ValueError("O pagamento não pode ser maior que o saldo em aberto")

    from_account = get_account(db, payment.from_account_id)
    if not from_account or from_account.user_id != user_id:
        raise ValueError("Conta de origem não encontrada ou não pertence ao usuário")
    if from_account.id == statement.account_id:
        raise ValueError("A conta de origem não pode ser o próprio cartão")

    payment_description = payment.description or f"Pagamento da fatura {batch.reference_month.strftime('%m/%Y')}"
    transfer_payload = schemas.TransferCreate(
        from_account_id=payment.from_account_id,
        to_account_id=statement.account_id,
        amount=payment.amount,
        date=payment.date,
        description=payment_description,
    )
    transfer_result = create_transfer(db, transfer_payload, user_id, commit=False)

    statement_payment = models.CreditCardStatementPayment(
        statement_id=statement.id,
        from_account_id=payment.from_account_id,
        transfer_id=transfer_result["transfer_id"],
        date=payment.date,
        amount=payment.amount,
        description=payment_description,
        user_id=user_id,
    )
    db.add(statement_payment)

    statement.paid_amount += payment.amount
    _sync_credit_card_statement_status(statement)

    db.commit()
    db.refresh(statement)
    return get_credit_card_statement_by_batch(db, batch_id, user_id)


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
        category = models.Category(name="Investimentos", icon="📈", user_id=user_id)
        db.add(category)
        db.flush()
    return category.id


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

    db.commit()
    db.refresh(db_config)
    return db_config


# ---- Import Batch ----

def create_import_batch(
    db: Session,
    account_id: int,
    reference_month,
    file_name: str = None,
    file_type: str = None,
    user_id: int = None
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
        status=models.ImportBatchStatusEnum.PENDING,
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
    """Lista lotes de importação do usuário."""
    query = db.query(models.ImportBatch).filter(
        models.ImportBatch.user_id == user_id
    )
    if account_id:
        query = query.filter(
            models.ImportBatch.account_id == account_id
        )
    return query.order_by(
        models.ImportBatch.created_at.desc()
    ).all()


def cancel_import_batch(db: Session, batch_id: int, user_id: int):
    """Cancela um lote pendente/revisado."""
    batch = get_import_batch(db, batch_id, user_id)
    if not batch:
        raise ValueError("Lote não encontrado")
    if batch.status == models.ImportBatchStatusEnum.CONFIRMED:
        raise ValueError("Lote já confirmado não pode ser cancelado")

    batch.status = models.ImportBatchStatusEnum.CANCELLED
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
            status=models.ImportItemStatusEnum.PENDING,
        )
        db.add(item)
        created.append(item)

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
    user_id: int
):
    """
    Classifica via IA os itens PENDING de um lote: pré-preenche
    category_id e transaction_type. O usuário revisa depois.

    Retorna {classified, unmatched, ai_skipped, items}.
    Levanta MissingGroqKey se a key não estiver configurada.
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
    examples = get_classification_examples(db, user_id)

    result_map = (
        classify_items(items_payload, categories, examples)
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
            transaction_type=tx_type,
            category_id=item.category_id,
            account_id=batch.account_id,
            user_id=user_id,
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

    # Fatura (statement) só faz sentido para cartão de crédito
    if is_credit_card:
        statement_total = sum(
            abs(item.amount)
            for item in batch.items
            if item.status != models.ImportItemStatusEnum.IGNORED
        )
        create_or_update_credit_card_statement(
            db,
            batch_id=batch.id,
            user_id=user_id,
            total_amount=statement_total,
        )

    db.commit()

    return {
        "batch_id": batch_id,
        "confirmed_count": confirmed_count,
        "ignored_count": ignored_count,
        "transactions_created": transaction_ids,
    }
