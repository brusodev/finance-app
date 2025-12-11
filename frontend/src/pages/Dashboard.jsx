import React, { useState, useEffect } from 'react'
import { transactionsAPI, categoriesAPI, accountsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [accountsBalance, setAccountsBalance] = useState(0)
  
  const { user } = useAuth()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [categoriesData, transactionsData, accountsData] = await Promise.all([
        categoriesAPI.getAll(),
        transactionsAPI.getAll(),
        accountsAPI.getAll()
      ])
      setCategories(categoriesData)
      setTransactions(transactionsData)
      setAccounts(accountsData)
      calculateTotals(transactionsData, accountsData)
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Erro ao carregar dados'
      setError(errorMessage)
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotals = (txns, accts = []) => {
    let income = 0
    let expense = 0
    let accBalance = 0
    accts.forEach((acc) => { accBalance += acc.balance })
    txns.forEach((txn) => {
      if (txn.amount > 0) income += txn.amount
      else expense += Math.abs(txn.amount)
    })
    setAccountsBalance(accBalance)
    setTotalIncome(income)
    setTotalExpense(expense)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Carregando dados">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const balance = accountsBalance + totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">Bem-vindo, {user?.full_name || user?.username}</span>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Saldo Total</p>
            <Wallet className="text-blue-500" size={20} />
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
            R$ {formatCurrency(balance)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Receitas</p>
            <ArrowUpCircle className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {formatCurrency(totalIncome)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Despesas</p>
            <ArrowDownCircle className="text-red-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            R$ {formatCurrency(totalExpense)}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Transações Recentes</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhuma transação registrada.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.slice(0, 10).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white flex items-center gap-2">
                        <span>{t.category?.icon || '📁'}</span>
                        <span>{t.category?.name || 'Sem categoria'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{t.description}</td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        R$ {formatCurrency(Math.abs(t.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                      {t.category?.icon || '📁'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.category?.name} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.amount > 0 ? '+' : '-'} R$ {formatCurrency(Math.abs(t.amount))}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
