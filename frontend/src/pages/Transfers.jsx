import { useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { accountsAPI, transactionsAPI } from '../services/api'
import TransferForm from '../components/TransferForm'
import { getCurrencySymbol, formatDateLocal } from '../utils/formatters'

export default function Transfers() {
  const [accounts, setAccounts] = useState([])
  const [recentTransfers, setRecentTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('📥 Carregando contas e transferências...')

      // Carregar contas
      const accountsData = await accountsAPI.getAll()
      setAccounts(accountsData)

      // Carregar transações recentes do tipo "transfer"
      const allTransactions = await transactionsAPI.getAll(false) // Não usar cache
      const transfers = allTransactions.filter(t => t.transaction_type === 'transfer')

      // Agrupar por transfer_id
      const transfersMap = new Map()
      transfers.forEach(t => {
        if (t.transfer_id) {
          if (!transfersMap.has(t.transfer_id)) {
            transfersMap.set(t.transfer_id, [])
          }
          transfersMap.get(t.transfer_id).push(t)
        }
      })

      // Converter para array e ordenar por data
      const transfersList = Array.from(transfersMap.entries())
        .map(([transferId, transactions]) => {
          // Encontrar a transação de débito (valor negativo) e crédito (valor positivo)
          const fromTransaction = transactions.find(t => t.amount < 0)
          const toTransaction = transactions.find(t => t.amount > 0)

          return {
            id: transferId,
            date: fromTransaction?.date || toTransaction?.date,
            amount: Math.abs(fromTransaction?.amount || toTransaction?.amount || 0),
            description: fromTransaction?.description || toTransaction?.description,
            fromAccount: fromTransaction?.account,
            toAccount: toTransaction?.account,
            transactions: transactions,
          }
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10) // Últimas 10 transferências

      setRecentTransfers(transfersList)
      console.log('✅ Dados carregados:', { accounts: accountsData.length, transfers: transfersList.length })
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleTransferCreated = () => {
    console.log('✅ Transferência criada com sucesso!')
    loadData() // Recarregar dados
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Transferências entre Contas</h1>
        <p className="text-gray-600 dark:text-gray-400">Transfira valores entre suas contas de forma simples</p>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário de Transferência */}
        <div className="bg-white dark:bg-[#111111] rounded-lg shadow dark:shadow-zinc-800 p-6 border border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Nova Transferência</h2>
          <TransferForm
            accounts={accounts}
            onSubmit={handleTransferCreated}
          />
        </div>

        {/* Lista de Contas */}
        <div className="bg-white dark:bg-[#111111] rounded-lg shadow dark:shadow-zinc-800 p-6 border border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Suas Contas</h2>
          <div className="space-y-3">
            {accounts.filter(acc => acc.is_active).length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                Você precisa ter pelo menos 2 contas ativas para fazer transferências.
              </p>
            ) : (
              accounts
                .filter(acc => acc.is_active)
                .map((account) => (
                  <div
                    key={account.id}
                    className="flex justify-between items-center p-3 border border-zinc-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                  >
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{account.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{account.account_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${account.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {getCurrencySymbol(account.currency)} {account.balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Histórico de Transferências */}
      {recentTransfers.length > 0 && (
        <div className="mt-6 bg-white dark:bg-[#111111] rounded-lg shadow dark:shadow-zinc-800 p-6 border border-zinc-200 dark:border-white/[0.06]">
          <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">Transferências Recentes</h2>
          <div className="space-y-3">
            {recentTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className="flex justify-between items-center p-4 border border-zinc-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeftRight size={16} className="text-blue-500 dark:text-blue-400" />
                    <p className="font-medium text-zinc-900 dark:text-white">{transfer.description}</p>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p>
                      <span className="font-medium">De:</span> {transfer.fromAccount?.name}
                      {' → '}
                      <span className="font-medium">Para:</span> {transfer.toAccount?.name}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatDateLocal(transfer.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {getCurrencySymbol(transfer.fromAccount?.currency || 'BRL')} {transfer.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
