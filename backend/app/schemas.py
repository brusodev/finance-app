from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class User(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None
    cpf: Optional[str] = None
    phone: Optional[str] = None
    birth_date: Optional[date] = None
    address: Optional[str] = None

    class Config:
        # Permitir valores None explícitos
        validate_assignment = True


class Token(BaseModel):
    token: str
    token_type: str = "bearer"
    user: User


class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = None


class Category(BaseModel):
    id: int
    name: str
    icon: Optional[str] = None

    class Config:
        orm_mode = True


class AccountCreate(BaseModel):
    name: str
    account_type: str
    initial_balance: float = 0.0
    currency: str = "BRL"


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    is_active: Optional[bool] = None


class Account(BaseModel):
    id: int
    name: str
    account_type: str
    initial_balance: float
    balance: float
    currency: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AccountBalanceAudit(BaseModel):
    account_id: int
    account_name: str
    initial_balance: float
    current_balance: float
    calculated_balance: float
    total_transactions: int
    is_consistent: bool
    difference: float


class TransactionCreate(BaseModel):
    amount: float
    date: date
    description: Optional[str] = None
    transaction_type: str
    category_id: int
    account_id: Optional[int] = None


class Transaction(BaseModel):
    id: int
    amount: float
    date: date
    description: Optional[str]
    transaction_type: str
    category: Category
    account: Optional[Account] = None
    user: User

    class Config:
        orm_mode = True
