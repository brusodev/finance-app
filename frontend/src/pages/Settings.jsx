import React, { useState, useEffect } from 'react'
import { Settings, Lock, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    twoFactor: false,
    currency: 'BRL'
  })
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currencies = ['BRL', 'USD', 'EUR']

  const handleSettingChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: typeof prev[key] === 'boolean' ? !prev[key] : prev[key]
    }))
  }

  const handleSettingSelect = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPassword(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.newPassword !== password.confirmPassword) {
      setError('As senhas não correspondem')
      return
    }

    if (password.newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:8000/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: password.currentPassword,
          new_password: password.newPassword
        })
      })

      if (response.ok) {
        setSuccess('✅ Senha alterada com sucesso!')
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setError('❌ Erro ao alterar senha')
      }
    } catch (err) {
      setError('❌ Erro ao conectar com o servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lg:ml-64 p-6 min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center space-x-2">
          <Settings size={32} />
          <span>Configurações</span>
        </h1>

        {/* Preferences */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6">Preferências</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-white font-bold">Notificações</h3>
                <p className="text-gray-400 text-sm">Receber notificações do aplicativo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={() => handleSettingChange('notifications')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-white font-bold">Modo Escuro</h3>
                <p className="text-gray-400 text-sm">Interface escura padrão</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={() => handleSettingChange('darkMode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="p-4 bg-gray-700 rounded-lg">
              <h3 className="text-white font-bold mb-2">Moeda Padrão</h3>
              <div className="flex space-x-2">
                {currencies.map(curr => (
                  <button
                    key={curr}
                    onClick={() => handleSettingSelect('currency', curr)}
                    className={`px-4 py-2 rounded-lg font-bold transition ${
                      settings.currency === curr
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-white font-bold">Autenticação de Dois Fatores</h3>
                <p className="text-gray-400 text-sm">Aumentar segurança da conta</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.twoFactor}
                  onChange={() => handleSettingChange('twoFactor')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <Lock size={24} />
            <span>Segurança</span>
          </h2>

          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-300 p-4 rounded-lg mb-4 flex items-center space-x-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500 bg-opacity-20 text-green-300 p-4 rounded-lg mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Senha Atual</label>
              <input
                type="password"
                name="currentPassword"
                value={password.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Digite sua senha atual"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Nova Senha</label>
              <input
                type="password"
                name="newPassword"
                value={password.newPassword}
                onChange={handlePasswordChange}
                placeholder="Digite sua nova senha"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Confirmar Senha</label>
              <input
                type="password"
                name="confirmPassword"
                value={password.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirme sua nova senha"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500 border-opacity-30">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center space-x-2">
            <AlertCircle size={24} />
            <span>Zona de Perigo</span>
          </h2>
          <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg">
            Deletar Conta Permanentemente
          </button>
        </div>
      </div>
    </div>
  )
}
