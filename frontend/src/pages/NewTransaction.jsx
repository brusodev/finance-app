import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { accountsAPI, categoriesAPI, transactionsAPI } from '../services/api'

export default function NewTransaction() {
  const navigate = useNavigate()
  const location = useLocation()
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
    const user = localStorage.getItem('user')
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    loadData()
    if (editingTransaction) {
      setFormData({
        amount: Math.abs(editingTransaction.amount).toString(),
        date: editingTransaction.date,
        description: editingTransaction.description,
        category_id: editingTransaction.category_id,
        account_id: editingTransaction.account_id || '',
        transaction_type: editingTransaction.amount > 0 ? 'income' : 'expense'
      })
    }
  }, [editingTransaction])

  const loadData = async () => {
    try {
      // Carregar categorias e contas em paralelo
      const [categoriesData, accountsData] = await Promise.all([
        categoriesAPI.getAll(),
        accountsAPI.getAll()
      ])

      setCategories(categoriesData)
      setAccounts(accountsData)

      if (categoriesData.length > 0 && !editingTransaction && !formData.category_id) {
        setFormData(prev => ({ ...prev, category_id: categoriesData[0].id }))
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
      const errorMessage = err?.detail || err?.message || 'Erro ao salvar transação'
      setError(errorMessage)
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/transacoes')}
          className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 mb-6"
        >
          <ArrowLeft size={20} />
          <span>Voltar para Transações</span>
        </button>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">
            {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
          </h1>

          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transação */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Tipo</label>
              <div className="flex space-x-4">
                {[
                  { value: 'income', label: 'Receita (Entrada)' },
                  { value: 'expense', label: 'Despesa (Saída)' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, transaction_type: option.value })}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition ${
                      formData.transaction_type === option.value
                        ? option.value === 'income'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              <p className="text-gray-400 text-sm mt-2">Digite o valor sem sinal</p>
            </div>

            {/* Data */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Data</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Categoria</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conta */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Conta (Opcional)</label>
              <select
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma conta selecionada</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-gray-300 font-semibold mb-3">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva a transação..."
                rows="4"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Botões */}
            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition"
              >
                {loading ? 'Salvando...' : editingTransaction ? 'Atualizar' : 'Criar Transação'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/transacoes')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
