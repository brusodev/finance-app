import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { transactionsAPI, categoriesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredTransactions = transactions
    .filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 (t.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Transações</h1>
        <button
          onClick={() => navigate('/nova-transacao')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={20} />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar transações..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg">{success}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Nenhuma transação encontrada.</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium">Tipo</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                    <th className="px-6 py-3 font-medium text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{t.category?.icon || '📁'}</span>
                        <span>{t.category?.name || 'Sem categoria'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{t.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.amount > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {t.amount > 0 ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(t)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                        {t.category?.icon || '📁'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.category?.name} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {t.amount > 0 ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-50 dark:border-gray-700">
                    <button onClick={() => handleEdit(t)} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"><Edit2 size={14} /> Editar</button>
                    <button onClick={() => handleDelete(t.id)} className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"><Trash2 size={14} /> Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
