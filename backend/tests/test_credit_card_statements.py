from datetime import date

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import crud, models, schemas
from app.database import Base


@pytest.fixture()
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def _seed_user_and_accounts(db_session):
    user = models.User(username="alice", hashed_password="hash")
    checking = models.Account(
        name="Conta Corrente",
        account_type="checking",
        initial_balance=1000.0,
        balance=1000.0,
        currency="BRL",
        user=user,
    )
    card = models.Account(
        name="Cartão",
        account_type="credit_card",
        initial_balance=0.0,
        balance=0.0,
        currency="BRL",
        user=user,
    )
    category = models.Category(name="Compras", user=user)
    db_session.add_all([user, checking, card, category])
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(checking)
    db_session.refresh(card)
    db_session.refresh(category)
    return user, checking, card, category


def test_confirm_and_pay_credit_card_statement_in_parts(db_session):
    user, checking, card, category = _seed_user_and_accounts(db_session)

    batch = crud.create_import_batch(
        db_session,
        account_id=card.id,
        reference_month=date(2026, 4, 1),
        user_id=user.id,
    )
    crud.add_import_items(
        db_session,
        batch.id,
        [
            {
                "raw_description": "Mercado",
                "raw_amount": 80.0,
                "raw_date": date(2026, 4, 5),
            },
            {
                "raw_description": "Farmácia",
                "raw_amount": 40.0,
                "raw_date": date(2026, 4, 8),
            },
        ],
        user.id,
    )

    confirm_result = crud.confirm_import_batch(db_session, batch.id, user.id)

    assert confirm_result["confirmed_count"] == 2
    statement = crud.get_credit_card_statement_by_batch(db_session, batch.id, user.id)
    assert statement is not None
    assert statement.total_amount == pytest.approx(120.0)
    assert statement.paid_amount == pytest.approx(0.0)
    assert statement.status == models.CreditCardStatementStatusEnum.OPEN

    card = crud.get_account(db_session, card.id)
    checking = crud.get_account(db_session, checking.id)
    assert card.balance == pytest.approx(-120.0)
    assert checking.balance == pytest.approx(1000.0)

    partial_statement = crud.register_credit_card_statement_payment(
        db_session,
        batch.id,
        schemas.CreditCardStatementPaymentCreate(
            from_account_id=checking.id,
            amount=50.0,
            date=date(2026, 5, 1),
            description="Pagamento parcial",
        ),
        user.id,
    )

    assert partial_statement.paid_amount == pytest.approx(50.0)
    assert partial_statement.status == models.CreditCardStatementStatusEnum.PARTIAL

    card = crud.get_account(db_session, card.id)
    checking = crud.get_account(db_session, checking.id)
    assert card.balance == pytest.approx(-70.0)
    assert checking.balance == pytest.approx(950.0)

    final_statement = crud.register_credit_card_statement_payment(
        db_session,
        batch.id,
        schemas.CreditCardStatementPaymentCreate(
            from_account_id=checking.id,
            amount=70.0,
            date=date(2026, 5, 2),
            description="Pagamento final",
        ),
        user.id,
    )

    assert final_statement.paid_amount == pytest.approx(120.0)
    assert final_statement.status == models.CreditCardStatementStatusEnum.PAID
    assert len(final_statement.payments) == 2

    card = crud.get_account(db_session, card.id)
    checking = crud.get_account(db_session, checking.id)
    assert card.balance == pytest.approx(0.0)
    assert checking.balance == pytest.approx(880.0)