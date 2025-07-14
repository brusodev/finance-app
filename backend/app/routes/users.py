from fastapi import APIRouter

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

# Endpoints de usuário aqui