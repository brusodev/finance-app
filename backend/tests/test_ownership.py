"""Um usuário não pode mexer em contas/categorias de outro (IDOR)."""
import os
from datetime import date

import pytest

os.environ.setdefault("SECRET_KEY", "test-secret")

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app import models  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.routes.auth import create_access_token  # noqa: E402


@pytest.fixture()
def ctx():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False)
    db = Session()
    alice = models.User(username="alice", hashed_password="x")
    mallory = models.User(username="mallory", hashed_password="x")
    db.add_all([alice, mallory])
    db.commit()
    victim_acc = models.Account(name="Conta Alice", account_type="checking",
                                initial_balance=1000, balance=1000, user_id=alice.id)
    victim_cat = models.Category(name="Salário Alice", user_id=alice.id)
    own_acc = models.Account(name="Conta Mallory", account_type="checking",
                             initial_balance=0, balance=0, user_id=mallory.id)
    own_cat = models.Category(name="Geral", user_id=mallory.id)
    card = models.Account(name="Cartão Mallory", account_type="credit_card",
                          initial_balance=0, balance=0, user_id=mallory.id)
    db.add_all([victim_acc, victim_cat, own_acc, own_cat, card])
    db.commit()

    def override():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = override
    client = TestClient(app)
    client.cookies.set("access_token", create_access_token(mallory.id))
    yield client, db, victim_acc, victim_cat, own_acc, own_cat, card
    app.dependency_overrides.clear()
    db.close()


def test_cannot_create_transaction_on_other_users_account(ctx):
    client, db, victim_acc, _, _, own_cat, _ = ctx
    r = client.post("/transactions/", json={
        "amount": -999, "date": "2026-11-21", "transaction_type": "expense",
        "category_id": own_cat.id, "account_id": victim_acc.id,
    })
    assert r.status_code in (403, 404)
    db.refresh(victim_acc)
    assert victim_acc.balance == 1000


def test_cannot_move_transaction_to_other_users_account(ctx):
    client, db, victim_acc, _, own_acc, own_cat, _ = ctx
    r = client.post("/transactions/", json={
        "amount": -10, "date": "2026-11-21", "transaction_type": "expense",
        "category_id": own_cat.id, "account_id": own_acc.id,
    })
    assert r.status_code == 201
    r = client.put(f"/transactions/{r.json()['id']}", json={
        "amount": -999, "date": "2026-11-21", "transaction_type": "expense",
        "category_id": own_cat.id, "account_id": victim_acc.id,
    })
    assert r.status_code in (403, 404)
    db.refresh(victim_acc)
    assert victim_acc.balance == 1000


def test_cannot_use_other_users_category_on_import_item(ctx):
    client, db, _, victim_cat, _, _, card = ctx
    b = client.post(f"/credit-cards/{card.id}/batches/manual",
                    json={"account_id": card.id, "reference_month": "2026-11-01"}).json()
    r = client.post(f"/credit-cards/{card.id}/batches/{b['id']}/items", json={
        "description": "x", "amount": 10, "date": "2026-11-05", "category_id": victim_cat.id,
    })
    assert r.status_code in (400, 403, 404)
    r = client.post(f"/credit-cards/{card.id}/batches/{b['id']}/items", json={
        "description": "x", "amount": 10, "date": "2026-11-05",
    })
    assert r.status_code == 201
    r = client.put(f"/credit-cards/{card.id}/batches/{b['id']}/items/{r.json()['id']}",
                   json={"category_id": victim_cat.id})
    assert r.status_code in (400, 403, 404)
    assert "Salário Alice" not in r.text


def test_cannot_use_other_users_category_on_transfer(ctx):
    client, db, _, victim_cat, own_acc, _, card = ctx
    r = client.post("/transfers/", json={
        "from_account_id": own_acc.id, "to_account_id": card.id, "amount": 5,
        "date": "2026-11-21", "category_id": victim_cat.id,
    })
    assert r.status_code in (400, 403, 404)
