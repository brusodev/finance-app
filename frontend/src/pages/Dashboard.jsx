import React, { useState, useEffect } from 'react'
import { transactionsAPI, categoriesAPI, accountsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react'

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const balance = accountsBalance + totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <span className="text-sm text-gray-500">Bem-vindo, {user?.full_name || user?.username}</span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Saldo Total</p>
            <Wallet className="text-blue-500" size={20} />
          </div>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            R$ {balance.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Receitas</p>
            <ArrowUpCircle className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600">
            R$ {totalIncome.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Despesas</p>
            <ArrowDownCircle className="text-red-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-red-600">
            R$ {totalExpense.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Transações Recentes</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma transação registrada.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 text-sm">
                  <tr>
                    <th className="px-6 py-3 font-medium">Data</th>
                    <th className="px-6 py-3 font-medium">Categoria</th>
                    <th className="px-6 py-3 font-medium">Descrição</th>
                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.slice(0, 10).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 flex items-center gap-2">
                        <span>{t.category?.icon || '📁'}</span>
                        <span>{t.category?.name || 'Sem categoria'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{t.description}</td>
                      <td className={`px-6 py-4 text-sm font-medium text-right ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden divide-y divide-gray-100">
              {transactions.slice(0, 10).map((t) => (
                <div key={t.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                      {t.category?.icon || '📁'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.description}</p>
                      <p className="text-xs text-gray-500">{t.category?.name} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {t.amount > 0 ? '+' : '-'} R$ {Math.abs(t.amount).toFixed(2).replace('.', ',')}
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
