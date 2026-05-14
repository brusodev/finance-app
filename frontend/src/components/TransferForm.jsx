import { useState, useEffect } from 'react'
import { transfersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { getCurrencySymbol } from '../utils/formatters'

export default function TransferForm({ accounts, onSubmit, onCancel }) {
  const { user } = useAuth()
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Definir data de hoje como padrão
    const today = new Date().toISOString().split('T')[0]
    setDate(today)
    setDescription('Transferência entre contas')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações
      if (!amount || !fromAccountId || !toAccountId || !date) {
        setError('Todos os campos são obrigatórios')
        setLoading(false)
        return
      }

      if (fromAccountId === toAccountId) {
        setError('As contas de origem e destino devem ser diferentes')
        setLoading(false)
        return
      }

      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Valor deve ser um número positivo')
        setLoading(false)
        return
      }

      // Enviar dados
      const transferData = {
        from_account_id: parseInt(fromAccountId),
        to_account_id: parseInt(toAccountId),
        amount: parsedAmount,
        date: date,
        description: description,
      }

      console.log('📤 Enviando transferência:', transferData)
      const result = await transfersAPI.create(transferData)
      console.log('✅ Transferência criada:', result)

      // Resetar formulário
      setAmount('')
      setDescription('Transferência entre contas')
      setFromAccountId('')
      setToAccountId('')
      const today = new Date().toISOString().split('T')[0]
      setDate(today)

      // Chamar callback
      if (onSubmit) {
        onSubmit(result)
      }
    } catch (err) {
      console.error('❌ Erro ao criar transferência:', err)
      setError(err.detail || 'Erro ao criar transferência')
    } finally {
      setLoading(false)
    }
  }

  const activeAccounts = accounts.filter(acc => acc.is_active)

  const fromAccount = activeAccounts.find(acc => acc.id === parseInt(fromAccountId))
  const toAccount = activeAccounts.find(acc => acc.id === parseInt(toAccountId))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Conta de Origem */}
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Conta de Origem
        </label>
        <select
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
          required
        >
          <option value="">Selecione a conta de origem</option>
          {activeAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({getCurrencySymbol(account.currency)} {account.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Conta de Destino */}
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Conta de Destino
        </label>
        <select
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
          required
        >
          <option value="">Selecione a conta de destino</option>
          {activeAccounts.map((account) => (
            <option
              key={account.id}
              value={account.id}
              disabled={account.id === parseInt(fromAccountId)}
            >
              {account.name} ({getCurrencySymbol(account.currency)} {account.balance.toFixed(2)})
            </option>
          ))}
        </select>
      </div>

      {/* Valor */}
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Valor
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            {getCurrencySymbol(user?.currency || 'BRL')}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
            placeholder="0.00"
            required
          />
        </div>
        {fromAccount && amount && parseFloat(amount) > fromAccount.balance && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">
            ⚠️ Saldo insuficiente na conta de origem
          </p>
        )}
      </div>

      {/* Data */}
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Data
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
          required
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
          Descrição
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
          placeholder="Descrição da transferência"
        />
      </div>

      {/* Preview da Transferência */}
      {fromAccount && toAccount && amount && parseFloat(amount) > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900 dark:text-blue-300">Preview da Transferência</h4>
          <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <p>
              <span className="font-medium">De:</span> {fromAccount.name}
              <span className="ml-2 text-red-600 dark:text-red-400">
                -{getCurrencySymbol(fromAccount.currency)} {parseFloat(amount).toFixed(2)}
              </span>
            </p>
            <p>
              <span className="font-medium">Saldo após:</span> {getCurrencySymbol(fromAccount.currency)} {(fromAccount.balance - parseFloat(amount)).toFixed(2)}
            </p>
            <div className="border-t border-blue-300 dark:border-blue-700 my-2"></div>
            <p>
              <span className="font-medium">Para:</span> {toAccount.name}
              <span className="ml-2 text-green-600 dark:text-green-400">
                +{getCurrencySymbol(toAccount.currency)} {parseFloat(amount).toFixed(2)}
              </span>
            </p>
            <p>
              <span className="font-medium">Saldo após:</span> {getCurrencySymbol(toAccount.currency)} {(toAccount.balance + parseFloat(amount)).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-500 dark:bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          {loading ? 'Criando...' : 'Criar Transferência'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-zinc-900 dark:text-white"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
