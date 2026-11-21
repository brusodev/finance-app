from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import crud, models, schemas
from app.database import Base


@pytest.fixture()
def db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    s = sessionmaker(bind=engine, autoflush=False)()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture()
def env(db):
    user = models.User(username="u", hashed_password="x")
    checking = models.Account(name="Conta", account_type="checking",
                              initial_balance=5000, balance=5000, user=user)
    card = models.Account(name="Nubank", account_type="credit_card",
                          initial_balance=0, balance=0, user=user)
    db.add_all([user, checking, card])
    db.commit()
    db.add(models.CreditCardConfig(account_id=card.id, closing_day=1, due_day=6))
    db.commit()
    return user, checking, card


def _import(db, user, card, month, items, confirm=True):
    batch = crud.create_import_batch(db, account_id=card.id, reference_month=month,
                                     user_id=user.id, file_type="ofx")
    crud.add_import_items(db, batch.id, [
        {"raw_description": d, "raw_amount": -a, "raw_date": dt,
         "installment_current": c, "installment_total": t}
        for d, a, dt, c, t in items
    ], user.id)
    if confirm:
        crud.confirm_import_batch(db, batch.id, user.id)
    db.refresh(batch)
    return batch


def test_two_batches_same_month_make_one_statement(db, env):
    user, _, card = env
    b1 = _import(db, user, card, date(2026, 4, 1), [("Mercado", 100, date(2026, 3, 10), None, None)])
    b2 = _import(db, user, card, date(2026, 4, 1), [("Posto", 50, date(2026, 3, 20), None, None)])
    s1 = crud.get_credit_card_statement_by_batch(db, b1.id, user.id)
    s2 = crud.get_credit_card_statement_by_batch(db, b2.id, user.id)
    assert s1.id == s2.id
    assert s1.total_amount == pytest.approx(150)
    assert s1.due_date == date(2026, 4, 6)
    assert s1.closing_date == date(2026, 4, 1)
    assert s1.period_start == date(2026, 3, 2)


def test_payment_by_statement_and_overdue_status(db, env):
    user, checking, card = env
    b = _import(db, user, card, date(2026, 4, 1), [("Mercado", 100, date(2026, 3, 10), None, None)])
    stmt = crud.get_credit_card_statement_by_batch(db, b.id, user.id)
    assert crud.statement_display_status(stmt, today=date(2026, 4, 7)) == "overdue"
    crud.register_statement_payment(db, stmt.id, schemas.CreditCardStatementPaymentCreate(
        from_account_id=checking.id, amount=40, date=date(2026, 4, 6)), user.id)
    assert crud.statement_display_status(stmt, today=date(2026, 4, 1)) == "partial"
    crud.register_statement_payment(db, stmt.id, schemas.CreditCardStatementPaymentCreate(
        from_account_id=checking.id, amount=60, date=date(2026, 4, 8)), user.id)
    detail = crud.get_statement_detail(db, stmt, today=date(2026, 5, 1))
    assert detail["status"] == "paid"
    assert detail["paid_on"] == date(2026, 4, 8)
    assert [p["from_account_name"] for p in detail["payments"]] == ["Conta", "Conta"]


def test_same_description_purchases_stay_separate_and_project(db, env):
    user, _, card = env
    # Duas compras "Loja X" 1/3 em meses diferentes, com centavos variando.
    _import(db, user, card, date(2026, 7, 1), [("Loja X - Parcela 1/3", 39.98, date(2026, 6, 5), 1, 3)])
    _import(db, user, card, date(2026, 8, 1), [
        ("Loja X - Parcela 2/3", 39.96, date(2026, 8, 1), 2, 3),
        ("Loja X - Parcela 1/3", 90.00, date(2026, 7, 9), 1, 3),
    ])
    active = crud.get_active_installments(db, user.id, card.id)
    assert len(active) == 2
    by_first = {g["first_month"]: g for g in active}
    assert by_first[date(2026, 7, 1)]["current"] == 2
    assert by_first[date(2026, 7, 1)]["end_month"] == date(2026, 9, 1)
    assert by_first[date(2026, 8, 1)]["end_month"] == date(2026, 10, 1)

    sched = {m["due_month"]: m for m in crud.get_installment_schedule(db, user.id, card.id)}
    assert sched[date(2026, 9, 1)]["total"] == pytest.approx(39.96 + 90)
    assert sched[date(2026, 10, 1)]["total"] == pytest.approx(90)
    assert date(2026, 11, 1) not in sched


def test_projection_check_flags_missing_and_unexpected(db, env):
    user, _, card = env
    _import(db, user, card, date(2026, 7, 1), [("Loja X - Parcela 1/3", 40, date(2026, 6, 5), 1, 3)])
    pending = _import(db, user, card, date(2026, 8, 1), [
        ("Mercado", 10, date(2026, 7, 10), None, None),
        ("Loja Antiga - Parcela 5/6", 25, date(2026, 8, 1), 5, 6),
    ], confirm=False)
    check = crud.check_batch_against_projection(db, pending)
    assert [(m["description"], m["number"]) for m in check["missing"]] == [("Loja X", 2)]
    assert [u["number"] for u in check["unexpected"]] == [5]


def test_timeline_phases(db, env):
    user, _, card = env
    _import(db, user, card, date(2026, 10, 1), [
        ("Mercado", 100, date(2026, 9, 10), None, None),
        ("Loja X - Parcela 1/3", 40, date(2026, 9, 5), 1, 3),
    ])
    tl = crud.get_statement_timeline(db, user.id, card.id, months_back=2, months_ahead=3,
                                     today=date(2026, 11, 21))
    assert tl["current_month"] == date(2026, 12, 1)
    months = {m["reference_month"]: m for m in tl["months"]}
    assert months[date(2026, 10, 1)]["status"] == "overdue"
    assert months[date(2026, 11, 1)]["status"] == "missing"
    assert months[date(2026, 11, 1)]["projected_total"] == pytest.approx(40)
    assert months[date(2026, 12, 1)]["phase"] == "current"
    assert months[date(2026, 12, 1)]["projected_total"] == pytest.approx(40)
    assert months[date(2027, 1, 1)]["status"] == "forecast"
    assert months[date(2027, 1, 1)]["projected_total"] == 0


def _make_legacy(db, user, checking, card, old_month, items, paid_on):
    """Cria fatura no formato antigo: mês escolhido à mão, sem ciclo."""
    b = _import(db, user, card, old_month, items)
    s = crud.get_credit_card_statement_by_batch(db, b.id, user.id)
    crud.register_statement_payment(db, s.id, schemas.CreditCardStatementPaymentCreate(
        from_account_id=checking.id, amount=s.total_amount, date=paid_on), user.id)
    b.statement_id = None
    b.reference_month = old_month
    s.reference_month = old_month
    s.closing_date = s.period_start = s.due_date = None
    db.commit()
    return b, s


def test_realign_relabels_by_due_month(db, env):
    user, checking, card = env
    # Caso real: compras de maio rotuladas como "junho" pelo mês dos gastos.
    b, s = _make_legacy(db, user, checking, card, date(2026, 5, 1),
                        [("A", 10, date(2026, 5, 3), None, None),
                         ("Parc - Parcela 2/3", 5, date(2026, 6, 1), 2, 3)], date(2026, 6, 8))
    log = crud.realign_card_statements(db)
    db.refresh(b)
    db.refresh(s)
    assert b.reference_month == date(2026, 6, 1)   # vence 06/06
    assert s.reference_month == date(2026, 6, 1)
    assert (s.period_start, s.closing_date, s.due_date) == (
        date(2026, 5, 2), date(2026, 6, 1), date(2026, 6, 6))
    assert s.status == models.CreditCardStatementStatusEnum.PAID
    assert b.statement_id == s.id
    assert len(log) == 1
    assert crud.realign_card_statements(db) == []   # idempotente


def test_realign_merges_statements_of_same_due_month(db, env):
    user, checking, card = env
    b1, s1 = _make_legacy(db, user, checking, card, date(2026, 3, 1),
                          [("A", 100, date(2026, 3, 10), None, None)], date(2026, 4, 6))
    b2, s2 = _make_legacy(db, user, checking, card, date(2026, 5, 1),
                          [("B", 50, date(2026, 3, 25), None, None)], date(2026, 4, 7))
    crud.realign_card_statements(db)
    stmts = db.query(models.CreditCardStatement).all()
    assert len(stmts) == 1
    kept = stmts[0]
    assert kept.reference_month == date(2026, 4, 1)
    assert kept.total_amount == pytest.approx(150)
    assert kept.paid_amount == pytest.approx(150)
    assert len(kept.payments) == 2
    db.refresh(b1)
    db.refresh(b2)
    assert b1.statement_id == b2.statement_id == kept.id


def test_realign_relabels_cancelled_batches(db, env):
    user, _, card = env
    b = _import(db, user, card, date(2026, 3, 1),
                [("A", 10, date(2026, 3, 10), None, None)], confirm=False)
    crud.cancel_import_batch(db, b.id, user.id)
    crud.realign_card_statements(db)
    db.refresh(b)
    assert b.reference_month == date(2026, 4, 1)
    assert crud.realign_card_statements(db) == []
