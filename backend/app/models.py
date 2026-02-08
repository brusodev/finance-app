from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, Boolean, DateTime, Enum
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
    transaction_type = Column(String, index=True)  # Índice para filtros ('income', 'expense', 'transfer')
    category_id = Column(Integer, ForeignKey('categories.id'), index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)  # Índice crítico

    # Campos para transferências entre contas
    transfer_id = Column(String, nullable=True, index=True)  # UUID para vincular transações de transferência
    transfer_account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)  # Conta destino/origem da transferência

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

    asset = relationship("InvestmentAsset", back_populates="transactions")
    user = relationship("User")


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
