from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    email = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar = Column(Text, nullable=True)  # Base64 encoded image


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
    balance = Column(Float, default=0.0)
    currency = Column(String, default='BRL')
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
