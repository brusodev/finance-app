import React, { useState, useEffect } from 'react'
import { Settings, Lock, Bell, Moon, Shield, Globe } from 'lucide-react'
import { authAPI, usersAPI } from '../services/api'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { darkMode, toggleTheme } = useTheme()
  const { user, updateUser } = useAuth()
  const [settings, setSettings] = useState({
    notifications: true,
    twoFactor: false,
    currency: user?.currency || 'BRL'
  })

  useEffect(() => {
    if (user?.currency) {
      setSettings(prev => ({ ...prev, currency: user.currency }))
    }
  }, [user])

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

  const handleSettingSelect = async (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))

    if (key === 'currency') {
      try {
        const updatedUser = await usersAPI.updateProfile({ currency: value })
        updateUser(updatedUser)
        setSuccess('Moeda alterada com sucesso!')
      } catch (err) {
        setError('Erro ao salvar moeda padrão.')
      }
    }
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
      await authAPI.changePassword(password.currentPassword, password.newPassword)
      setSuccess('Senha alterada com sucesso!')
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError('Erro ao alterar senha. Verifique sua senha atual.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-zinc-800 dark:text-white flex items-center gap-2">
        <Settings className="text-zinc-600 dark:text-zinc-400" size={28} />
        <span>Configurações</span>
      </h1>

      {/* Preferences */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08]">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Preferências</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Personalize sua experiência no aplicativo</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-700">
          <div className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-white">Notificações</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Receber alertas sobre suas finanças</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={() => handleSettingChange('notifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Moon size={20} />
              </div>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-white">Modo Escuro</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Alternar entre temas claro e escuro</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={toggleTheme}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 dark:bg-[#2a2a2a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 dark:peer-focus:ring-purple-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="font-medium text-zinc-800 dark:text-white">Moeda Principal</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Selecione a moeda padrão para exibição</p>
              </div>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingSelect('currency', e.target.value)}
              className="bg-zinc-50 dark:bg-[#1a1a1a] border border-zinc-200 dark:border-white/[0.08] text-zinc-800 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              {currencies.map(curr => (
                <option key={curr} value={curr}>{curr}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 dark:border-white/[0.08]">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Segurança</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gerencie sua senha e autenticação</p>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-4 rounded-lg border border-red-100 dark:border-red-900/30">{error}</div>}
          {success && <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-900/30">{success}</div>}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Senha Atual</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input
                  type="password"
                  name="currentPassword"
                  value={password.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input
                  type="password"
                  name="newPassword"
                  value={password.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirmar Nova Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={18} />
                <input
                  type="password"
                  name="confirmPassword"
                  value={password.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-zinc-50 dark:bg-[#1a1a1a] focus:bg-white dark:focus:bg-zinc-600 text-zinc-900 dark:text-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 shadow-sm hover:shadow"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

