import React, { useState } from 'react'
import { X, Check, AlertCircle } from 'lucide-react'
import { creditCardsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { monthShort, fullDate, statusInfo } from '../utils/statements'

const inputCls = "w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white text-sm"

/**
 * Pagamento total ou parcial de uma fatura.
 * `month` é uma entrada da linha do tempo (ou detalhe) com `statement`
 * ({id,total_amount,paid_amount,outstanding,status}), `reference_month` e `due_date`.
 */
export default function StatementPaymentModal({ account, month, accounts, currency, onClose, onPaid }) {
  const stmt = month?.statement ?? null
  const outstanding = stmt?.outstanding ?? 0
  const [form, setForm] = useState({
    from_account_id: '',
    amount: outstanding > 0 ? String(outstanding) : '',
    date: new Date().toISOString().slice(0, 10),
    description: `Pagamento da fatura ${monthShort(month?.reference_month)} ${account.name}`,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const submit = async () => {
    const amount = parseFloat(form.amount)
    if (!form.from_account_id || !form.date || Number.isNaN(amount) || amount <= 0) {
      setError('Preencha conta de origem, valor e data válidos')
      return
    }
    setSaving(true)
    setError('')
    try {
      await creditCardsAPI.payStatement(account.id, stmt.id, {
        from_account_id: parseInt(form.from_account_id),
        amount,
        date: form.date,
        description: form.description || null,
      })
      await onPaid?.()
      onClose()
    } catch (e) {
      setError(e.detail || 'Erro ao registrar pagamento')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111111] rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Pagar fatura</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors" aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {stmt && outstanding === 0 && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 text-sm">
              <Check size={18} /> Esta fatura já está totalmente quitada.
            </div>
          )}
          <div className="rounded-lg bg-zinc-50 dark:bg-[#1a1a1a] p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Cartão</p>
                <p className="font-semibold text-zinc-900 dark:text-white">{account.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Fatura {monthShort(month?.reference_month)}
                </p>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {stmt ? formatCurrency(stmt.total_amount, currency) : 'Sem fatura confirmada'}
                </p>
              </div>
            </div>
            {stmt?.paid_amount > 0 && (
              <div className="flex justify-between text-xs pt-1 border-t border-zinc-200 dark:border-white/[0.08]">
                <span className="text-zinc-500 dark:text-zinc-400">Já pago</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(stmt.paid_amount, currency)}</span>
              </div>
            )}
            {stmt && (
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">Saldo pendente</span>
                <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(outstanding, currency)}</span>
              </div>
            )}
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {stmt
                ? `${statusInfo(stmt.status).label}${month?.due_date ? ` · vence ${fullDate(month.due_date)}` : ''}`
                : 'Confirme a fatura antes de pagar'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="pay-from">Conta de origem</label>
            <select id="pay-from" value={form.from_account_id} onChange={e => set('from_account_id', e.target.value)} className={inputCls}>
              <option value="">Selecione a conta</option>
              {accounts
                .filter(acc => acc.is_active && acc.account_type !== 'credit_card')
                .map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="pay-amount">Valor</label>
              <input id="pay-amount" type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="pay-date">Data</label>
              <input id="pay-date" type="date" value={form.date} onChange={e => set('date', e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1" htmlFor="pay-desc">Descrição opcional</label>
            <input id="pay-desc" type="text" value={form.description} onChange={e => set('description', e.target.value)} className={inputCls} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-zinc-300 dark:border-white/[0.08] text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors">
              Cancelar
            </button>
            <button
              onClick={submit}
              disabled={saving || !stmt || outstanding === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors text-sm"
            >
              {saving
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check size={16} /> Confirmar pagamento</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
