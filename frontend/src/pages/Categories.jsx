import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { categoriesAPI } from '../services/api'

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
  const [suggestions, setSuggestions] = useState([])
  const [iconSuggestions, setIconSuggestions] = useState([])
  const [customIcon, setCustomIcon] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)

  useEffect(() => {
    loadCategories()
    loadSuggestions()
    loadIconSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      const data = await categoriesAPI.getSuggestions()
      setSuggestions(data)
    } catch (err) {
      console.log('Erro ao carregar sugestões:', err)
    }
  }

  const loadIconSuggestions = async () => {
    try {
      const data = await categoriesAPI.getIcons()
      setIconSuggestions(data)
    } catch (err) {
      console.log('Erro ao carregar ícones:', err)
    }
  }

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await categoriesAPI.getAll()
      setCategories(data)
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
      if (editingId) {
        await categoriesAPI.update(editingId, formData)
        setSuccess('Categoria atualizada com sucesso!')
      } else {
        await categoriesAPI.create(formData)
        setSuccess('Categoria criada com sucesso!')
      }
      await loadCategories()
      setFormData({ name: '', icon: '📁' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      const errorMessage = err.detail || 'Erro ao salvar categoria'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta categoria?')) {
      try {
        await categoriesAPI.delete(id)
        setSuccess('Categoria deletada com sucesso!')
        await loadCategories()
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

  const resetForm = () => {
    setFormData({ name: '', icon: '📁' })
    setEditingId(null)
    setError('')
    setSuccess('')
    setCustomIcon('')
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-zinc-800 dark:text-white'>Categorias</h1>
        <button
          onClick={() => {
            resetForm()
            setShowForm(true)
          }}
          className='bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2'
        >
          <Plus size={20} />
          <span>Nova Categoria</span>
        </button>
      </div>

      {error && <div className='bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg'>{error}</div>}
      {success && <div className='bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg'>{success}</div>}

      {/* Form Modal */}
      {showForm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden'>
            <div className='flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-700'>
              <h2 className='text-xl font-semibold text-zinc-800 dark:text-white'>
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setShowForm(false)} className='text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1'>
                  Nome
                  {!editingId && suggestions.length > 0 && (
                    <span className='text-xs text-zinc-500 dark:text-zinc-400 ml-2'>(sugestões disponíveis)</span>
                  )}
                </label>
                <input
                  type='text'
                  required
                  list="category-suggestions"
                  className='w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite ou selecione uma sugestão"
                />
                {!editingId && (
                  <datalist id="category-suggestions">
                    {suggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion} />
                    ))}
                  </datalist>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2'>
                  Ícone {formData.icon && <span className='text-2xl ml-2'>{formData.icon}</span>}
                </label>

                {/* Campo de entrada personalizado */}
                <div className='mb-3'>
                  <input
                    type='text'
                    placeholder='Cole ou digite um emoji personalizado'
                    value={customIcon}
                    onChange={(e) => {
                      setCustomIcon(e.target.value)
                      if (e.target.value) {
                        setFormData({ ...formData, icon: e.target.value })
                      }
                    }}
                    className='w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white'
                  />
                  <p className='text-xs text-zinc-500 dark:text-zinc-400 mt-1 text-center'>
                    Ou escolha entre as sugestões abaixo
                  </p>
                </div>

                {/* Categorias de ícones */}
                {iconSuggestions.length > 0 ? (
                  <div className='space-y-3 max-h-60 overflow-y-auto'>
                    {iconSuggestions.map((iconGroup, idx) => (
                      <div key={idx} className='border-b border-zinc-100 dark:border-zinc-700 pb-2 last:border-0'>
                        <p className='text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1'>
                          {iconGroup.category}
                        </p>
                        <div className='flex flex-wrap gap-1'>
                          <button
                            type='button'
                            onClick={() => {
                              setFormData({ ...formData, icon: iconGroup.icon })
                              setCustomIcon('')
                            }}
                            className={`text-xl p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors ${
                              formData.icon === iconGroup.icon ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''
                            }`}
                          >
                            {iconGroup.icon}
                          </button>
                          {iconGroup.alternatives?.map((icon, iconIdx) => (
                            <button
                              key={iconIdx}
                              type='button'
                              onClick={() => {
                                setFormData({ ...formData, icon })
                                setCustomIcon('')
                              }}
                              className={`text-xl p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors ${
                                formData.icon === icon ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : ''
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center text-zinc-500 dark:text-zinc-400 py-4'>
                    Carregando ícones...
                  </div>
                )}
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

      {/* Categories Grid */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'>
        {categories.map((category) => (
          <div key={category.id} className='bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700 hover:shadow-md transition-shadow flex flex-col items-center text-center'>
            <div className='text-4xl mb-4'>{category.icon || '📁'}</div>
            <h3 className='text-lg font-semibold text-zinc-800 dark:text-white mb-4'>{category.name}</h3>
            
            <div className='flex gap-2 w-full justify-center'>
              <button 
                onClick={() => handleEdit(category)} 
                className='p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors'
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(category.id)} 
                className='p-2 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors'
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

