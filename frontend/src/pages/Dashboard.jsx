import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionsAPI, categoriesAPI } from '../services/api'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const navigate = useNavigate()

  // Verificar autentica��o
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

      // Buscar categorias e transa��es em paralelo
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

          {/* Lista de Transações Recentes */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Transações Recentes</h2>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Nenhuma transação registrada.</p>
                <p className="text-gray-400">Clique em "Nova Transação" no menu para começar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left px-6 py-4 text-gray-300 font-semibold">Data</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-semibold">Categoria</th>
                      <th className="text-left px-6 py-4 text-gray-300 font-semibold">Descrição</th>
                      <th className="text-right px-6 py-4 text-gray-300 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 10).map((transaction) => {
                      return (
                        <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                          <td className="px-6 py-4 text-gray-300">
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-2xl">{transaction.category?.icon || '📁'}</span>{' '}
                            <span className="text-gray-300">{transaction.category?.name || 'Sem categoria'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{transaction.description}</td>
                          <td className={`px-6 py-4 text-right font-semibold ${
                            transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
