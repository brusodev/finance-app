import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, CreditCard, LineChart, Plus, ChevronRight
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { accountsAPI, transactionsAPI } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
]

const EXPENSE_COLOR = '#ef4444'

const ACCOUNT_ICONS = {
  checking: Wallet,
  savings: Wallet,
  credit_card: CreditCard,
  investment: LineChart,
}

const ACCOUNT_TYPE_LABELS = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de Crédito',
  investment: 'Investimento',
}

const fmtPct = (v, digits = 1) => `${v.toFixed(digits).replace('.', ',')}%`

function DeltaBadge({ current, previous, invert = false, currency, mode = 'percent' }) {
  if (previous == null) return null
  const diff = current - previous
  if (mode === 'percent' && previous === 0) return null
  const up = diff >= 0
  const good = invert ? !up : up
  const cls = good ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  const display = mode === 'percent'
    ? fmtPct(Math.abs((diff / Math.abs(previous)) * 100))
    : formatCurrency(Math.abs(diff), currency)
  return (
    <p className={`text-xs mt-1 flex items-center gap-0.5 ${cls}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      <span className="font-medium">{display}</span>
      <span className="text-zinc-500 dark:text-zinc-400 ml-0.5">vs mês anterior</span>
    </p>
  )
}

function DailySpendChart({ days, currency }) {
  const max = Math.max(1, ...days.map(d => d.total))
  const totalSpent = days.reduce((s, d) => s + d.total, 0)
  const avg = days.length > 0 ? totalSpent / days.length : 0

  return (
    <div>
      <div className="flex items-end gap-[3px] h-28 sm:h-32 border-b border-zinc-200 dark:border-white/[0.06]">
        {days.map((d, i) => {
          const tipPos = i < 4
            ? 'left-0'
            : i > days.length - 5
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2'
          return (
            <div key={d.day} className="group relative flex-1 h-full flex items-end justify-center">
              <div className={`pointer-events-none absolute bottom-full ${tipPos} mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] shadow-lg px-2.5 py-1.5 text-xs`}>
                <span className="text-zinc-500 dark:text-zinc-400">dia {d.day} · </span>
                <span className="font-semibold text-zinc-800 dark:text-white">{formatCurrency(d.total, currency)}</span>
              </div>
              <div
                className="w-full max-w-[14px] rounded-t transition-all duration-300 group-hover:opacity-80"
                style={{
                  height: d.total > 0 ? `${Math.max((d.total / max) * 100, 2)}%` : '2px',
                  backgroundColor: d.total > 0 ? EXPENSE_COLOR : 'rgba(255,255,255,0.06)',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-[3px] mt-1">
        {days.map(d => (
          <span key={d.day} className="flex-1 text-center text-[10px] text-zinc-500 dark:text-zinc-400">
            {(d.day === 1 || d.day % 5 === 0) ? d.day : ''}
          </span>
        ))}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
        Média de {formatCurrency(avg, currency)}/dia até agora
      </p>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [summary, setSummary] = useState(null)
  const [prevPeriod, setPrevPeriod] = useState(null)
  const [topCategories, setTopCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [dailySpend, setDailySpend] = useState([])

  const { user } = useAuth()
  const navigate = useNavigate()

  const now = new Date()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      const year = now.getFullYear()
      const monthIdx = now.getMonth()
      const month = String(monthIdx + 1).padStart(2, '0')
      const startDate = `${year}-${month}-01`
      const lastDay = new Date(year, monthIdx + 1, 0).getDate()
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

      const prev = new Date(year, monthIdx - 1, 1)
      const prevYear = prev.getFullYear()
      const prevMonth = String(prev.getMonth() + 1).padStart(2, '0')
      const prevStart = `${prevYear}-${prevMonth}-01`
      const prevLastDay = new Date(prevYear, prev.getMonth() + 1, 0).getDate()
      const prevEnd = `${prevYear}-${prevMonth}-${String(prevLastDay).padStart(2, '0')}`

      const fetchOpts = { headers: { 'Content-Type': 'application/json' }, credentials: 'include' }

      const [summaryRes, prevRes, categoryRes, accountsData, allTransactions] = await Promise.all([
        fetch(`${API_URL}/dashboard/summary?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        fetch(`${API_URL}/transactions/totals/by-period?start=${prevStart}&end=${prevEnd}`, fetchOpts),
        fetch(`${API_URL}/transactions/totals/by-category?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        accountsAPI.getAll(),
        transactionsAPI.getAll(false, 5000),
      ])

      if (!summaryRes.ok || !prevRes.ok || !categoryRes.ok) {
        throw new Error('Erro ao carregar dashboard')
      }

      const summaryData = await summaryRes.json()
      const prevData = await prevRes.json()
      const categories = await categoryRes.json()

      // Série de gasto diário do mês (só despesas, do dia 1 até hoje)
      const today = now.getDate()
      const byDay = Array.from({ length: today }, (_, i) => ({ day: i + 1, total: 0 }))
      allTransactions.forEach(t => {
        if (t.transaction_type !== 'expense') return
        if (t.date < startDate || t.date > endDate) return
        const day = parseInt(t.date.split('-')[2])
        if (day >= 1 && day <= today) byDay[day - 1].total += Math.abs(t.amount)
      })

      setSummary(summaryData)
      setPrevPeriod(prevData)
      setTopCategories(
        categories
          .filter(c => Math.abs(c.total_expense) > 0)
          .sort((a, b) => Math.abs(b.total_expense) - Math.abs(a.total_expense))
          .slice(0, 5)
      )
      setAccounts(accountsData)
      setDailySpend(byDay)
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Erro ao carregar dados'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Carregando dados">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = (user?.full_name || user?.username || '').split(' ')[0]
  const dateLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const stats = summary?.stats
  const balance = stats?.total_balance ?? 0
  const totalIncome = stats?.total_income ?? 0
  const totalExpense = stats?.total_expense ?? 0
  const netBalance = totalIncome - totalExpense
  const transactions = summary?.recent_transactions ?? []
  const totalCategoryExpense = topCategories.reduce((s, c) => s + Math.abs(c.total_expense), 0)
  const maxCategoryExpense = topCategories.length > 0 ? Math.abs(topCategories[0].total_expense) : 0

  return (
    <div className="space-y-6 max-w-screen-xl mx-auto">
      <div className="flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-white truncate">
            {greeting}, {firstName} <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{dateLabel}</p>
        </div>
        <button
          onClick={() => navigate('/nova-transacao')}
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Nova Transação</span><span className="sm:hidden">Nova</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">Saldo Total</p>
            <Wallet className="text-blue-500" size={18} />
          </div>
          <p className={`text-lg sm:text-2xl font-bold ${balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(balance, user?.currency)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">Saldo do Mês</p>
            {netBalance >= 0
              ? <TrendingUp className="text-green-500" size={18} />
              : <TrendingDown className="text-red-500" size={18} />}
          </div>
          <p className={`text-lg sm:text-2xl font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(netBalance, user?.currency)}
          </p>
          <DeltaBadge current={netBalance} previous={prevPeriod?.balance} mode="currency" currency={user?.currency} />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">Receitas</p>
            <ArrowUpCircle className="text-green-500" size={18} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome, user?.currency)}
          </p>
          <DeltaBadge current={totalIncome} previous={prevPeriod?.total_income} />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">Despesas</p>
            <ArrowDownCircle className="text-red-500" size={18} />
          </div>
          <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpense, user?.currency)}
          </p>
          <DeltaBadge current={totalExpense} previous={Math.abs(prevPeriod?.total_expense ?? 0)} invert />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 items-start">
        {/* Coluna principal */}
        <div className="xl:col-span-2 space-y-6">
          {/* Gasto diário */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-white mb-4">Gasto Diário do Mês</h2>
            {dailySpend.some(d => d.total > 0) ? (
              <DailySpendChart days={dailySpend} currency={user?.currency} />
            ) : (
              <div className="h-24 flex items-center justify-center text-zinc-400 dark:text-zinc-500 text-sm">
                Nenhuma despesa registrada neste mês
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 dark:border-white/[0.08] flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-white">Transações Recentes</h2>
              <Link to="/transacoes" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                Ver todas <ChevronRight size={14} />
              </Link>
            </div>

            {transactions.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                Nenhuma transação registrada.
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50 dark:bg-[#1a1a1a]/50 text-zinc-600 dark:text-zinc-300 text-sm">
                      <tr>
                        <th className="px-6 py-3 font-medium">Data</th>
                        <th className="px-6 py-3 font-medium">Categoria</th>
                        <th className="px-6 py-3 font-medium">Descrição</th>
                        <th className="px-6 py-3 font-medium text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
                      {transactions.slice(0, 8).map((t) => (
                        <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors">
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                            {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                            <span>{t.category?.icon || '📁'}</span>
                            <span>{t.category?.name || 'Sem categoria'}</span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">{t.description}</td>
                          <td className={`px-6 py-4 text-sm font-medium text-right ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(Math.abs(t.amount), user?.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List */}
                <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-700">
                  {transactions.slice(0, 8).map((t) => (
                    <div key={t.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-[#1a1a1a] flex items-center justify-center text-xl">
                          {t.category?.icon || '📁'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">{t.description}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.category?.name || 'Sem categoria'} • {new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {t.amount > 0 ? '+' : '-'} {formatCurrency(Math.abs(t.amount), user?.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          {/* Minhas Contas */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-white">Minhas Contas</h2>
              <Link to="/accounts" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                Gerenciar <ChevronRight size={14} />
              </Link>
            </div>
            {accounts.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma conta cadastrada.</p>
            ) : (
              <div className="space-y-1">
                {accounts.map(acc => {
                  const Icon = ACCOUNT_ICONS[acc.account_type] || Wallet
                  return (
                    <div key={acc.id} className="flex items-center justify-between gap-3 py-2 border-t border-white/[0.04] first:border-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-white/[0.06] text-blue-500">
                          <Icon size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-800 dark:text-zinc-200 truncate">{acc.name}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${acc.balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(acc.balance, user?.currency)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Top Categorias */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-semibold text-zinc-800 dark:text-white">Top Gastos do Mês</h2>
              <Link to="/report" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                Relatório <ChevronRight size={14} />
              </Link>
            </div>
            {topCategories.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhuma despesa neste mês.</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map((cat, i) => {
                  const expense = Math.abs(cat.total_expense)
                  const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length]
                  const pct = totalCategoryExpense > 0 ? (expense / totalCategoryExpense) * 100 : 0
                  return (
                    <div key={cat.category_id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 min-w-0">
                          <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="truncate">{cat.category_name}</span>
                        </span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 shrink-0 ml-2">
                          {formatCurrency(expense, user?.currency)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-[#1a1a1a] rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${maxCategoryExpense > 0 ? Math.max((expense / maxCategoryExpense) * 100, 2) : 0}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
