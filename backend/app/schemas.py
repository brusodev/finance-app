from pydantic import BaseModel
from typing import Optional
from datetime import date

class UserCreate(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: int
    username: str

    class Config:
        orm_mode = True

class Token(BaseModel):
    token: str
    token_type: str = "bearer"
    user: User

class Category(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True

class TransactionCreate(BaseModel):
    amount: float
    date: date
    description: Optional[str]
    category_id: int

class Transaction(BaseModel):
    id: int
    amount: float
    date: date
    description: Optional[str]
    category: Category
    user: User

    class Config:
        orm_mode = True