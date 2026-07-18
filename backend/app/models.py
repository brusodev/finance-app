from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, Boolean, DateTime, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base
import enum


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar = Column(Text, nullable=True)  # Base64 encoded image
    cpf = Column(String, nullable=True)  # CPF do usuário
    phone = Column(String, nullable=True)  # Telefone
    birth_date = Column(Date, nullable=True)  # Data de nascimento
    address = Column(String, nullable=True)  # Endereço
    currency = Column(String, default='BRL')  # Moeda padrão do usuário


class Category(Base):
    __tablename__ = 'categories'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    icon = Column(String, nullable=True)
    expense_kind = Column(String, nullable=True)  # 'fixed' | 'variable'
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User")


class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    account_type = Column(String)  # 'checking', 'savings', 'credit_card', etc
    initial_balance = Column(Float, default=0.0)  # Saldo inicial imutável
    balance = Column(Float, default=0.0)  # Saldo atual calculado
    currency = Column(String, default='BRL')
    is_active = Column(Boolean, default=True)  # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)  # Auditoria (opcional para SQLite)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=True)  # Auditoria (opcional para SQLite)
    user_id = Column(Integer, ForeignKey('users.id'))
    user = relationship("User")


class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    date = Column(Date, index=True)  # Índice para ordenação e filtros
    description = Column(String, index=True)  # Índice para sugestões
    raw_description = Column(String, nullable=True)  # Memo íntegro do extrato (origem)
    transaction_type = Column(String, index=True)  # Índice para filtros ('income', 'expense', 'transfer')
    category_id = Column(Integer, ForeignKey('categories.id'), index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)  # Índice crítico

    # Campos para transferências entre contas
    transfer_id = Column(String, nullable=True, index=True)  # UUID para vincular transações de transferência
    transfer_account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)  # Conta destino/origem da transferência

    # Parcelamento (ex: 3/10) — preservado da fatura do cartão
    installment_current = Column(Integer, nullable=True)
    installment_total = Column(Integer, nullable=True)

    category = relationship("Category")
    account = relationship("Account", foreign_keys=[account_id])
    transfer_account = relationship("Account", foreign_keys=[transfer_account_id])
    user = relationship("User")


# Enums para Investimentos
class AssetTypeEnum(str, enum.Enum):
    TESOURO = "TESOURO"
    CDB = "CDB"
    ETF = "ETF"
    FII = "FII"
    ACAO = "ACAO"
    CRIPTO = "CRIPTO"
    OUTRO = "OUTRO"


class TransactionTypeEnum(str, enum.Enum):
    APORTE = "APORTE"
    RESGATE = "RESGATE"
    RENDIMENTO = "RENDIMENTO"
    TAXA = "TAXA"


class PlanModeEnum(str, enum.Enum):
    ESCADA = "ESCADA"
    FIXO = "FIXO"
    PERSONALIZADO = "PERSONALIZADO"


# Modelos de Investimentos
class InvestmentAsset(Base):
    __tablename__ = 'investment_assets'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    type = Column(Enum(AssetTypeEnum), nullable=False)
    broker = Column(String, nullable=True)
    currency = Column(String, default='BRL')
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    transactions = relationship("InvestmentTransaction", back_populates="asset", cascade="all, delete-orphan")


class InvestmentTransaction(Base):
    __tablename__ = 'investment_transactions'

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('investment_assets.id'), index=True)
    date = Column(Date, index=True)
    type = Column(Enum(TransactionTypeEnum), nullable=False, index=True)
    amount_brl = Column(Float, nullable=False)  # Valor em reais
    quantity = Column(Float, nullable=True)  # Quantidade (para ações, ETFs, etc)
    unit_price = Column(Float, nullable=True)  # Preço unitário
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Conta bancária vinculada (APORTE débita, RESGATE credita)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True, index=True)
    account_transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True, index=True)

    asset = relationship("InvestmentAsset", back_populates="transactions")
    user = relationship("User")
    account = relationship("Account", foreign_keys=[account_id])
    account_transaction = relationship("Transaction", foreign_keys=[account_transaction_id])


class GoalPlan(Base):
    __tablename__ = 'goal_plans'

    id = Column(Integer, primary_key=True, index=True)
    goal_name = Column(String, nullable=False)
    target_value_brl = Column(Float, nullable=False)
    start_date = Column(Date, nullable=False)
    months = Column(Integer, nullable=False)
    default_monthly_rate = Column(Float, default=0.009)  # 0.9% a.m.
    plan_mode = Column(Enum(PlanModeEnum), default=PlanModeEnum.ESCADA)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    steps = relationship("GoalPlanStep", back_populates="goal_plan", cascade="all, delete-orphan")


class GoalPlanStep(Base):
    __tablename__ = 'goal_plan_steps'

    id = Column(Integer, primary_key=True, index=True)
    goal_plan_id = Column(Integer, ForeignKey('goal_plans.id'), index=True)
    start_month = Column(Integer, nullable=False)  # Mês inicial (1-120)
    end_month = Column(Integer, nullable=False)  # Mês final (1-120)
    monthly_contribution_brl = Column(Float, nullable=False)

    goal_plan = relationship("GoalPlan", back_populates="steps")


# ============================================================
# CARTÃO DE CRÉDITO
# ============================================================

class ImportBatchStatusEnum(str, enum.Enum):
    PENDING = "pending"      # Recém importado, aguardando revisão
    REVIEWED = "reviewed"    # Usuário editou itens, ainda não confirmou
    CONFIRMED = "confirmed"  # Itens convertidos em transactions
    CANCELLED = "cancelled"  # Cancelado pelo usuário


class ImportItemStatusEnum(str, enum.Enum):
    PENDING = "pending"      # Aguardando revisão
    CONFIRMED = "confirmed"  # Convertido em transaction
    IGNORED = "ignored"      # Descartado pelo usuário


class CreditCardConfig(Base):
    """Metadados extras de um cartão de crédito (account_type='credit_card')."""
    __tablename__ = 'credit_card_configs'

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), unique=True, nullable=False)
    closing_day = Column(Integer, nullable=False)   # Dia de fechamento (1-31)
    due_day = Column(Integer, nullable=False)        # Dia de vencimento (1-31)
    # Banco/emissor livre — usado para selecionar parser de PDF
    bank_name = Column(String, nullable=True)
    credit_limit = Column(Float, nullable=True)

    account = relationship("Account")


class CreditCardStatementStatusEnum(str, enum.Enum):
    OPEN = "open"
    PARTIAL = "partial"
    PAID = "paid"
    CANCELLED = "cancelled"


class ImportBatch(Base):
    """Lote de importação de fatura (um arquivo por lote)."""
    __tablename__ = 'import_batches'

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    # Mês/ano de referência da fatura (ex: 2025-03-01)
    reference_month = Column(Date, nullable=False)
    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)   # 'csv', 'ofx', 'pdf', 'manual'
    status = Column(Enum(ImportBatchStatusEnum), default=ImportBatchStatusEnum.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)

    account = relationship("Account")
    user = relationship("User")
    items = relationship("ImportItem", back_populates="batch", cascade="all, delete-orphan")
    statement = relationship(
        "CreditCardStatement",
        back_populates="batch",
        uselist=False,
        cascade="all, delete-orphan",
    )


class CreditCardStatement(Base):
    """Fatura consolidada de um cartão, gerada a partir de um lote confirmado."""
    __tablename__ = 'credit_card_statements'

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('import_batches.id'), unique=True, nullable=False, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    reference_month = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    status = Column(Enum(CreditCardStatementStatusEnum), default=CreditCardStatementStatusEnum.OPEN, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    batch = relationship("ImportBatch", back_populates="statement")
    account = relationship("Account")
    user = relationship("User")
    payments = relationship(
        "CreditCardStatementPayment",
        back_populates="statement",
        cascade="all, delete-orphan",
    )


class CreditCardStatementPayment(Base):
    """Pagamento parcial ou total de uma fatura, vinculado a uma transferência."""
    __tablename__ = 'credit_card_statement_payments'

    id = Column(Integer, primary_key=True, index=True)
    statement_id = Column(Integer, ForeignKey('credit_card_statements.id'), nullable=False, index=True)
    from_account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False, index=True)
    transfer_id = Column(String, nullable=False, unique=True, index=True)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    statement = relationship("CreditCardStatement", back_populates="payments")
    from_account = relationship("Account", foreign_keys=[from_account_id])
    user = relationship("User")


class ImportItem(Base):
    """Um item (linha) de uma fatura importada, editável antes de confirmar."""
    __tablename__ = 'import_items'

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('import_batches.id'), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)

    # Dados extraídos do arquivo (imutáveis após importação)
    raw_description = Column(String, nullable=True)
    raw_amount = Column(Float, nullable=False)
    raw_date = Column(Date, nullable=False)

    # Dados editáveis pelo usuário antes de confirmar
    description = Column(String, nullable=True)     # Pode ser editado
    amount = Column(Float, nullable=False)           # Pode ser corrigido
    date = Column(Date, nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True, index=True)
    # Tipo do lançamento: 'income' ou 'expense' (preenchido pela IA, editável)
    transaction_type = Column(String, nullable=True)

    # Informações de parcelamento (ex: "3/10")
    installment_current = Column(Integer, nullable=True)
    installment_total = Column(Integer, nullable=True)

    status = Column(Enum(ImportItemStatusEnum), default=ImportItemStatusEnum.PENDING, nullable=False)
    # Aponta para a Transaction criada após confirmação
    transaction_id = Column(Integer, ForeignKey('transactions.id'), nullable=True)

    batch = relationship("ImportBatch", back_populates="items")
    category = relationship("Category")
    transaction = relationship("Transaction")


class MerchantAlias(Base):
    """
    Memória de classificação por usuário: associa o memo íntegro do
    banco (normalizado) a um nome amigável + categoria + tipo.

    Alimentada a cada confirmação de lote. Serve como cache (acerta
    sem chamar a IA) e como contexto/few-shot mais preciso.
    """
    __tablename__ = 'merchant_aliases'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    # Chave de busca: raw_description normalizado (lower, sem parcela)
    raw_key = Column(String, nullable=False, index=True)
    # Texto bruto original (referência humana)
    raw_description = Column(String, nullable=True)
    # Nome amigável aprendido
    friendly_name = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='SET NULL'), nullable=True)
    transaction_type = Column(String, nullable=True)  # 'income' | 'expense'
    # Quantas vezes foi confirmado assim (desempate por frequência)
    hits = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint('user_id', 'raw_key', name='uq_merchant_alias_user_key'),
    )

    user = relationship("User")
    category = relationship("Category")
