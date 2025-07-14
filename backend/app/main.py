from fastapi import FastAPI
from app.routes import users, auth, transactions, categories

app = FastAPI()

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(transactions.router)
app.include_router(categories.router)