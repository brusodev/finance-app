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
  ChevronRight
} from 'lucide-react'

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path
      ? 'bg-blue-600 dark:bg-blue-700 text-white'
      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'accounts', icon: Wallet, label: 'Minhas Contas', path: '/accounts' },
    { id: 'categories', icon: Tag, label: 'Categorias', path: '/categories' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Transações', path: '/transacoes' },
    { id: 'transfers', icon: ArrowLeftRight, label: 'Transferências', path: '/transfers' },
    { id: 'new-transaction', icon: Plus, label: 'Nova Transação', path: '/nova-transacao' },
    { id: 'report', icon: BarChart3, label: 'Relatórios', path: '/report' },
    { id: 'profile', icon: User, label: 'Meu Perfil', path: '/profile' },
    { id: 'settings', icon: Settings, label: 'Configurações', path: '/settings' },
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
              💰 FinApp
            </h1>
          )}
          {isCollapsed && (
            <h1 className="text-2xl mx-auto">💰</h1>
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
          {menuItems.map((item) => (
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
          ))}
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
