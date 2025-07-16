from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class CategoryBase(BaseModel):
    name: str
    color: Optional[str] = "#000000"

class CategoryCreate(CategoryBase):
    pass
    
class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    
class CategoryResponse(CategoryBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        orm_mode = True