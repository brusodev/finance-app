import json

import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import ai_classifier, crud, models
from app.database import Base


PIX_AGUA = (
    "Transferência enviada pelo Pix - Agua (RAUL ESTEVES RODRIGUES BRANCO - "
    "•••.595.168-•• - BCO DO BRASIL S.A. (0001) Agência: 4054 Conta: 24228-4)"
)
PIX_POSTO = (
    "Transferência enviada pelo Pix - AUTO POSTO TROVAO AZUL LTDA. - "
    "09.525.1-57 - STONE IP S.A. (0197) Agência: 1 Conta: 32079222-9"
)


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    try:
        yield db
    finally:
        db.close()


def test_merchant_tokens_ignore_payment_method_and_bank_data():
    assert crud._merchant_tokens(PIX_AGUA) == {"agua", "raul", "esteves",
                                               "rodrigues", "branco"}
    assert crud._merchant_tokens(PIX_POSTO) == {"auto", "posto", "trovao",
                                                "azul"}
    assert crud._merchant_tokens(
        "Estorno - Compra no débito via NuPay - Uber"
    ) == {"uber"}


def _seed(db):
    user = models.User(username="u", hashed_password="x")
    db.add(user)
    db.flush()
    refeicoes = models.Category(name="Refeições", user_id=user.id)
    transporte = models.Category(name="Transporte", user_id=user.id)
    db.add_all([refeicoes, transporte])
    db.flush()
    crud.upsert_merchant_alias(db, user.id, PIX_AGUA, "Água - Raul",
                               refeicoes.id, "expense")
    crud.upsert_merchant_alias(db, user.id, "Compra no débito - Uber",
                               "Uber", transporte.id, "expense")
    db.commit()
    return user, refeicoes, transporte


def test_find_similar_aliases_matches_same_contact(db_session):
    user, refeicoes, _ = _seed(db_session)
    other_pix = PIX_AGUA.replace("Agua", "Coxinhas").replace("24228", "1")
    sims = crud.find_similar_aliases(
        db_session, user.id, [other_pix, "Compra no débito - Uber Trip",
                              "Compra no débito - Padaria Nova"]
    )
    assert sims[0][0]["description"] == "Água - Raul"
    assert sims[0][0]["category_name"] == "Refeições"
    assert sims[1][0]["description"] == "Uber"
    assert sims[2] == []


def test_alias_examples_carry_raw_to_friendly_pairs(db_session):
    user, _, _ = _seed(db_session)
    examples = crud.get_alias_examples(db_session, user.id)
    agua = next(e for e in examples if e["description"] == "Água - Raul")
    assert agua["raw_description"].startswith("Transferência enviada")


class _FakeResponse:
    def __init__(self, status, body):
        self.status_code = status
        self._body = body
        self.headers = {}
        self.text = json.dumps(body)

    def raise_for_status(self):
        if self.status_code >= 400:
            req = httpx.Request("POST", ai_classifier.GROQ_URL)
            raise httpx.HTTPStatusError("err", request=req, response=self)

    def json(self):
        return self._body


def test_invalid_json_splits_chunk_instead_of_dropping(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "k")
    calls = []

    def fake_post(url, headers, json, timeout):
        prompt = json["messages"][1]["content"]
        ids = [int(x) for x in __import__("re").findall(r'"id": (\d+)', prompt)]
        calls.append(ids)
        if len(ids) > 2:
            return _FakeResponse(400, {"error": {"code": "json_validate_failed"}})
        content = {"results": [
            {"id": i, "category_id": 1, "transaction_type": "expense",
             "description": f"n{i}", "confidence": 0.9} for i in ids
        ]}
        return _FakeResponse(200, {"choices": [{"message": {
            "content": __import__("json").dumps(content)}}]})

    monkeypatch.setattr(ai_classifier.httpx, "post", fake_post)
    items = [{"id": i, "raw_description": f"x{i}", "amount": -1.0}
             for i in range(1, 6)]
    out = ai_classifier.classify_items(
        items, [{"id": 1, "name": "C"}], []
    )
    assert sorted(out) == [1, 2, 3, 4, 5]
    assert len(calls) > 1
