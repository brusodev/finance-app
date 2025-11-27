export default function TransactionList({ transactions, categories, onDelete, onEdit }) {
  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : 'Sem categoria'
  }

  const getCategoryColor = (categoryId) => {
    const colors = {
      1: 'bg-blue-100 text-blue-800',
      2: 'bg-green-100 text-green-800',
      3: 'bg-red-100 text-red-800',
      4: 'bg-yellow-100 text-yellow-800',
      5: 'bg-purple-100 text-purple-800'
    }
    return colors[categoryId] || 'bg-gray-100 text-gray-800'
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
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Data</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descrição</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Categoria</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Valor</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                {/* Data */}
                <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                  {formatDate(transaction.date)}
                </td>

                {/* Descrição */}
                <td className="px-6 py-4 text-sm text-gray-700">
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
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
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
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded text-sm font-medium transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(transaction.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded text-sm font-medium transition-colors"
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
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total de transações: <span className="font-semibold">{transactions.length}</span>
        </p>
      </div>
    </div>
  )
}
