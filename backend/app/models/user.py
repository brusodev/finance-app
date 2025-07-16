from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: str
    name: str
    
class UserCreate(UserBase):
    password: str
    
class UserUpdate(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None
    
class UserResponse(UserBase):
    id: str
    created_at: datetime
    
    class Config:
        orm_mode = True