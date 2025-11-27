import { useState, useEffect } from 'react'

export default function TransactionForm({ categories, initialData, onSubmit, onCancel }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState('')
  const [transactionType, setTransactionType] = useState('income')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (initialData) {
      setAmount(Math.abs(initialData.amount).toString())
      setDescription(initialData.description)
      setCategoryId(initialData.category_id.toString())
      setDate(initialData.date)
      setTransactionType(initialData.transaction_type || 'income')
    } else {
      // Definir data de hoje como padrão
      const today = new Date().toISOString().split('T')[0]
      setDate(today)
      setTransactionType('income')
    }
  }, [initialData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validações
      if (!amount || !description || !categoryId || !date) {
        setError('Todos os campos são obrigatórios')
        setLoading(false)
        return
      }

      let parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount)) {
        setError('Valor deve ser um número válido')
        setLoading(false)
        return
      }

      // Se for despesa, fazer o valor negativo
      if (transactionType === 'expense') {
        parsedAmount = Math.abs(parsedAmount) * -1
      } else {
        parsedAmount = Math.abs(parsedAmount)
      }

      // Enviar dados
      const formData = {
        amount: parsedAmount,
        description: description.trim(),
        category_id: parseInt(categoryId),
        date,
        transaction_type: transactionType
      }

      await onSubmit(formData)

      // Resetar formulário se não estiver editando
      if (!initialData) {
        setAmount('')
        setDescription('')
        setCategoryId('')
        const today = new Date().toISOString().split('T')[0]
        setDate(today)
        setTransactionType('income')
      }
    } catch (err) {
      setError(err.message || 'Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === parseInt(categoryId))
    return category ? category.name : ''
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {initialData ? 'Editar Transação' : 'Adicionar Nova Transação'}
      </h2>

      {/* Erro */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de Transação */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              id="type"
              required
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            >
              <option value="income">Receita (Entrada)</option>
              <option value="expense">Despesa (Saída)</option>
            </select>
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="0.00"
              disabled={loading}
            />
            <p className="text-gray-500 text-xs mt-1">Digite o valor sem sinal</p>
          </div>

          {/* Data */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              id="date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            />
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              disabled={loading}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Descrição (ocupará 2 colunas em grid 2 cols) */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Descreva a transação..."
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white font-medium py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Salvando...' : initialData ? 'Atualizar' : 'Adicionar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 bg-gray-200 text-gray-700 font-medium py-2 rounded-md hover:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
