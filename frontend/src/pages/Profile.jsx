import React, { useState, useEffect } from 'react'
import { usersAPI } from '../services/api'
import { Camera, Save } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Funções de formatação (fora do componente)
const formatCPF = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return value.slice(0, 14)
}

const formatPhone = (value) => {
  const numbers = value.replace(/\D/g, '')
  if (numbers.length <= 11) {
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
  return value.slice(0, 15)
}

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    avatar: null,
    cpf: '',
    phone: '',
    birthDate: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.full_name || '',
        email: user.email || '',
        avatar: user.avatar || null,
        cpf: user.cpf ? formatCPF(user.cpf) : '',
        phone: user.phone ? formatPhone(user.phone) : '',
        birthDate: user.birth_date || '',
        address: user.address || ''
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'phone') {
      formattedValue = formatPhone(value)
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
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
      // Preparar dados - enviar apenas campos preenchidos, outros como null
      const profileData = {
        full_name: formData.fullName?.trim() || null,
        email: formData.email?.trim() || null,
        avatar: formData.avatar || null,
        cpf: formData.cpf?.replace(/\D/g, '') || null, // Remove formatação antes de enviar
        phone: formData.phone?.replace(/\D/g, '') || null, // Remove formatação antes de enviar
        birth_date: formData.birthDate || null,
        address: formData.address?.trim() || null
      }

      console.log('Enviando dados:', profileData)
      const updatedUser = await usersAPI.updateProfile(profileData)
      console.log('Resposta do servidor:', updatedUser)

      updateUser(updatedUser)
      setSuccess('Perfil atualizado com sucesso!')

      // Atualizar formData com os dados retornados (já formatados)
      setFormData({
        fullName: updatedUser.full_name || '',
        email: updatedUser.email || '',
        avatar: updatedUser.avatar || null,
        cpf: updatedUser.cpf ? formatCPF(updatedUser.cpf) : '',
        phone: updatedUser.phone ? formatPhone(updatedUser.phone) : '',
        birthDate: updatedUser.birth_date || '',
        address: updatedUser.address || ''
      })
    } catch (err) {
      console.error('Erro completo:', err)
      setError('Erro ao atualizar perfil: ' + (err.detail || err.message || 'Erro desconhecido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meu Perfil</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-4xl font-bold">
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
            >
              <Camera size={20} />
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Clique na câmera para alterar a foto</p>
        </div>

        {error && <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900/30">{error}</div>}
        {success && <div className="mb-6 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-900/30">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
              <input
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                maxLength={14}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                maxLength={15}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data de Nascimento</label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-600 text-gray-900 dark:text-white transition-colors resize-none"
              placeholder="Seu endereço completo"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm hover:shadow"
            >
              <Save size={20} />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
