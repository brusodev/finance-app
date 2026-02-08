import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Search, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react'
import { transactionsAPI, categoriesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatCurrency, formatDateLocal } from '../utils/formatters'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('current') // 'current', 'all', ou 'YYYY-MM'
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [categoriesData, transactionsData] = await Promise.all([
        categoriesAPI.getAll(),
        transactionsAPI.getAll()
      ])
      setCategories(categoriesData)
      setTransactions(transactionsData)
    } catch (err) {
      setError('Erro ao carregar dados')
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) return
    try {
      await transactionsAPI.delete(transactionId)
      setSuccess('Transação deletada!')
      setTransactions(transactions.filter((t) => t.id !== transactionId))
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    }
  }

  const handleEdit = (transaction) => {
    navigate('/nova-transacao', { state: { transaction } })
  }

  // Gerar lista de meses disponíveis nas transações
  const getAvailableMonths = () => {
    const monthsSet = new Set()
    transactions.forEach(t => {
      const date = new Date(t.date + 'T00:00:00')
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthsSet.add(monthKey)
    })
    return Array.from(monthsSet).sort().reverse()
  }

  // Filtrar transações por mês
  const filterTransactionsByMonth = (transactions) => {
    if (selectedMonth === 'all') {
      return transactions
    }

    if (selectedMonth === 'current') {
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      return transactions.filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00')
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear
      })
    }

    // Formato 'YYYY-MM'
    const [year, month] = selectedMonth.split('-').map(Number)
    return transactions.filter(t => {
      const transactionDate = new Date(t.date + 'T00:00:00')
      return transactionDate.getFullYear() === year &&
             transactionDate.getMonth() === month - 1
    })
  }

  const filteredTransactions = filterTransactionsByMonth(transactions)
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const availableMonths = getAvailableMonths()

  // Formatar mês para exibição
  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-')
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  // Obter ícone e cor baseado no tipo
  const getTransactionStyle = (transaction) => {
    if (transaction.transaction_type === 'transfer') {
      return {
        icon: ArrowLeftRight,
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        textColor: 'text-blue-600 dark:text-blue-400',
        label: 'Transferência'
      }
    } else if (transaction.amount > 0) {
      return {
        icon: ArrowUpCircle,
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        iconColor: 'text-green-600 dark:text-green-400',
        textColor: 'text-green-600 dark:text-green-400',
        label: 'Receita'
      }
    } else {
      return {
        icon: ArrowDownCircle,
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        textColor: 'text-red-600 dark:text-red-400',
        label: 'Despesa'
      }
    }
  }

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Transações</h1>
        <button
          onClick={() => navigate('/nova-transacao')}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center transition-colors"
        >
          <Plus size={20} />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={20} />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-64">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
          >
            <option value="current">Mês Atual</option>
            <option value="all">Todos os Meses</option>
            {availableMonths.length > 0 && <option disabled>─────────────</option>}
            {availableMonths.map(monthKey => (
              <option key={monthKey} value={monthKey}>
                {formatMonthDisplay(monthKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-200 dark:border-red-800">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-200 dark:border-green-800">{success}</div>}

      {/* Transações em Cards */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((t) => {
            const style = getTransactionStyle(t)
            const Icon = style.icon

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md dark:hover:shadow-zinc-800 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Ícone */}
                  <div className={`w-12 h-12 rounded-full ${style.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={24} className={style.iconColor} />
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate">
                          {t.description}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {t.category?.icon} {t.category?.name || 'Sem categoria'}
                          </span>
                          <span className="text-zinc-300 dark:text-zinc-700">•</span>
                          <span className="text-sm text-zinc-500 dark:text-zinc-400">
                            {formatDateLocal(t.date)}
                          </span>
                          {t.account && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                {t.account.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Valor e Badge */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`text-lg font-bold ${style.textColor}`}>
                          {t.amount > 0 ? '+' : t.transaction_type === 'transfer' ? '' : '-'} {formatCurrency(Math.abs(t.amount), user?.currency)}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bgColor} ${style.iconColor}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={14} />
                        <span>Editar</span>
                      </button>
                      <span className="text-zinc-300 dark:text-zinc-700">|</span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
