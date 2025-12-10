from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


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
    date = Column(Date)
    description = Column(String)
    transaction_type = Column(String)  # 'income' or 'expense'
    category_id = Column(Integer, ForeignKey('categories.id'))
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=True)
    user_id = Column(Integer, ForeignKey('users.id'))

    category = relationship("Category")
    account = relationship("Account")
    user = relationship("User")
