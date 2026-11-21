from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import crud, models
from app.database import Base
from app.parsers import parse_ofx, parse_ofx_period, parse_csv


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def _account(db, kind="checking"):
    user = models.User(username="u", hashed_password="x")
    acc = models.Account(name="Nubank", account_type=kind, initial_balance=0,
                         balance=0, currency="BRL", user=user)
    db.add(acc)
    db.commit()
    return user, acc


def _import(db, user, acc, rows, ref=date(2026, 10, 1), **kw):
    batch = crud.create_import_batch(db, acc.id, ref, file_type="ofx",
                                     user_id=user.id, **kw)
    crud.add_import_items(db, batch.id, [
        {"raw_description": d, "raw_amount": a, "raw_date": dt,
         "external_id": fid}
        for d, a, dt, fid in rows
    ], user.id)
    db.refresh(batch)
    return batch


def _by_desc(batch):
    return {(i.raw_description, i.date): i for i in batch.items}


CAFE = "Compra no débito - CAFE BOMBOM"
UBER = "Compra no débito via NuPay - Uber"


def test_overlapping_file_ignores_already_confirmed_items(db):
    user, acc = _account(db)
    first = _import(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), None),
        (UBER, -21.5, date(2026, 10, 6), None),
    ])
    crud.confirm_import_batch(db, first.id, user.id)

    second = _import(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), None),
        (UBER, -21.5, date(2026, 10, 6), None),
        ("Compra no débito - PADARIA", -12.0, date(2026, 10, 20), None),
    ])
    items = _by_desc(second)
    assert items[(CAFE, date(2026, 10, 5))].status.value == "ignored"
    assert items[(CAFE, date(2026, 10, 5))].duplicate_status == "certain"
    assert f"lote #{first.id}" in items[(CAFE, date(2026, 10, 5))].duplicate_note
    assert items[(UBER, date(2026, 10, 6))].status.value == "ignored"
    padaria = items[("Compra no débito - PADARIA", date(2026, 10, 20))]
    assert padaria.status.value == "pending" and padaria.duplicate_status is None


def test_two_identical_purchases_only_one_already_imported(db):
    user, acc = _account(db)
    first = _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)])
    crud.confirm_import_batch(db, first.id, user.id)
    second = _import(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), None),
        (CAFE, -8.0, date(2026, 10, 5), None),
    ])
    statuses = sorted(i.duplicate_status or "-" for i in second.items)
    assert statuses == ["-", "certain"]


def test_bank_id_distinguishes_identical_purchases(db):
    user, acc = _account(db)
    first = _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), "A1")])
    crud.confirm_import_batch(db, first.id, user.id)
    second = _import(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), "A1"),
        (CAFE, -8.0, date(2026, 10, 5), "B2"),
    ])
    by_id = {i.external_id: i for i in second.items}
    assert by_id["A1"].duplicate_status == "certain"
    assert by_id["B2"].duplicate_status is None


def test_recurring_same_value_next_day_is_only_a_warning(db):
    user, acc = _account(db)
    pix = "Transferência enviada pelo Pix - AUTOPASS S.A"
    first = _import(db, user, acc, [(pix, -5.0, date(2026, 10, 5), None)])
    crud.confirm_import_batch(db, first.id, user.id)
    second = _import(db, user, acc, [(pix, -5.0, date(2026, 10, 6), None)])
    item = second.items[0]
    assert item.duplicate_status == "possible"
    assert item.status.value == "pending"


def test_pending_batch_items_are_also_candidates(db):
    user, acc = _account(db)
    first = _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)])
    second = _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)])
    assert second.items[0].duplicate_status == "certain"
    assert "ainda não confirmado" in second.items[0].duplicate_note
    assert first.items[0].duplicate_status is None


def test_manual_entry_same_day_and_value_is_flagged_possible(db):
    user, acc = _account(db)
    db.add(models.Transaction(amount=-21.5, date=date(2026, 10, 6),
                              description="Corrida", transaction_type="expense",
                              account_id=acc.id, user_id=user.id))
    db.commit()
    batch = _import(db, user, acc, [(UBER, -21.5, date(2026, 10, 6), None)])
    assert batch.items[0].duplicate_status == "possible"
    assert "lançamento manual" in batch.items[0].duplicate_note


def test_coverage_reports_gap_between_exact_periods(db):
    user, acc = _account(db)
    _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)],
            period_start=date(2026, 10, 1), period_end=date(2026, 10, 16))
    _import(db, user, acc, [(UBER, -9.0, date(2026, 10, 22), None)],
            period_start=date(2026, 10, 20), period_end=date(2026, 10, 31))
    cov = crud.get_import_coverage(db, acc.id, user.id)
    assert cov["covered_until"] == date(2026, 10, 31)
    assert cov["gaps"] == [{"start": date(2026, 10, 17),
                            "end": date(2026, 10, 19), "days": 3,
                            "exact": True}]


def test_coverage_without_period_ignores_short_quiet_spells(db):
    user, acc = _account(db)
    _import(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None),
                            (CAFE, -8.0, date(2026, 10, 10), None)])
    _import(db, user, acc, [(UBER, -9.0, date(2026, 10, 12), None)])
    assert crud.get_import_coverage(db, acc.id, user.id)["gaps"] == []


def test_card_coverage_reports_missing_statement_month(db):
    user, acc = _account(db, kind="credit_card")
    _import(db, user, acc, [(UBER, -9.0, date(2026, 7, 3), None)],
            ref=date(2026, 7, 1))
    _import(db, user, acc, [(CAFE, -8.0, date(2026, 9, 3), None)],
            ref=date(2026, 9, 1))
    cov = crud.get_import_coverage(db, acc.id, user.id)
    assert cov["missing_months"] == [date(2026, 8, 1)]


OFX = b"""OFXHEADER:100
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<DTSTART>20261002000000[-3:BRT]
<DTEND>20261031000000[-3:BRT]
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261005000000[-3:BRT]
<TRNAMT>-8.00
<FITID>abc-123
<MEMO>Compra no debito - CAFE
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>
"""


def test_ofx_parser_reads_fitid_and_period():
    assert parse_ofx(OFX)[0]["external_id"] == "abc-123"
    assert parse_ofx_period(OFX) == (date(2026, 10, 2), date(2026, 10, 31))


def test_csv_parser_reads_identifier_column():
    csv_bytes = (
        "Data,Valor,Identificador,Descrição\n"
        "05/10/2026,-8.00,uuid-1,Compra no débito - CAFE\n"
    ).encode()
    assert parse_csv(csv_bytes)[0]["external_id"] == "uuid-1"


# ---------------- Conferência de saldo ----------------

from app.parsers import parse_ofx_balance


def _bal_batch(db, user, acc, rows, bal, bal_date):
    return _import(db, user, acc, rows, period_start=date(2026, 10, 1),
                   period_end=bal_date, statement_balance=bal,
                   statement_balance_date=bal_date)


def test_ofx_parser_reads_ledger_balance():
    ofx = OFX.replace(b"</BANKTRANLIST>", b"</BANKTRANLIST><LEDGERBAL>"
                      b"<BALAMT>1234.56<DTASOF>20261031000000[-3:BRT]"
                      b"</LEDGERBAL>")
    assert parse_ofx_balance(ofx) == (1234.56, date(2026, 10, 31))
    assert parse_ofx_balance(OFX) == (None, None)


def test_balance_matches_counting_pending_items(db):
    user, acc = _account(db)
    acc.initial_balance = 100.0
    db.commit()
    batch = _bal_batch(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), None),
        ("Transferência recebida pelo Pix - FULANO", 50.0, date(2026, 10, 6), None),
    ], 142.0, date(2026, 10, 31))
    check = crud.get_balance_check(db, batch)
    assert check["matches"] and check["pending_count"] == 2
    crud.confirm_import_batch(db, batch.id, user.id)
    db.refresh(batch)
    check = crud.get_balance_check(db, batch)
    assert check["matches"] and check["app_balance"] == 142.0


def test_balance_difference_points_to_ignored_item(db):
    user, acc = _account(db)
    batch = _bal_batch(db, user, acc, [
        (CAFE, -8.0, date(2026, 10, 5), None),
        (UBER, -21.5, date(2026, 10, 6), None),
    ], -29.5, date(2026, 10, 31))
    uber = next(i for i in batch.items if i.raw_description == UBER)
    uber.status = models.ImportItemStatusEnum.IGNORED
    db.commit()
    check = crud.get_balance_check(db, batch)
    assert not check["matches"] and check["difference"] == -21.5
    assert any("ignorado" in h for h in check["hints"])


def test_balance_difference_points_to_extra_transaction(db):
    user, acc = _account(db)
    db.add(models.Transaction(amount=-40.0, date=date(2026, 10, 3),
                              description="Mercado (manual)",
                              transaction_type="expense",
                              account_id=acc.id, user_id=user.id))
    db.commit()
    batch = _bal_batch(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)],
                       -8.0, date(2026, 10, 31))
    check = crud.get_balance_check(db, batch)
    assert check["difference"] == 40.0
    assert any("Mercado (manual)" in h for h in check["hints"])


def test_transactions_after_statement_date_are_not_counted(db):
    user, acc = _account(db)
    db.add(models.Transaction(amount=-99.0, date=date(2026, 11, 5),
                              description="Depois", transaction_type="expense",
                              account_id=acc.id, user_id=user.id))
    db.commit()
    batch = _bal_batch(db, user, acc, [(CAFE, -8.0, date(2026, 10, 5), None)],
                       -8.0, date(2026, 10, 31))
    assert crud.get_balance_check(db, batch)["matches"]


def test_no_balance_check_for_cards_or_without_balance(db):
    user, card = _account(db, kind="credit_card")
    batch = _bal_batch(db, user, card, [(CAFE, -8.0, date(2026, 10, 5), None)],
                       -8.0, date(2026, 10, 31))
    assert crud.get_balance_check(db, batch) is None
    user2 = user
    acc = models.Account(name="X", account_type="checking", initial_balance=0,
                         balance=0, currency="BRL", user=user2)
    db.add(acc)
    db.commit()
    plain = _import(db, user2, acc, [(CAFE, -8.0, date(2026, 10, 5), None)])
    assert crud.get_balance_check(db, plain) is None
