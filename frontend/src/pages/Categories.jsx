import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: '📁'
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const icons = ['📁', '🍔', '🚗', '🏥', '💡', '🎓', '🏠', '🎮', '✈️', '💳', '🛒', '📱', '🎬', '⚽', '📚']

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/categories/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (err) {
      setError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('token')
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId
        ? `http://localhost:8000/categories/${editingId}`
        : 'http://localhost:8000/categories/'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess(editingId ? '✅ Categoria atualizada!' : '✅ Categoria criada!')
        await loadCategories()
        setFormData({ name: '', icon: '📁' })
        setEditingId(null)
        setTimeout(() => setShowForm(false), 1500)
      } else {
        const error = await response.json()
        setError(error.detail || 'Erro ao salvar categoria')
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta categoria?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`http://localhost:8000/categories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          setSuccess('✅ Categoria deletada!')
          await loadCategories()
        }
      } catch (err) {
        setError('Erro ao deletar categoria')
      }
    }
  }

  const handleEdit = (category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      icon: category.icon || '📁'
    })
    setShowForm(true)
  }

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Categorias</h1>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({ name: '', icon: '📁' })
              setError('')
              setSuccess('')
              setShowForm(!showForm)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Categoria</span>
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

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Nome da Categoria</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Alimentação"
                  required
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Ícone</label>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({...formData, icon})}
                      className={`text-3xl p-2 rounded-lg transition ${
                        formData.icon === icon
                          ? 'bg-blue-600 scale-110'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg"
              >
                {loading ? 'Salvando...' : 'Salvar Categoria'}
              </button>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        {loading && !showForm ? (
          <div className="text-center text-gray-400">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhuma categoria cadastrada. Crie uma nova!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition hover:bg-gray-750"
              >
                <div className="text-5xl mb-3">{category.icon || '📁'}</div>
                <h3 className="text-lg font-bold text-white mb-4">{category.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Trash2 size={16} />
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
