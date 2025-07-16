from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionBase(BaseModel):
    description: str
    amount: float = Field(..., gt=0)
    type: TransactionType
    date: datetime = Field(default_factory=datetime.now)
    category_id: Optional[UUID] = None

class TransactionCreate(TransactionBase):
    pass
    
class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(None, gt=0)
    type: Optional[TransactionType] = None
    date: Optional[datetime] = None
    category_id: Optional[UUID] = None
    
class TransactionResponse(TransactionBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True