import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Wallet } from 'lucide-react'
import { accountsAPI } from '../services/api'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    account_type: 'checking',
    balance: '',
    currency: 'BRL'
  })
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState([])

  const accountTypes = [
    { value: 'checking', label: 'Conta Corrente' },
    { value: 'savings', label: 'Poupança' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'investment', label: 'Investimento' }
  ]

  useEffect(() => {
    loadAccounts()
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      const data = await accountsAPI.getSuggestions()
      setSuggestions(data)
    } catch (err) {
      console.log('Erro ao carregar sugestões:', err)
    }
  }

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const data = await accountsAPI.getAll()
      setAccounts(data)
    } catch (err) {
      setError('Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const accountData = {
        ...formData,
        balance: parseFloat(formData.balance)
      }

      if (editingId) {
        await accountsAPI.update(editingId, accountData)
      } else {
        await accountsAPI.create(accountData)
      }

      await loadAccounts()
      setShowForm(false)
      resetForm()
    } catch (err) {
      setError('Erro ao salvar conta')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return

    try {
      await accountsAPI.delete(id)
      await loadAccounts()
    } catch (err) {
      setError('Erro ao excluir conta')
    }
  }

  const handleEdit = (account) => {
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance.toString(),
      currency: account.currency
    })
    setEditingId(account.id)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'checking',
      balance: '',
      currency: 'BRL'
    })
    setEditingId(null)
    setError('')
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-gray-800 dark:text-white'>Minhas Contas</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2'
        >
          <Plus size={20} />
          <span>Nova Conta</span>
        </button>
      </div>

      {error && <div className='bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg'>{error}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden'>
            <div className='flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700'>
              <h2 className='text-xl font-semibold text-gray-800 dark:text-white'>
                {editingId ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <button onClick={() => setShowForm(false)} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                  Nome da Conta
                  {!editingId && suggestions.length > 0 && (
                    <span className='text-xs text-gray-500 dark:text-gray-400 ml-2'>(sugestões disponíveis)</span>
                  )}
                </label>
                <input
                  type='text'
                  required
                  list="account-suggestions"
                  className='w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite ou selecione uma sugestão"
                />
                {!editingId && (
                  <datalist id="account-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Tipo</label>
                <select
                  className='w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Saldo Inicial</label>
                <input
                  type='number'
                  step='0.01'
                  required
                  className='w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                />
              </div>

              <button
                type='submit'
                disabled={loading}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50'
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {accounts.map((account) => (
          <div key={account.id} className='bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow'>
            <div className='flex justify-between items-start mb-4'>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400'>
                <Wallet size={24} />
              </div>
              <div className='flex gap-2'>
                <button onClick={() => handleEdit(account)} className='text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(account.id)} className='text-gray-400 hover:text-red-600 dark:hover:text-red-400'>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            <h3 className='text-lg font-semibold text-gray-800 dark:text-white mb-1'>{account.name}</h3>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
              {accountTypes.find(t => t.value === account.account_type)?.label}
            </p>
            
            <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              R$ {account.balance.toFixed(2).replace('.', ',')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
