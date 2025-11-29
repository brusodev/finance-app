export default function TransactionList({ transactions, categories, onDelete, onEdit }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : 'Sem categoria'
  }

  const getCategoryColor = (categoryId) => {
    const colors = {
      1: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
      2: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
      3: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
      4: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
      5: 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
    }
    return colors[categoryId] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const sortedTransactions = [...transactions].sort((a, b) => {
    return new Date(b.date) - new Date(a.date)
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Descrição</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Categoria</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">Valor</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                {/* Data */}
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {formatDate(transaction.date)}
                </td>

                {/* Descrição */}
                <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                  {transaction.description}
                </td>

                {/* Categoria */}
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      transaction.category_id
                    )}`}
                  >
                    {getCategoryName(transaction.category_id)}
                  </span>
                </td>

                {/* Valor */}
                <td
                  className={`px-6 py-4 text-sm font-semibold text-right ${
                    transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}R${' '}
                  {transaction.amount.toFixed(2).replace('.', ',')}
                </td>

                {/* Ações */}
                <td className="px-6 py-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(transaction)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Deletar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé com contagem */}
      <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total de transações: <span className="font-semibold">{transactions.length}</span>
        </p>
      </div>
    </div>
  )
}
