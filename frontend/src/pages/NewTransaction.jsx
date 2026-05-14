import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { accountsAPI, categoriesAPI, transactionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCurrencySymbol } from '../utils/formatters'

export default function NewTransaction() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const editingTransaction = location.state?.transaction
  
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [descriptionSuggestions, setDescriptionSuggestions] = useState([])
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-'),
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

  useEffect(() => {
    loadDescriptionSuggestions()
  }, [formData.transaction_type, formData.category_id])

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

  const loadDescriptionSuggestions = async () => {
    try {
      console.log('🔍 Carregando sugestões...', {
        transaction_type: formData.transaction_type,
        category_id: formData.category_id || null,
        limit: 50
      })

      // Tenta buscar sugestões com categoria específica
      let suggestions = await transactionsAPI.getDescriptionSuggestions(
        formData.transaction_type,
        formData.category_id || null,
        50
      )

      // Se não houver sugestões para essa categoria, busca sugestões gerais do tipo
      if (suggestions.length === 0 && formData.category_id) {
        console.log('⚠️ Sem sugestões para esta categoria, buscando sugestões gerais...')
        suggestions = await transactionsAPI.getDescriptionSuggestions(
          formData.transaction_type,
          null, // Sem filtro de categoria
          50
        )
      }

      console.log('✅ Sugestões carregadas:', suggestions)
      setDescriptionSuggestions(suggestions)
    } catch (err) {
      console.error('❌ Erro ao carregar sugestões:', err)
      setDescriptionSuggestions([])
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
          className="p-2 hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">
          {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
        </h1>
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900/30">{error}</div>}

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transaction Type Toggle */}
          <div className="flex p-1 bg-zinc-100 dark:bg-[#1a1a1a] rounded-lg">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type: 'expense' })}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                formData.transaction_type === 'expense'
                  ? 'bg-white dark:bg-[#2a2a2a] text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, transaction_type: 'income' })}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                formData.transaction_type === 'income'
                  ? 'bg-white dark:bg-[#2a2a2a] text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 font-medium">
                {getCurrencySymbol(user?.currency)}
              </span>
              <input
                type="number"
                step="0.01"
                required
                className="w-full pl-12 pr-4 py-3 text-xl font-semibold border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Categoria</label>
              <select
                required
                className="w-full px-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Conta (Opcional)</label>
            <select
              className="w-full px-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Descrição
              {descriptionSuggestions.length > 0 && (
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  ({descriptionSuggestions.length} sugestões)
                </span>
              )}
            </label>
            <input
              type="text"
              required
              list="description-suggestions"
              className="w-full px-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
              placeholder="Ex: Compras do mês"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <datalist id="description-suggestions">
              {descriptionSuggestions.map((suggestion, index) => (
                <option key={index} value={suggestion} />
              ))}
            </datalist>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-white/[0.08] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/transacoes')}
              className="px-6 py-2 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
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

