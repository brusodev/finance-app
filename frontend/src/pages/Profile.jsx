import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usersAPI } from '../services/api'
import { Camera, Save } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatar: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    if (userData.id) {
      setUser(userData)
      setFormData({
        fullName: userData.full_name || '',
        email: userData.email || '',
        avatar: userData.avatar || null
      })
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          avatar: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const updatedUser = await usersAPI.updateProfile({
        full_name: formData.fullName,
        email: formData.email,
        avatar: formData.avatar
      })
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setSuccess('✅ Perfil atualizado com sucesso!')
    } catch (err) {
      setError('❌ Erro ao atualizar perfil: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {formData.avatar ? (
                <img
                  src={formData.avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full cursor-pointer hover:bg-blue-600 transition">
                <Camera size={20} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <h2 className="text-2xl font-bold text-white mt-4">{user?.username}</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-500 bg-opacity-20 text-green-300 p-4 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label className="block text-gray-300 mb-2">Nome Completo</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Seu nome completo"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center space-x-2 transition"
            >
              <Save size={20} />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
