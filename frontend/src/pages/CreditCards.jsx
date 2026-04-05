import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Plus, Settings, ChevronRight, Calendar,
  DollarSign, X, Check, AlertCircle, Trash2
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
  const [configs, setConfigs] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal unificado — mode: 'new' | 'edit'
  const [modal, setModal] = useState(null)   // null = fechado
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const allAccounts = await accountsAPI.getAll()
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

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
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
                      onClick={() => navigate(`/cartoes/${account.id}/importar`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Plus size={15} />
                      Importar fatura
                      <ChevronRight size={15} />
                    </button>
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
    </div>
  )
}
