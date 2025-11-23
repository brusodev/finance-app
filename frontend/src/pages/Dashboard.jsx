import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionsAPI, categoriesAPI } from '../services/api'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const navigate = useNavigate()

  // Verificar autenticação
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  // Buscar dados ao montar componente
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Buscar categorias e transações em paralelo
      const [categoriesData, transactionsData] = await Promise.all([
        categoriesAPI.getAll(),
        transactionsAPI.getAll()
      ])

      setCategories(categoriesData)
      setTransactions(transactionsData)

      // Calcular totais
      calculateTotals(transactionsData)
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Erro ao carregar dados'
      setError(errorMessage)
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (txns) => {
    let income = 0
    let expense = 0

    txns.forEach((txn) => {
      if (txn.amount > 0) {
        income += txn.amount
      } else {
        expense += Math.abs(txn.amount)
      }
    })

    setTotalIncome(income)
    setTotalExpense(expense)
  }

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) {
      return
    }

    try {
      await transactionsAPI.delete(transactionId)
      setTransactions(transactions.filter((t) => t.id !== transactionId))
      calculateTotals(transactions.filter((t) => t.id !== transactionId))
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao deletar transação'
      setError(errorMessage)
    }
  }

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction)
    setShowForm(true)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTransaction) {
        // Atualizar transação existente
        const updated = await transactionsAPI.update(editingTransaction.id, formData)
        setTransactions(
          transactions.map((t) => (t.id === editingTransaction.id ? updated : t))
        )
      } else {
        // Criar nova transação
        const newTransaction = await transactionsAPI.create(formData)
        setTransactions([newTransaction, ...transactions])
      }

      calculateTotals(transactions)
      setShowForm(false)
      setEditingTransaction(null)
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Erro ao salvar transação'
      setError(errorMessage)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingTransaction(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  const balance = totalIncome - totalExpense

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 m-4 rounded-md">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => setError('')}
            className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="lg:ml-64 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white mb-8">Dashboard Financeiro</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card Saldo */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 shadow-lg">
              <p className="text-blue-100 text-sm font-medium mb-2">Saldo Total</p>
              <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                R$ {balance.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Card Receitas */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg p-6 shadow-lg">
              <p className="text-green-100 text-sm font-medium mb-2">Receitas</p>
              <p className="text-3xl font-bold text-green-300">
                R$ {totalIncome.toFixed(2).replace('.', ',')}
              </p>
            </div>

            {/* Card Despesas */}
            <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-lg p-6 shadow-lg">
              <p className="text-red-100 text-sm font-medium mb-2">Despesas</p>
              <p className="text-3xl font-bold text-red-300">
                R$ {totalExpense.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Adicionar Transação */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button
          onClick={() => {
            setEditingTransaction(null)
            setShowForm(!showForm)
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Adicionar Transação'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="max-w-6xl mx-auto px-4 pb-6">
          <TransactionForm
            categories={categories}
            initialData={editingTransaction}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
          />
        </div>
      )}

      {/* Lista de Transações */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {transactions.length > 0 ? (
          <TransactionList
            transactions={transactions}
            categories={categories}
            onDelete={handleDeleteTransaction}
            onEdit={handleEditTransaction}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma transação registrada.</p>
            <p className="text-gray-400">Clique em "Adicionar Transação" para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}