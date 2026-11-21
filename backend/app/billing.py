"""Ciclo de fatura de cartão de crédito.

Convenção do app: a fatura é identificada pelo MÊS DE VENCIMENTO
("Fatura de Nov/2026" é a que vence em novembro). O fechamento é o
último `closing_day` antes do vencimento e o período de compras vai do
dia seguinte ao fechamento anterior até o fechamento.
"""

import calendar
from collections import Counter
from datetime import date, timedelta


def month_start(d: date) -> date:
    return d.replace(day=1)


def add_months(d: date, n: int) -> date:
    """Primeiro dia do mês `n` meses depois de `d` (n pode ser negativo)."""
    idx = d.year * 12 + (d.month - 1) + n
    return date(idx // 12, idx % 12 + 1, 1)


def _clamped(year: int, month: int, day: int) -> date:
    """Dia do mês limitado ao último dia (31 em fevereiro -> 28/29)."""
    last = calendar.monthrange(year, month)[1]
    return date(year, month, min(max(day, 1), last))


def _closing_for(closing_day: int, due_day: int, due_month: date) -> date:
    # Fecha no mesmo mês do vencimento se o fechamento vem antes do
    # vencimento; senão, fecha no mês anterior.
    m = due_month if closing_day < due_day else add_months(due_month, -1)
    return _clamped(m.year, m.month, closing_day)


def statement_cycle(closing_day: int, due_day: int, due_month: date) -> dict:
    """Período de compras, fechamento e vencimento da fatura de `due_month`."""
    due_month = month_start(due_month)
    closing = _closing_for(closing_day, due_day, due_month)
    prev_closing = _closing_for(closing_day, due_day, add_months(due_month, -1))
    return {
        "reference_month": due_month,
        "period_start": prev_closing + timedelta(days=1),
        "closing_date": closing,
        "due_date": _clamped(due_month.year, due_month.month, due_day),
    }


def due_month_for_purchase(purchase_date: date, closing_day: int, due_day: int) -> date:
    """Mês de vencimento da fatura em que uma compra nessa data cai."""
    m = add_months(month_start(purchase_date), -1)
    for _ in range(4):
        if purchase_date <= _closing_for(closing_day, due_day, m):
            return m
        m = add_months(m, 1)
    return m  # inalcançável com dias válidos


def suggest_due_month(dates, closing_day: int, due_day: int, period_end: date = None):
    """
    Fatura mais provável de um arquivo importado.

    Usa o fim do período declarado pelo OFX quando existe; senão, o mês
    em que cai a maioria das compras (empate -> a fatura mais recente).
    As datas de parcelas devem ser excluídas por quem chama, porque
    carregam a data da compra original.
    """
    if period_end:
        return due_month_for_purchase(period_end, closing_day, due_day)
    votes = Counter(due_month_for_purchase(d, closing_day, due_day) for d in dates if d)
    if not votes:
        return None
    return max(votes.items(), key=lambda kv: (kv[1], kv[0]))[0]
