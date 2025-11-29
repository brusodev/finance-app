import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { accountsAPI, categoriesAPI, transactionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function NewTransaction() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const editingTransaction = location.state?.transaction
  
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category_id: '',
    account_id: '',
    transaction_type: 'expense'
  })

  useEffect(() => {
    loadData()
    if (editingTransaction) {
      setFormData({
        amount: Math.abs(editingTransaction.amount).toString(),
        date: editingTransaction.date,
        description: editingTransaction.description,
        category_id: editingTransaction.category?.id || editingTransaction.category_id || '',
        account_id: editingTransaction.account?.id || editingTransaction.account_id || '',
        transaction_type: editingTransaction.amount > 0 ? 'income' : 'expense'
      })
    }
  }, [editingTransaction])

  const loadData = async () => {
    try {
      const [categoriesData, accountsData] = await Promise.all([
        categoriesAPI.getAll(),
        accountsAPI.getAll()
      ])

      setCategories(categoriesData)
      setAccounts(accountsData)

      if (categoriesData.length > 0 && !editingTransaction && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoriesData[0].id }))
      }
      
      if (accountsData.length > 0 && !editingTransaction && !formData.account_id) {
        setFormData(prev => ({ ...prev, account_id: accountsData[0].id }))
      }
    } catch (err) {
      setError('Erro ao carregar dados')
      console.error('Erro:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.category_id) {
      setError('Selecione uma categoria')
      return
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('Digite um valor válido')
      return
    }

    setLoading(true)
    setError('')

    try {
      const amount = formData.transaction_type === 'income' 
        ? parseFloat(formData.amount) 
        : -parseFloat(formData.amount)

      const payload = {
        amount,
        date: formData.date,
        description: formData.description,
        category_id: parseInt(formData.category_id),
        transaction_type: formData.transaction_type
      }

      if (formData.account_id) {
        payload.account_id = parseInt(formData.account_id)
      }

      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, payload)
      } else {
        await transactionsAPI.create(payload)
      }

      navigate('/transacoes')
    } catch (err) {
      console.error('Erro ao salvar:', err)
      setError('Erro ao salvar transação. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/transacoes')}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Toggle */}
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type: 'expense' })}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                formData.transaction_type === 'expense'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type: 'income' })}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                formData.transaction_type === 'income'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-12 pr-4 py-3 text-xl font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conta (Opcional)</label>
            <select
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
            >
              <option value="">Selecione uma conta</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
              placeholder="Ex: Compras do mês"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/transacoes')}
              className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm hover:shadow"
            >
              <Save size={20} />
              <span>{loading ? 'Salvando...' : 'Salvar Transação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
