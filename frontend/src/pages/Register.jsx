import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações
      if (!username || !email || !password || !confirmPassword) {
        setError('Todos os campos obrigatórios devem ser preenchidos')
        setLoading(false)
        return
      }

      if (username.length < 3) {
        setError('Username deve ter no mínimo 3 caracteres')
        setLoading(false)
        return
      }

      // Validação de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Email inválido')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Senha deve ter no mínimo 6 caracteres')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setError('As senhas não correspondem')
        setLoading(false)
        return
      }

      // Registrar usuário
      const user = await authAPI.register(username, password, email, fullName)
      console.log('Registro bem-sucedido:', user)

      setUsername('')
      setEmail('')
      setFullName('')
      setPassword('')
      setConfirmPassword('')
      
      // Redirecionar para login
      navigate('/login', { replace: true })
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Erro ao registrar'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Finance App
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Crie sua conta</p>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 p-4">
            <p className="text-red-700 dark:text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="escolha um username"
              disabled={loading}
              minLength={3}
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Mínimo 3 caracteres</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="seu@email.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome Completo <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="seu nome completo"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="crie uma senha"
              disabled={loading}
              minLength={6}
            />
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="confirme sua senha"
              disabled={loading}
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        {/* Rodapé */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
