import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
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
  ArrowRightLeft
} from 'lucide-react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
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
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'accounts', icon: Wallet, label: 'Minhas Contas', path: '/accounts' },
    { id: 'categories', icon: Tag, label: 'Categorias', path: '/categories' },
    { id: 'transactions', icon: ArrowRightLeft, label: 'Transações', path: '/transacoes' },
    { id: 'new-transaction', icon: Plus, label: 'Nova Transação', path: '/nova-transacao' },
    { id: 'report', icon: BarChart3, label: 'Relatórios', path: '/report' },
    { id: 'profile', icon: User, label: 'Meu Perfil', path: '/profile' },
    { id: 'settings', icon: Settings, label: 'Configurações', path: '/settings' },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-lg shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 text-gray-800 dark:text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 lg:transform-none border-r border-gray-200 dark:border-gray-800 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">💰 FinApp</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Profile Section */}
        {user && (
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex-shrink-0 block p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold border-2 border-blue-500">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {user.full_name || user.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email || 'Ver perfil'}
                </p>
              </div>
            </div>
          </Link>
        )}

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(item.path)}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-800 space-y-2 bg-white dark:bg-gray-900">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
