from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import uuid4
from datetime import datetime

from ..models.user import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix='/users', tags=['Users'])

# Mock database - substituir posteriormente por conexão real
users_db = []

@router.post('/', response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    # Verificar se o usuário já existe
    if any(u.get('email') == user.email for u in users_db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Email já está em uso'
        )
    
    # Em produção, hash a senha aqui
    
    new_user = {
        'id': str(uuid4()),
        'email': user.email,
        'name': user.name,
        'password': user.password,  # Isso seria o hash da senha
        'created_at': datetime.now()
    }
    users_db.append(new_user)
    return new_user

@router.get('/', response_model=List[UserResponse])
async def get_users():
    return users_db
