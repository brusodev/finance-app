import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSidebar } from './Layout'
import {
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  Tag,
  User,
  BarChart3,
  ArrowRightLeft,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ChevronDown,
  DollarSign,
  List,
  Target
} from 'lucide-react'

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [investmentsExpanded, setInvestmentsExpanded] = useState(false)
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Auto-expand investments submenu if on investment page
  React.useEffect(() => {
    if (location.pathname.startsWith('/investimentos')) {
      setInvestmentsExpanded(true)
    }
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    const isMatch = location.pathname === path
    return isMatch
      ? 'bg-blue-600 dark:bg-blue-700 text-white'
      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
  }

  const isInvestmentActive = () => {
    return location.pathname.startsWith('/investimentos')
      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'new-transaction', icon: Plus, label: 'Nova Transação', path: '/nova-transacao' },
    {
      id: 'divider-1',
      type: 'divider',
      label: 'Gestão Financeira'
    },
    { id: 'accounts', icon: Wallet, label: 'Minhas Contas', path: '/accounts' },
    { id: 'categories', icon: Tag, label: 'Categorias', path: '/categories' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Transações', path: '/transacoes' },
    { id: 'transfers', icon: ArrowLeftRight, label: 'Transferências', path: '/transfers' },
    {
      id: 'divider-2',
      type: 'divider',
      label: 'Análise'
    },
    { id: 'report', icon: BarChart3, label: 'Relatórios', path: '/report' },
    {
      id: 'divider-3',
      type: 'divider',
      label: 'Configurações'
    },
    { id: 'profile', icon: User, label: 'Meu Perfil', path: '/profile' },
    { id: 'settings', icon: Settings, label: 'Configurações', path: '/settings' },
  ]

  const investmentSubItems = [
    { id: 'investments-dashboard', icon: TrendingUp, label: 'Dashboard', path: '/investimentos' },
    { id: 'investments-assets', icon: DollarSign, label: 'Ativos', path: '/investimentos/ativos' },
    { id: 'investments-transactions', icon: List, label: 'Movimentações', path: '/investimentos/movimentacoes' },
    { id: 'investments-goal', icon: Target, label: 'Meta', path: '/investimentos/meta' },
  ]

  return (
    <>
      {/* Mobile Toggle Button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Desktop Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`hidden lg:block fixed top-4 z-50 bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all ${
          isCollapsed ? 'left-[72px]' : 'left-[248px]'
        }`}
        aria-label={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-zinc-900 text-zinc-800 dark:text-white shadow-lg transform transition-all duration-300 ease-in-out z-40 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${
          // Mobile
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          // Desktop - width control
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64`}
      >
        {/* Logo/Header */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center overflow-hidden">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
              📈 Prospera
            </h1>
          )}
          {isCollapsed && (
            <h1 className="text-2xl mx-auto">📈</h1>
          )}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Profile Section */}
        {user && (
          <Link
            to="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex-shrink-0 block p-4 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors overflow-hidden"
            title={isCollapsed ? user.full_name || user.username : ''}
          >
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className={`rounded-full object-cover border-2 border-blue-500 flex-shrink-0 ${
                    isCollapsed ? 'w-10 h-10' : 'w-12 h-12'
                  }`}
                />
              ) : (
                <div className={`rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold border-2 border-blue-500 flex-shrink-0 ${
                  isCollapsed ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg'
                }`}>
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              {/* User Info */}
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-white truncate">
                    {user.full_name || user.username}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email || 'Ver perfil'}
                  </p>
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Navigation - Scrollable */}
        <nav className="flex-1 mt-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuItems.map((item) => {
            // Render divider
            if (item.type === 'divider') {
              if (isCollapsed) {
                return (
                  <div key={item.id} className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
                )
              }
              return (
                <div key={item.id} className="px-3 pt-4 pb-2">
                  <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              )
            }

            // Render normal link
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg transition-colors ${isActive(item.path)}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}

          {/* Investments Section with Submenu */}
          <div className="mt-2">
            {!isCollapsed && (
              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  Investimentos
                </p>
              </div>
            )}

            {isCollapsed ? (
              // Collapsed: Just show main icon that links to dashboard
              <Link
                to="/investimentos"
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center justify-center px-2 py-3 rounded-lg transition-colors ${
                  location.pathname.startsWith('/investimentos')
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title="Investimentos"
              >
                <TrendingUp size={20} className="flex-shrink-0" />
              </Link>
            ) : (
              // Expanded: Show submenu
              <>
                <button
                  onClick={() => setInvestmentsExpanded(!investmentsExpanded)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${isInvestmentActive()}`}
                >
                  <div className="flex items-center space-x-3">
                    <TrendingUp size={20} className="flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap">Investimentos</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${investmentsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {investmentsExpanded && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-2">
                    {investmentSubItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        to={subItem.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-sm ${isActive(subItem.path)}`}
                      >
                        <subItem.icon size={16} className="flex-shrink-0" />
                        <span className="font-medium whitespace-nowrap">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </nav>

        {/* Bottom Section - Logout */}
        <div className="flex-shrink-0 p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
