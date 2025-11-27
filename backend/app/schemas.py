from pydantic import BaseModel
from typing import Optional, List
from datetime import date


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

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar: Optional[str] = None


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
    balance: float = 0.0
    currency: str = "BRL"


class Account(BaseModel):
    id: int
    name: str
    account_type: str
    balance: float
    currency: str

    class Config:
        orm_mode = True


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
