import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  Upload, Plus, Check, X, ChevronLeft, FileText,
  Pencil, Trash2, AlertCircle, CheckCircle2, Clock,
  CreditCard, Calendar
} from 'lucide-react'
import { creditCardsAPI, accountsAPI, categoriesAPI } from '../services/api'
import { formatCurrency, formatDateLocal } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

// ─── helpers ────────────────────────────────────────────────
const STATUS_LABEL = {
  pending: 'Pendente',
  reviewed: 'Revisado',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
}

const STATUS_COLOR = {
  pending: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  reviewed: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  confirmed: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  cancelled: 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
}

const STATEMENT_LABEL = {
  open: 'Em aberto',
  partial: 'Parcial',
  paid: 'Pago',
  cancelled: 'Cancelada',
}

const STATEMENT_COLOR = {
  open: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  partial: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  paid: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
  cancelled: 'text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800',
}

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    opts.push({ val, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return opts
}

// ─── Main component ─────────────────────────────────────────
export default function CreditCardImport() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const fileRef = useRef(null)

  const [account, setAccount] = useState(null)
  const [allAccounts, setAllAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // New batch form
  const [newBatchMode, setNewBatchMode] = useState(null) // 'manual' | 'upload'
  const [refMonth, setRefMonth] = useState(monthOptions()[0].val)
  const [uploadFile, setUploadFile] = useState(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Item editing
  const [editingItem, setEditingItem] = useState(null) // item object
  const [editForm, setEditForm] = useState({})
  const [savingItem, setSavingItem] = useState(false)

  // Manual item form
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [newItem, setNewItem] = useState({
    description: '', amount: '', date: '', category_id: '',
    installment_current: '', installment_total: '',
  })
  const [addingItem, setAddingItem] = useState(false)

  // Confirm
  const [confirming, setConfirming] = useState(false)
  const [confirmResult, setConfirmResult] = useState(null)

  // Statement payment
  const [paymentForm, setPaymentForm] = useState({
    from_account_id: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
  })
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentSuccess, setPaymentSuccess] = useState('')

  useEffect(() => {
    fetchInitial()
  }, [accountId])

  useEffect(() => {
    if (selectedBatch || batches.length === 0) return

    if (location.state?.batchId) {
      const target = batches.find(b => b.id === location.state.batchId)
      if (target) fetchBatch(target.id)
      return
    }

    if (location.state?.openLatestStatement) {
      const latestConfirmed = batches.find(batch => batch.status === 'confirmed') ?? batches[0]
      if (latestConfirmed) fetchBatch(latestConfirmed.id)
    }
  }, [location.state, batches, selectedBatch])

  const fetchInitial = async () => {
    try {
      setLoading(true)
      setError('')
      const [accountsData, cats, batchList] = await Promise.all([
        accountsAPI.getAll(),
        categoriesAPI.getAll(),
        creditCardsAPI.listBatches(accountId),
      ])
      const acc = accountsData.find(a => String(a.id) === String(accountId))
      if (!acc) {
        setError('Cartão não encontrado')
        return
      }
      setAccount(acc)
      setAllAccounts(accountsData)
      setCategories(cats)
      setBatches(batchList)
    } catch {
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const fetchBatch = async (batchId) => {
    try {
      const b = await creditCardsAPI.getBatch(accountId, batchId)
      setSelectedBatch(b)
      setBatches(prev =>
        prev.map(x => x.id === b.id
          ? { ...x, status: b.status, item_count: b.items.length }
          : x
        )
      )
    } catch {
      setError('Erro ao carregar lote')
    }
  }

  // ── Create batch ──────────────────────────────────────────
  const createManualBatch = async () => {
    setCreateError('')
    setCreating(true)
    try {
      const batch = await creditCardsAPI.createManualBatch(accountId, {
        account_id: parseInt(accountId),
        reference_month: refMonth,
      })
      setBatches(prev => [{ ...batch, item_count: 0, total_amount: 0 }, ...prev])
      setSelectedBatch({ ...batch, items: [] })
      setNewBatchMode(null)
    } catch (err) {
      setCreateError(err.detail || 'Erro ao criar lote')
    } finally {
      setCreating(false)
    }
  }

  const uploadBatch = async () => {
    if (!uploadFile) { setCreateError('Selecione um arquivo'); return }
    setCreateError('')
    setCreating(true)
    try {
      const batch = await creditCardsAPI.uploadBatch(accountId, refMonth, uploadFile)
      setBatches(prev => [{
        ...batch,
        item_count: batch.items?.length ?? 0,
        total_amount: batch.items?.reduce((s, i) => s + Math.abs(i.amount), 0) ?? 0,
      }, ...prev])
      setSelectedBatch(batch)
      setNewBatchMode(null)
      setUploadFile(null)
    } catch (err) {
      setCreateError(err.detail || 'Erro ao processar arquivo')
    } finally {
      setCreating(false)
    }
  }

  // ── Item editing ──────────────────────────────────────────
  const startEdit = (item) => {
    setEditingItem(item)
    setEditForm({
      description: item.description ?? '',
      amount: String(Math.abs(item.amount)),
      date: item.date,
      category_id: item.category_id ?? '',
      installment_current: item.installment_current ?? '',
      installment_total: item.installment_total ?? '',
    })
  }

  const saveEdit = async () => {
    setSavingItem(true)
    try {
      const parsedAmount = parseFloat(editForm.amount)
      if (!editForm.date || isNaN(parsedAmount)) {
        alert('Preencha uma data e um valor válidos')
        setSavingItem(false)
        return
      }
      const payload = {
        description: editForm.description || null,
        amount: parsedAmount,
        date: editForm.date || null,
        category_id: editForm.category_id ? parseInt(editForm.category_id) : null,
        installment_current: editForm.installment_current
          ? parseInt(editForm.installment_current) : null,
        installment_total: editForm.installment_total
          ? parseInt(editForm.installment_total) : null,
      }
      await creditCardsAPI.updateItem(accountId, selectedBatch.id, editingItem.id, payload)
      await fetchBatch(selectedBatch.id)
      setEditingItem(null)
    } catch (err) {
      alert(err.detail || 'Erro ao salvar item')
    } finally {
      setSavingItem(false)
    }
  }

  const toggleIgnore = async (item) => {
    const newStatus = item.status === 'ignored' ? 'pending' : 'ignored'
    try {
      await creditCardsAPI.updateItem(accountId, selectedBatch.id, item.id, { status: newStatus })
      await fetchBatch(selectedBatch.id)
    } catch (err) {
      alert(err.detail || 'Erro ao atualizar item')
    }
  }

  // ── Add manual item ───────────────────────────────────────
  const addItem = async () => {
    if (!newItem.description || !newItem.amount || !newItem.date) {
      alert('Preencha descrição, valor e data')
      return
    }
    setAddingItem(true)
    try {
      await creditCardsAPI.addItem(accountId, selectedBatch.id, {
        description: newItem.description,
        amount: parseFloat(newItem.amount),
        date: newItem.date,
        category_id: newItem.category_id ? parseInt(newItem.category_id) : null,
        installment_current: newItem.installment_current
          ? parseInt(newItem.installment_current) : null,
        installment_total: newItem.installment_total
          ? parseInt(newItem.installment_total) : null,
      })
      await fetchBatch(selectedBatch.id)
      setNewItem({
        description: '', amount: '', date: '', category_id: '',
        installment_current: '', installment_total: '',
      })
      setAddItemOpen(false)
    } catch (err) {
      alert(err.detail || 'Erro ao adicionar item')
    } finally {
      setAddingItem(false)
    }
  }

  // ── Confirm ───────────────────────────────────────────────
  const confirmBatch = async () => {
    if (!window.confirm(
      'Confirmar todos os itens pendentes? Eles serão salvos como transações.'
    )) return
    setConfirming(true)
    setConfirmResult(null)
    try {
      const result = await creditCardsAPI.confirmBatch(accountId, selectedBatch.id)
      setConfirmResult(result)
      await fetchBatch(selectedBatch.id)
    } catch (err) {
      alert(err.detail || 'Erro ao confirmar lote')
    } finally {
      setConfirming(false)
    }
  }

  const registerPayment = async () => {
    if (!selectedBatch?.statement) {
      setPaymentError('Confirme a fatura antes de registrar pagamentos')
      return
    }

    const amount = parseFloat(paymentForm.amount)
    if (!paymentForm.from_account_id || !paymentForm.date || Number.isNaN(amount) || amount <= 0) {
      setPaymentError('Preencha conta de origem, valor e data válidos')
      return
    }

    setPaying(true)
    setPaymentError('')
    setPaymentSuccess('')

    try {
      await creditCardsAPI.registerPayment(accountId, selectedBatch.id, {
        from_account_id: parseInt(paymentForm.from_account_id),
        amount,
        date: paymentForm.date,
        description: paymentForm.description || null,
      })
      setPaymentSuccess('Pagamento registrado com sucesso')
      setPaymentForm(prev => ({
        ...prev,
        amount: '',
        description: '',
      }))
      await fetchBatch(selectedBatch.id)
    } catch (err) {
      setPaymentError(err.detail || 'Erro ao registrar pagamento')
    } finally {
      setPaying(false)
    }
  }

  const cancelBatch = async () => {
    if (!window.confirm('Cancelar este lote? Os itens serão descartados.')) return
    try {
      await creditCardsAPI.cancelBatch(accountId, selectedBatch.id)
      await fetchBatch(selectedBatch.id)
    } catch (err) {
      alert(err.detail || 'Erro ao cancelar lote')
    }
  }

  // ── Render helpers ────────────────────────────────────────
  const pendingCount = selectedBatch?.items?.filter(i => i.status === 'pending').length ?? 0
  const ignoredCount = selectedBatch?.items?.filter(i => i.status === 'ignored').length ?? 0
  const totalPending = selectedBatch?.items
    ?.filter(i => i.status !== 'ignored')
    .reduce((s, i) => s + Math.abs(i.amount), 0) ?? 0
  const statement = selectedBatch?.statement ?? null
  const statementTotal = statement?.total_amount ?? totalPending
  const statementPaid = statement?.paid_amount ?? 0
  const statementOutstanding = statement
    ? Math.max(statementTotal - statementPaid, 0)
    : 0
  const fundingAccounts = allAccounts.filter(acc => acc.is_active && acc.account_type !== 'credit_card')

  const isFrozen = ['confirmed', 'cancelled'].includes(selectedBatch?.status)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/cartoes')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          <ChevronLeft size={18} /> Voltar
        </button>
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle size={18} /> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/cartoes')}
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
            <CreditCard size={24} className="text-blue-600" />
            {account?.name}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Importação e revisão de faturas
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Left: Batches list ─────────────────────────── */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-800 dark:text-white">Faturas</h2>
            {!newBatchMode && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setNewBatchMode('upload'); setCreateError('') }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Upload size={13} /> Upload
                </button>
                <button
                  onClick={() => { setNewBatchMode('manual'); setCreateError('') }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Plus size={13} /> Manual
                </button>
              </div>
            )}
          </div>

          {/* New batch form */}
          {newBatchMode && (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {newBatchMode === 'upload' ? 'Upload de arquivo' : 'Lançamento manual'}
              </p>

              <div>
                <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                  Mês de referência
                </label>
                <select
                  value={refMonth}
                  onChange={e => setRefMonth(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {monthOptions().map(o => (
                    <option key={o.val} value={o.val}>{o.label}</option>
                  ))}
                </select>
              </div>

              {newBatchMode === 'upload' && (
                <div>
                  <label className="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">
                    Arquivo CSV ou OFX
                  </label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  >
                    {uploadFile ? (
                      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <FileText size={16} />
                        <span className="text-sm font-medium">{uploadFile.name}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 dark:text-zinc-500">
                        Clique para selecionar
                      </p>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.ofx,.qfx"
                    className="hidden"
                    onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              {createError && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <AlertCircle size={14} /> {createError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setNewBatchMode(null); setUploadFile(null); setCreateError('') }}
                  className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={newBatchMode === 'upload' ? uploadBatch : createManualBatch}
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                >
                  {creating
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : newBatchMode === 'upload' ? <><Upload size={13} /> Processar</> : <><Plus size={13} /> Criar</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* Batch list */}
          {batches.length === 0 && !newBatchMode ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 text-center text-zinc-400 dark:text-zinc-500 text-sm">
              Nenhuma fatura ainda
            </div>
          ) : (
            batches.map(b => (
              <button
                key={b.id}
                onClick={() => fetchBatch(b.id)}
                className={`w-full text-left bg-white dark:bg-zinc-900 rounded-xl border p-4 transition-colors hover:border-blue-400 dark:hover:border-blue-500 ${
                  selectedBatch?.id === b.id
                    ? 'border-blue-500 dark:border-blue-500'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-zinc-800 dark:text-white text-sm">
                      {new Date(b.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', {
                        month: 'long', year: 'numeric'
                      })}
                    </p>
                    {b.file_name && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                        <FileText size={11} /> {b.file_name}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[b.status] ?? STATUS_COLOR.pending}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{b.item_count} itens</span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(b.total_amount, user?.currency)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* ─── Right: Batch detail ────────────────────────── */}
        <div className="lg:col-span-2">
          {!selectedBatch ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-zinc-400 dark:text-zinc-500">
              <Calendar size={40} className="mx-auto mb-3 opacity-40" />
              <p>Selecione uma fatura para revisar</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Batch header */}
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-zinc-800 dark:text-white">
                    {new Date(selectedBatch.reference_month + 'T12:00:00').toLocaleDateString('pt-BR', {
                      month: 'long', year: 'numeric'
                    })}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[selectedBatch.status]}`}>
                      {STATUS_LABEL[selectedBatch.status]}
                    </span>
                    <span>{pendingCount} pendentes · {ignoredCount} ignorados</span>
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Total: {formatCurrency(totalPending, user?.currency)}
                    </span>
                  </div>
                </div>

                {!isFrozen && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddItemOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Plus size={15} /> Item
                    </button>
                    <button
                      onClick={cancelBatch}
                      className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <X size={15} /> Cancelar
                    </button>
                    <button
                      onClick={confirmBatch}
                      disabled={confirming || pendingCount === 0}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      {confirming
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Check size={15} /> Confirmar</>
                      }
                    </button>
                  </div>
                )}
              </div>

              {/* Confirm result banner */}
              {confirmResult && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 flex items-center gap-2 text-green-700 dark:text-green-400 text-sm">
                  <CheckCircle2 size={18} />
                  <span>
                    {confirmResult.confirmed_count} transações criadas
                    {confirmResult.ignored_count > 0 && `, ${confirmResult.ignored_count} ignorados`}.
                  </span>
                </div>
              )}

              {/* Fatura / pagamento */}
              {statement ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Resumo da fatura
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${STATEMENT_COLOR[statement.status] ?? STATEMENT_COLOR.open}`}>
                          {STATEMENT_LABEL[statement.status] ?? statement.status}
                        </span>
                        <span>Total: {formatCurrency(statementTotal, user?.currency)}</span>
                        <span>Pago: {formatCurrency(statementPaid, user?.currency)}</span>
                        <span>Em aberto: {formatCurrency(statementOutstanding, user?.currency)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setPaymentForm(prev => ({
                        ...prev,
                        amount: statementOutstanding > 0 ? String(statementOutstanding) : prev.amount,
                      }))}
                      disabled={statementOutstanding <= 0}
                      className="px-3 py-2 text-xs border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                    >
                      Usar saldo total
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <select
                      value={paymentForm.from_account_id}
                      onChange={e => setPaymentForm(prev => ({ ...prev, from_account_id: e.target.value }))}
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="">Conta de origem</option>
                      {fundingAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="Valor"
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={paymentForm.date}
                      onChange={e => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={paymentForm.description}
                      onChange={e => setPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição opcional"
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={registerPayment}
                      disabled={paying || statementOutstanding <= 0}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                    >
                      {paying
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Check size={14} /> Registrar pagamento</>
                      }
                    </button>
                    {paymentError && (
                      <span className="text-sm text-red-600 dark:text-red-400">{paymentError}</span>
                    )}
                    {paymentSuccess && (
                      <span className="text-sm text-green-600 dark:text-green-400">{paymentSuccess}</span>
                    )}
                  </div>

                  {statement.payments?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Pagamentos registrados
                      </p>
                      <div className="space-y-2">
                        {statement.payments.map(payment => (
                          <div
                            key={payment.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                          >
                            <div className="text-zinc-700 dark:text-zinc-300">
                              <span className="font-medium">
                                {payment.from_account?.name || 'Conta de origem'}
                              </span>
                              <span className="mx-2 text-zinc-400">•</span>
                              <span>{formatDateLocal(payment.date)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 dark:text-zinc-400">
                                {payment.description || 'Pagamento da fatura'}
                              </span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(payment.amount, user?.currency)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedBatch.status === 'confirmed' ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400">
                  Fatura confirmada, mas ainda não há resumo financeiro carregado.
                </div>
              ) : null}

              {/* Add item form */}
              {addItemOpen && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Novo item manual
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      placeholder="Descrição *"
                      value={newItem.description}
                      onChange={e => setNewItem(f => ({ ...f, description: e.target.value }))}
                      className="col-span-2 sm:col-span-2 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Valor *"
                      min="0"
                      step="0.01"
                      value={newItem.amount}
                      onChange={e => setNewItem(f => ({ ...f, amount: e.target.value }))}
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                    <input
                      type="date"
                      value={newItem.date}
                      onChange={e => setNewItem(f => ({ ...f, date: e.target.value }))}
                      className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                    <select
                      value={newItem.category_id}
                      onChange={e => setNewItem(f => ({ ...f, category_id: e.target.value }))}
                      className="col-span-2 sm:col-span-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="">Sem categoria</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                      <input
                        type="number"
                        placeholder="Parcela"
                        min="1"
                        value={newItem.installment_current}
                        onChange={e => setNewItem(f => ({ ...f, installment_current: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                      <span className="text-zinc-400">/</span>
                      <input
                        type="number"
                        placeholder="Total"
                        min="1"
                        value={newItem.installment_total}
                        onChange={e => setNewItem(f => ({ ...f, installment_total: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddItemOpen(false)}
                      className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={addItem}
                      disabled={addingItem}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                    >
                      {addingItem
                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><Plus size={14} /> Adicionar</>
                      }
                    </button>
                  </div>
                </div>
              )}

              {/* Items list */}
              {selectedBatch.items?.length === 0 ? (
                <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">
                  Nenhum item neste lote
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {selectedBatch.items.map(item => (
                    <div
                      key={item.id}
                      className={`p-4 transition-colors ${
                        item.status === 'ignored'
                          ? 'opacity-40'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {editingItem?.id === item.id ? (
                        /* Edit form inline */
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Descrição"
                              className="col-span-2 px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            />
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.amount}
                              onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                              className="px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            />
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                              className="px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            />
                            <select
                              value={editForm.category_id}
                              onChange={e => setEditForm(f => ({ ...f, category_id: e.target.value }))}
                              className="col-span-2 sm:col-span-1 px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                            >
                              <option value="">Sem categoria</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                              <input
                                type="number"
                                placeholder="Parc."
                                min="1"
                                value={editForm.installment_current}
                                onChange={e => setEditForm(f => ({ ...f, installment_current: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              />
                              <span className="text-zinc-400 flex-shrink-0">/</span>
                              <input
                                type="number"
                                placeholder="Total"
                                min="1"
                                value={editForm.installment_total}
                                onChange={e => setEditForm(f => ({ ...f, installment_total: e.target.value }))}
                                className="w-full px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={savingItem}
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg transition-colors"
                            >
                              {savingItem
                                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <><Check size={13} /> Salvar</>
                              }
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display row */
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">
                                {item.description || item.raw_description || '—'}
                              </p>
                              {item.installment_current && item.installment_total && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                                  {item.installment_current}/{item.installment_total}
                                </span>
                              )}
                              {item.status === 'confirmed' && (
                                <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              <span>{formatDateLocal(item.date)}</span>
                              {item.category && (
                                <>
                                  <span>·</span>
                                  <span>{item.category.name}</span>
                                </>
                              )}
                              {!item.category && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-500 dark:text-amber-400">
                                    Sem categoria
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <span className="font-semibold text-red-600 dark:text-red-400 text-sm flex-shrink-0">
                            {formatCurrency(Math.abs(item.amount), user?.currency)}
                          </span>

                          {!isFrozen && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => toggleIgnore(item)}
                                className={`p-1.5 rounded-md transition-colors ${
                                  item.status === 'ignored'
                                    ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                    : 'text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                                title={item.status === 'ignored' ? 'Restaurar' : 'Ignorar'}
                              >
                                {item.status === 'ignored'
                                  ? <Clock size={14} />
                                  : <Trash2 size={14} />
                                }
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
