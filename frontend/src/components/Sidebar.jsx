import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
  BarChart3
} from 'lucide-react'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path ? 'bg-blue-700 text-white' : 'text-gray-200 hover:bg-gray-700'
  }

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', onClick: () => setIsOpen(false) },
    { icon: Wallet, label: 'Minhas Contas', path: '/accounts', onClick: () => setIsOpen(false) },
    { icon: Tag, label: 'Categorias', path: '/categories', onClick: () => setIsOpen(false) },
    { icon: Plus, label: 'Nova Transação', path: '/transactions/new', onClick: () => setIsOpen(false) },
    { icon: BarChart3, label: 'Relatórios', path: '/report', onClick: () => setIsOpen(false) },
    { icon: User, label: 'Meu Perfil', path: '/profile', onClick: () => setIsOpen(false) },
    { icon: Settings, label: 'Configurações', path: '/settings', onClick: () => setIsOpen(false) },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-blue-600 text-white p-2 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 lg:transform-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-blue-400">💰 FinApp</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={item.onClick}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(
                item.path
              )}`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 space-y-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors text-white"
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
