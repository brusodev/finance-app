import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

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

  const accountTypes = [
    { value: 'checking', label: 'Conta Corrente' },
    { value: 'savings', label: 'Poupança' },
    { value: 'credit_card', label: 'Cartão de Crédito' },
    { value: 'investment', label: 'Investimento' }
  ]

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/accounts/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
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
      const token = localStorage.getItem('token')
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? `http://localhost:8000/accounts/${editingId}`
        : 'http://localhost:8000/accounts/'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          balance: parseFloat(formData.balance)
        })
      })

      if (response.ok) {
        await loadAccounts()
        setFormData({ name: '', account_type: 'checking', balance: '', currency: 'BRL' })
        setEditingId(null)
        setShowForm(false)
      } else {
        setError('Erro ao salvar conta')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta conta?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:8000/accounts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          await loadAccounts()
        }
      } catch (err) {
        setError('Erro ao deletar conta')
      }
    }
  }

  const handleEdit = (account) => {
    setEditingId(account.id)
    setFormData({
      name: account.name,
      account_type: account.account_type,
      balance: account.balance.toString(),
      currency: account.currency
    })
    setShowForm(true)
  }

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Minhas Contas</h1>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', account_type: 'checking', balance: '', currency: 'BRL' })
              setShowForm(!showForm)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Conta</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Editar Conta' : 'Nova Conta'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Nome da Conta</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ex: Nubank"
                    required
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Tipo de Conta</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({...formData, account_type: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {accountTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    placeholder="0.00"
                    required
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Moeda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg"
              >
                {loading ? 'Salvando...' : 'Salvar Conta'}
              </button>
            </form>
          </div>
        )}

        {/* Accounts Grid */}
        {loading && !showForm ? (
          <div className="text-center text-gray-400">Carregando...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhuma conta cadastrada. Crie uma nova!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => (
              <div key={account.id} className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition">
                <h3 className="text-xl font-bold text-white mb-2">{account.name}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {accountTypes.find(t => t.value === account.account_type)?.label}
                </p>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 mb-4">
                  <p className="text-gray-100 text-sm">Saldo</p>
                  <p className="text-3xl font-bold text-white">
                    {account.balance.toLocaleString('pt-BR', { style: 'currency', currency: account.currency })}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Edit2 size={16} />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Trash2 size={16} />
                    <span>Deletar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
