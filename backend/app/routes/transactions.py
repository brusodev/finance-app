from fastapi import APIRouter

router = APIRouter(
    prefix="/transactions",
    tags=["transactions"],
)

# Endpoints de transações aqui