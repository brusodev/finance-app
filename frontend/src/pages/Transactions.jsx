import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2 } from 'lucide-react'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')

      // Buscar categorias
      const categoriesResponse = await fetch('http://localhost:8000/categories/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      }

      // Buscar transações
      const transactionsResponse = await fetch('http://localhost:8000/transactions/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (err) {
      setError('Erro ao carregar dados')
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (transactionId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta transação?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setSuccess('✅ Transação deletada!')
        setTransactions(transactions.filter((t) => t.id !== transactionId))
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Erro ao deletar transação')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
      console.error('Erro:', err)
    }
  }

  const handleEdit = (transaction) => {
    navigate('/nova-transacao', { state: { transaction } })
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : 'Sem categoria'
  }

  const getCategoryIcon = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.icon : '📁'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  )

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Transações</h1>
          <button
            onClick={() => navigate('/nova-transacao')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Transação</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500 bg-opacity-20 text-green-300 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center text-gray-400">Carregando transações...</div>
        ) : sortedTransactions.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhuma transação registrada.</p>
            <p className="text-sm mt-2">Clique em "Nova Transação" para criar uma.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Data</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Categoria</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Descrição</th>
                  <th className="text-left px-6 py-4 text-gray-300 font-semibold">Tipo</th>
                  <th className="text-right px-6 py-4 text-gray-300 font-semibold">Valor</th>
                  <th className="text-center px-6 py-4 text-gray-300 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-800 transition">
                    <td className="px-6 py-4 text-gray-300">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4">
                      <span className="text-2xl">{getCategoryIcon(transaction.category_id)}</span>{' '}
                      <span className="text-gray-300">{getCategoryName(transaction.category_id)}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{transaction.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          transaction.amount > 0
                            ? 'bg-green-500 bg-opacity-20 text-green-300'
                            : 'bg-red-500 bg-opacity-20 text-red-300'
                        }`}
                      >
                        {transaction.amount > 0 ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      R$ {Math.abs(transaction.amount).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white p-2 rounded-lg transition"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition"
                          title="Deletar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
