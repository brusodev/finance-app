from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

# Endpoints de autenticação aqui