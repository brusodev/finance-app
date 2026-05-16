import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Lock, ShieldCheck, Sparkles, User } from 'lucide-react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

const HIGHLIGHTS = [
  'Visão centralizada das finanças',
  'Acesso rápido ao dashboard',
  'Segurança com token httpOnly',
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!username || !password) {
        setError('Username e senha são obrigatórios')
        setLoading(false)
        return
      }

      const response = await authAPI.login(username, password)

      // Token chegou no cookie httpOnly — só armazena os dados do usuário
      login(response)

      setUsername('')
      setPassword('')

      // Redirecionar para dashboard
      navigate('/', { replace: true })
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Erro ao fazer login'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#000000] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.03),_transparent_30%)]" />
      <div className="pointer-events-none absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] bottom-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <section className="order-2 flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-xl sm:p-10 lg:order-1 lg:min-h-[36rem] lg:p-12">
            <div>
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-black/30 px-4 py-2 text-sm text-zinc-200 shadow-lg shadow-black/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-blue-300">
                  <Sparkles className="h-4 w-4" />
                </span>
                Prospera Finance
              </div>

              <div className="max-w-xl space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Controle suas finanças com uma entrada limpa e rápida.
                </h1>
                <p className="max-w-lg text-base leading-7 text-zinc-300 sm:text-lg">
                  Acesse seu painel, acompanhe contas, cartões e investimentos em um espaço pensado para leitura rápida e foco.
                </p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {HIGHLIGHTS.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-sm text-zinc-200 shadow-sm shadow-black/20"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-4 rounded-2xl border border-white/[0.08] bg-black/25 p-5 sm:grid-cols-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Dashboard
                </div>
                <p className="text-sm text-zinc-200">Visão central de contas e saldos.</p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Segurança
                </div>
                <p className="text-sm text-zinc-200">Sessão protegida com autenticação segura.</p>
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400">
                  <Lock className="h-3.5 w-3.5" />
                  Privacidade
                </div>
                <p className="text-sm text-zinc-200">Credenciais tratadas sem expor o token no app.</p>
              </div>
            </div>
          </section>

          <section className="order-1 flex items-center lg:order-2">
            <div className="w-full rounded-3xl border border-white/[0.08] bg-[#111111]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8 lg:p-10">
              <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-300/90">
                  Login
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                  Entre na sua conta
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Use suas credenciais para continuar de onde parou.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="username" className="mb-2 block text-sm font-medium text-zinc-200">
                    Username
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="username"
                      type="text"
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#1a1a1a] py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="seu username"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-200">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="password"
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-white/[0.08] bg-[#1a1a1a] py-3 pl-11 pr-4 text-white outline-none transition focus:border-blue-400/40 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="sua senha"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-medium text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-zinc-400">
                Não tem conta?{' '}
                <Link to="/register" className="font-medium text-blue-300 transition hover:text-blue-200">
                  Cadastre-se aqui
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

