# Bug Log — Finance App

Registro cronológico de bugs identificados e resolvidos.
Atualizado via skill `/buglog` após cada correção.

---

## [2026-04-09] 500 ao deletar transação de cartão de crédito

**Sintoma:** `DELETE /api/transactions/{id}` retornava HTTP 500 para transações originadas de importação de fatura.

**Causa:** O model `ImportItem` possui uma FK `transaction_id → transactions.id` sem `ondelete="SET NULL"`. Ao tentar deletar a `Transaction`, o banco lançava erro de integridade referencial porque o `ImportItem` ainda a referenciava.

**Fix:** Em `backend/app/crud.py:delete_transaction` — antes de deletar, anular o `transaction_id` nos `ImportItem` que apontam para a transação:

```python
db.query(models.ImportItem).filter(
    models.ImportItem.transaction_id == transaction_id
).update({"transaction_id": None}, synchronize_session=False)
```

**Arquivo alterado:** `backend/app/crud.py:443`
