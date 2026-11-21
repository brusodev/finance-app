from datetime import date

from app import billing


def test_cycle_closing_before_due_same_month():
    c = billing.statement_cycle(5, 12, date(2026, 11, 1))
    assert c["closing_date"] == date(2026, 11, 5)
    assert c["due_date"] == date(2026, 11, 12)
    assert c["period_start"] == date(2026, 10, 6)


def test_cycle_closing_after_due_is_previous_month():
    # Fecha dia 28, vence dia 8: a fatura de dezembro fecha em 28/11.
    c = billing.statement_cycle(28, 8, date(2026, 12, 1))
    assert c["closing_date"] == date(2026, 11, 28)
    assert c["due_date"] == date(2026, 12, 8)
    assert c["period_start"] == date(2026, 10, 29)


def test_cycle_day_31_in_february_and_year_turn():
    c = billing.statement_cycle(31, 10, date(2027, 3, 1))
    assert c["closing_date"] == date(2027, 2, 28)
    assert c["period_start"] == date(2027, 2, 1)
    jan = billing.statement_cycle(5, 12, date(2027, 1, 1))
    assert jan["period_start"] == date(2026, 12, 6)


def test_due_month_for_purchase_boundaries():
    # Fecha 1, vence 6 (config real do Nubank do usuário).
    assert billing.due_month_for_purchase(date(2026, 3, 1), 1, 6) == date(2026, 3, 1)
    assert billing.due_month_for_purchase(date(2026, 3, 2), 1, 6) == date(2026, 4, 1)
    assert billing.due_month_for_purchase(date(2026, 3, 31), 1, 6) == date(2026, 4, 1)
    # Fecha 28, vence 8.
    assert billing.due_month_for_purchase(date(2026, 11, 28), 28, 8) == date(2026, 12, 1)
    assert billing.due_month_for_purchase(date(2026, 11, 29), 28, 8) == date(2027, 1, 1)


def test_suggest_due_month_majority_and_period_end():
    dates = [date(2026, 3, 1)] + [date(2026, 3, d) for d in range(2, 20)]
    assert billing.suggest_due_month(dates, 1, 6) == date(2026, 4, 1)
    assert billing.suggest_due_month([], 1, 6) is None
    assert billing.suggest_due_month([], 5, 12, period_end=date(2026, 11, 5)) == date(2026, 11, 1)
