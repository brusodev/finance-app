import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Plus, Settings, ChevronRight, Calendar,
  DollarSign, X, Check, AlertCircle, Trash2, History
} from 'lucide-react'
import { accountsAPI, creditCardsAPI } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const EMPTY_FORM = {
  // Conta
  name: '',
  currency: 'BRL',
  // Config
  bank_name: '',
  closing_day: '',
  due_day: '',
  credit_limit: '',
}

export default function CreditCards() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [accounts, setAccounts] = useState([])
  const [allAccounts, setAllAccounts] = useState([])
  const [configs, setConfigs] = useState({})
  const [latestBatches, setLatestBatches] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal unificado — mode: 'new' | 'edit'
  const [modal, setModal] = useState(null)   // null = fechado
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [paymentModal, setPaymentModal] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    from_account_id: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  })
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [historyModal, setHistoryModal] = useState(null) // { account, batches }
  const [historyLoading, setHistoryLoading] = useState(false)
  const [allBatches, setAllBatches] = useState({})

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const allAccounts = await accountsAPI.getAll()
      setAllAccounts(allAccounts)
      const creditAccounts = allAccounts.filter(
        a => a.account_type === 'credit_card' && a.is_active
      )
      setAccounts(creditAccounts)

      const cfgs = {}
      await Promise.all(
        creditAccounts.map(async (acc) => {
          try { cfgs[acc.id] = await creditCardsAPI.getConfig(acc.id) }
          catch { cfgs[acc.id] = null }
        })
      )
      setConfigs(cfgs)

      const batchEntries = await Promise.all(
        creditAccounts.map(async (acc) => {
          try {
            const batches = await creditCardsAPI.listBatches(acc.id)
            const latest = batches?.[0] ?? null
            const confirmed = batches?.find(b => b.status === 'confirmed') ?? null
            return [acc.id, { latest, confirmed }]
          } catch {
            return [acc.id, { latest: null, confirmed: null }]
          }
        })
      )
      setLatestBatches(Object.fromEntries(batchEntries))
    } catch {
      setError('Erro ao carregar cartões de crédito')
    } finally {
      setLoading(false)
    }
  }

  // ── Abrir modais ──────────────────────────────────────────
  const openNew = () => {
    setForm(EMPTY_FORM)
    setFormError('')
    setModal({ mode: 'new' })
  }

  const openEdit = (account) => {
    const cfg = configs[account.id]
    setForm({
      name: account.name,
      currency: account.currency,
      bank_name: cfg?.bank_name ?? '',
      closing_day: cfg?.closing_day ?? '',
      due_day: cfg?.due_day ?? '',
      credit_limit: cfg?.credit_limit ?? '',
    })
    setFormError('')
    setModal({ mode: 'edit', account })
  }

  // ── Validação ─────────────────────────────────────────────
  const validate = () => {
    if (!form.name.trim()) return 'Nome do cartão é obrigatório'
    const closing = parseInt(form.closing_day)
    const due = parseInt(form.due_day)
    if (!closing || closing < 1 || closing > 31)
      return 'Dia de fechamento inválido (1–31)'
    if (!due || due < 1 || due > 31)
      return 'Dia de vencimento inválido (1–31)'
    return null
  }

  // ── Salvar novo cartão (conta + config) ───────────────────
  const saveNew = async () => {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      const account = await accountsAPI.create({
        name: form.name.trim(),
        account_type: 'credit_card',
        initial_balance: 0,
        currency: form.currency,
      })
      await creditCardsAPI.createConfig(account.id, {
        account_id: account.id,
        closing_day: parseInt(form.closing_day),
        due_day: parseInt(form.due_day),
        bank_name: form.bank_name.trim() || null,
        credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      })
      await fetchData()
      setModal(null)
    } catch (e) {
      setFormError(e.detail || 'Erro ao criar cartão')
    } finally {
      setSaving(false)
    }
  }

  // ── Salvar edição (nome + config) ─────────────────────────
  const saveEdit = async () => {
    const err = validate()
    if (err) { setFormError(err); return }
    setSaving(true)
    setFormError('')
    try {
      const { account } = modal
      // Atualiza nome se mudou
      if (form.name.trim() !== account.name) {
        await accountsAPI.update(account.id, { name: form.name.trim() })
      }
      const configPayload = {
        account_id: account.id,
        closing_day: parseInt(form.closing_day),
        due_day: parseInt(form.due_day),
        bank_name: form.bank_name.trim() || null,
        credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      }
      if (configs[account.id]) {
        await creditCardsAPI.updateConfig(account.id, configPayload)
      } else {
        await creditCardsAPI.createConfig(account.id, configPayload)
      }
      await fetchData()
      setModal(null)
    } catch (e) {
      setFormError(e.detail || 'Erro ao salvar cartão')
    } finally {
      setSaving(false)
    }
  }

  // ── Excluir cartão ────────────────────────────────────────
  const deleteCard = async (account) => {
    if (!window.confirm(`Excluir o cartão "${account.name}"? Esta ação não pode ser desfeita.`))
      return
    try {
      await accountsAPI.delete(account.id)
      await fetchData()
    } catch {
      setError('Erro ao excluir cartão')
    }
  }

  const openPayModal = (account) => {
    const confirmedBatch = latestBatches[account.id]?.confirmed ?? null
    const outstanding = confirmedBatch?.statement
      ? Math.max(confirmedBatch.statement.total_amount - confirmedBatch.statement.paid_amount, 0)
      : (confirmedBatch?.total_amount ?? 0)
    setPaymentForm({
      from_account_id: '',
      amount: outstanding > 0 ? String(outstanding) : '',
      date: new Date().toISOString().slice(0, 10),
      description: `Pagamento da fatura ${account.name}`,
    })
    setPaymentError('')
    setPaymentModal({ account, batch: confirmedBatch })
  }

  const closePaymentModal = () => {
    setPaymentModal(null)
    setPaymentError('')
  }

  const openHistory = async (account) => {
    setHistoryLoading(true)
    setHistoryModal({ account, batches: [] })
    try {
      const batches = await creditCardsAPI.listBatches(account.id)
      setHistoryModal({ account, batches })
      setAllBatches(prev => ({ ...prev, [account.id]: batches }))
    } finally {
      setHistoryLoading(false)
    }
  }

  const goToBatch = (accountId, batchId) => {
    navigate(`/cartoes/${accountId}/importar`, { state: { batchId } })
  }

  const registerPayment = async () => {
    if (!paymentModal?.batch?.id) {
      setPaymentError('Nenhuma fatura confirmada disponível para pagamento')
      return
    }

    const amount = parseFloat(paymentForm.amount)
    if (!paymentForm.from_account_id || !paymentForm.date || Number.isNaN(amount) || amount <= 0) {
      setPaymentError('Preencha conta de origem, valor e data válidos')
      return
    }

    setPaymentSaving(true)
    setPaymentError('')
    try {
      await creditCardsAPI.registerPayment(paymentModal.account.id, paymentModal.batch.id, {
        from_account_id: parseInt(paymentForm.from_account_id),
        amount,
        date: paymentForm.date,
        description: paymentForm.description || null,
      })
      await fetchData()
      closePaymentModal()
    } catch (e) {
      setPaymentError(e.detail || 'Erro ao registrar pagamento')
    } finally {
      setPaymentSaving(false)
    }
  }

  const STATUS_LABELS = {
    open: 'Aberta',
    confirmed: 'Confirmada',
    paid: 'Paga',
    partial: 'Paga parcialmente',
  }
  const statusLabel = (s) => STATUS_LABELS[s] ?? s

  const f = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const inputCls = "w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">
          Cartões de Crédito
        </h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={18} />
          Novo Cartão
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Empty state */}
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <CreditCard size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            Nenhum cartão de crédito cadastrado
          </p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={16} /> Cadastrar primeiro cartão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map(account => {
            const cfg = configs[account.id]
            const latestBatch = latestBatches[account.id]?.latest ?? null
            return (
              <div
                key={account.id}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                {/* Card visual */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-blue-100 text-xs font-medium uppercase tracking-wide mb-1">
                        {cfg?.bank_name || 'Cartão de crédito'}
                      </p>
                      <h3 className="font-bold text-lg leading-tight">{account.name}</h3>
                    </div>
                    <CreditCard size={28} className="text-blue-200 flex-shrink-0" />
                  </div>
                  <div className="mt-4">
                    <p className="text-blue-200 text-xs mb-1">Saldo atual</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(account.balance, user?.currency)}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  {cfg ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Fechamento</p>
                        <p className="font-semibold text-zinc-800 dark:text-white flex items-center gap-1">
                          <Calendar size={14} className="text-blue-500" />
                          Dia {cfg.closing_day}
                        </p>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Vencimento</p>
                        <p className="font-semibold text-zinc-800 dark:text-white flex items-center gap-1">
                          <Calendar size={14} className="text-red-500" />
                          Dia {cfg.due_day}
                        </p>
                      </div>
                      {cfg.credit_limit && (
                        <div className="col-span-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Limite</p>
                          <p className="font-semibold text-zinc-800 dark:text-white flex items-center gap-1">
                            <DollarSign size={14} className="text-green-500" />
                            {formatCurrency(cfg.credit_limit, user?.currency)}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-amber-700 dark:text-amber-400 text-sm">
                      <AlertCircle size={16} />
                      Configure fechamento e vencimento
                    </div>
                  )}

                  {latestBatch && (
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Última fatura</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-white capitalize">
                            {statusLabel(latestBatch.statement?.status ?? latestBatch.status)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total</p>
                          <p className="text-sm font-semibold text-zinc-800 dark:text-white">
                            {formatCurrency(latestBatch.statement?.total_amount ?? latestBatch.total_amount ?? 0, user?.currency)}
                          </p>
                        </div>
                      </div>
                      {latestBatch.statement?.paid_amount > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
                          <span className="text-zinc-500 dark:text-zinc-400">Pendente</span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {formatCurrency(
                              Math.max(latestBatch.statement.total_amount - latestBatch.statement.paid_amount, 0),
                              user?.currency
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      onClick={() => deleteCard(account)}
                      className="p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Excluir cartão"
                    >
                      <Trash2 size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(account)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Settings size={15} />
                      Editar
                    </button>
                    <button
                      onClick={() => openHistory(account)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <History size={15} />
                      Histórico
                    </button>
                    <button
                      onClick={() => navigate(`/cartoes/${account.id}/importar`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus size={15} />
                      Importar fatura
                      <ChevronRight size={15} />
                    </button>
                    {(() => {
                      const batch = latestBatches[account.id]?.confirmed ?? null
                      const pending = batch?.statement
                        ? Math.max(batch.statement.total_amount - batch.statement.paid_amount, 0)
                        : (batch?.total_amount ?? 0)
                      const isFullyPaid = batch && pending === 0
                      return (
                        <button
                          onClick={() => !isFullyPaid && openPayModal(account)}
                          disabled={isFullyPaid}
                          title={isFullyPaid ? 'Fatura já quitada' : undefined}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                            isFullyPaid
                              ? 'border border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                              : 'border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                          }`}
                        >
                          {isFullyPaid ? <Check size={15} /> : null}
                          {isFullyPaid ? 'Fatura quitada' : 'Pagar fatura'}
                          {!isFullyPaid && <ChevronRight size={15} />}
                        </button>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal unificado (novo / editar) ── */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">
                {modal.mode === 'new' ? 'Novo cartão de crédito' : 'Editar cartão'}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Seção: dados do cartão */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Dados do cartão
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Nome do cartão *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => f('name', e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Nubank, Inter Black, C6…"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Banco / Emissor
                    </label>
                    <input
                      type="text"
                      value={form.bank_name}
                      onChange={e => f('bank_name', e.target.value)}
                      className={inputCls}
                      placeholder="Ex: Nubank, Itaú, Bradesco, XP…"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Moeda
                    </label>
                    <select
                      value={form.currency}
                      onChange={e => f('currency', e.target.value)}
                      className={inputCls}
                    >
                      <option value="BRL">BRL — Real brasileiro</option>
                      <option value="USD">USD — Dólar americano</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Seção: fatura */}
              <div>
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
                  Fatura
                </p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Fechamento * <span className="text-zinc-400 font-normal">(dia)</span>
                      </label>
                      <input
                        type="number"
                        min="1" max="31"
                        value={form.closing_day}
                        onChange={e => f('closing_day', e.target.value)}
                        className={inputCls}
                        placeholder="Ex: 10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Vencimento * <span className="text-zinc-400 font-normal">(dia)</span>
                      </label>
                      <input
                        type="number"
                        min="1" max="31"
                        value={form.due_day}
                        onChange={e => f('due_day', e.target.value)}
                        className={inputCls}
                        placeholder="Ex: 17"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Limite de crédito
                    </label>
                    <input
                      type="number"
                      min="0" step="0.01"
                      value={form.credit_limit}
                      onChange={e => f('credit_limit', e.target.value)}
                      className={inputCls}
                      placeholder="Ex: 5000"
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setModal(null)}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={modal.mode === 'new' ? saveNew : saveEdit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors text-sm"
              >
                {saving
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Check size={16} /> {modal.mode === 'new' ? 'Criar cartão' : 'Salvar'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-zinc-800 dark:text-white">Histórico de faturas</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{historyModal.account.name}</p>
              </div>
              <button
                onClick={() => setHistoryModal(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : historyModal.batches.length === 0 ? (
                <p className="text-center text-zinc-500 dark:text-zinc-400 py-8">Nenhuma fatura encontrada</p>
              ) : (
                <div className="space-y-2">
                  {historyModal.batches.map(batch => {
                    const refDate = new Date(batch.reference_month + 'T12:00:00')
                    const monthLabel = refDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    const stmt = batch.statement
                    const statusMap = {
                      open: { label: 'Aberta', cls: 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300' },
                      confirmed: { label: 'Confirmada', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
                      paid: { label: 'Paga', cls: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
                      partial: { label: 'Parcial', cls: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
                      cancelled: { label: 'Cancelada', cls: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' },
                    }
                    const statusKey = stmt?.status ?? batch.status
                    const { label: statusLabel, cls: statusCls } = statusMap[statusKey] ?? statusMap.open
                    const total = stmt?.total_amount ?? batch.total_amount ?? 0
                    const paid = stmt?.paid_amount ?? 0
                    const pending = Math.max(total - paid, 0)

                    return (
                      <button
                        key={batch.id}
                        onClick={() => goToBatch(historyModal.account.id, batch.id)}
                        className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-zinc-800 dark:text-white capitalize">{monthLabel}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCls}`}>{statusLabel}</span>
                          </div>
                          {stmt?.due_date && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              Venc. {new Date(stmt.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}
                          {paid > 0 && pending > 0 && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                              Pendente: {formatCurrency(pending, user?.currency)}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <p className="font-semibold text-zinc-800 dark:text-white">
                              {formatCurrency(total, user?.currency)}
                            </p>
                            {paid > 0 && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Pago: {formatCurrency(paid, user?.currency)}
                              </p>
                            )}
                          </div>
                          <ChevronRight size={16} className="text-zinc-400" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-800 dark:text-white">
                Pagar fatura
              </h2>
              <button
                onClick={closePaymentModal}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {(() => {
                const pending = paymentModal.batch?.statement
                  ? Math.max(paymentModal.batch.statement.total_amount - paymentModal.batch.statement.paid_amount, 0)
                  : (paymentModal.batch?.total_amount ?? 0)
                if (paymentModal.batch && pending === 0) {
                  return (
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-700 dark:text-green-400 text-sm">
                      <Check size={18} /> Esta fatura já está totalmente quitada.
                    </div>
                  )
                }
                return null
              })()}
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Cartão</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">{paymentModal.account.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Fatura total</p>
                    <p className="font-semibold text-zinc-900 dark:text-white">
                      {paymentModal.batch
                        ? formatCurrency(paymentModal.batch.statement?.total_amount ?? paymentModal.batch.total_amount ?? 0, user?.currency)
                        : 'Sem fatura confirmada'}
                    </p>
                  </div>
                </div>
                {paymentModal.batch?.statement && paymentModal.batch.statement.paid_amount > 0 && (
                  <div className="flex justify-between text-xs pt-1 border-t border-zinc-200 dark:border-zinc-700">
                    <span className="text-zinc-500 dark:text-zinc-400">Já pago</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(paymentModal.batch.statement.paid_amount, user?.currency)}
                    </span>
                  </div>
                )}
                {paymentModal.batch?.statement && (
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">Saldo pendente</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(
                        Math.max(paymentModal.batch.statement.total_amount - paymentModal.batch.statement.paid_amount, 0),
                        user?.currency
                      )}
                    </span>
                  </div>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {paymentModal.batch
                    ? `Status: ${statusLabel(paymentModal.batch.statement?.status ?? paymentModal.batch.status)}`
                    : 'Confirme a fatura antes de pagar'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Conta de origem
                </label>
                <select
                  value={paymentForm.from_account_id}
                  onChange={e => setPaymentForm(prev => ({ ...prev, from_account_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Selecione a conta</option>
                  {allAccounts
                    .filter(acc => acc.is_active && acc.account_type !== 'credit_card')
                    .map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Descrição opcional
                </label>
                <input
                  type="text"
                  value={paymentForm.description}
                  onChange={e => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {paymentError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={16} /> {paymentError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closePaymentModal}
                  className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={registerPayment}
                  disabled={paymentSaving || !paymentModal.batch || (() => {
                    const pending = paymentModal.batch?.statement
                      ? Math.max(paymentModal.batch.statement.total_amount - paymentModal.batch.statement.paid_amount, 0)
                      : (paymentModal.batch?.total_amount ?? 0)
                    return pending === 0
                  })()}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors text-sm"
                >
                  {paymentSaving
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><Check size={16} /> Confirmar pagamento</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
