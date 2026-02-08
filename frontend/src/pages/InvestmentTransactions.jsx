import React, { useState, useEffect } from "react";
import { Plus, Filter } from "lucide-react";
import { investmentsAPI } from "../services/api";
import { formatCurrency, formatDateLocal } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const TRANSACTION_TYPES = [
  { value: "APORTE", label: "Aporte", color: "text-green-600 dark:text-green-400" },
  { value: "RESGATE", label: "Resgate", color: "text-red-600 dark:text-red-400" },
  { value: "RENDIMENTO", label: "Rendimento", color: "text-blue-600 dark:text-blue-400" },
  { value: "TAXA", label: "Taxa", color: "text-orange-600 dark:text-orange-400" },
];

export default function InvestmentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asset_id: "",
    date: new Date().toISOString().split('T')[0],
    type: "APORTE",
    amount_brl: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, assetsData] = await Promise.all([
        investmentsAPI.listTransactions(),
        investmentsAPI.listAssets(),
      ]);
      setTransactions(transactionsData);
      setAssets(assetsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        amount_brl: parseFloat(formData.amount_brl),
      };

      // Ajustar sinal do valor baseado no tipo
      if (submitData.type === "RESGATE" || submitData.type === "TAXA") {
        submitData.amount_brl = -Math.abs(submitData.amount_brl);
      } else {
        submitData.amount_brl = Math.abs(submitData.amount_brl);
      }

      await investmentsAPI.createTransaction(submitData);
      await fetchData();
      setFormData({
        asset_id: "",
        date: new Date().toISOString().split('T')[0],
        type: "APORTE",
        amount_brl: "",
        notes: "",
      });
      setShowForm(false);
    } catch (err) {
      alert(err.detail || "Erro ao salvar transação");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Movimentações</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span className="whitespace-nowrap">Nova Movimentação</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Ativo
                </label>
                <select
                  required
                  value={formData.asset_id}
                  onChange={(e) => setFormData({ ...formData, asset_id: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="">Selecione um ativo</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  {TRANSACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount_brl}
                  onChange={(e) => setFormData({ ...formData, amount_brl: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Observações (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {transactions.map((transaction) => {
          const typeConfig = TRANSACTION_TYPES.find(t => t.value === transaction.type);
          const asset = assets.find(a => a.id === transaction.asset_id);

          return (
            <div
              key={transaction.id}
              className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${typeConfig?.color}`}>
                      {typeConfig?.label}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">•</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {asset?.name}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatDateLocal(transaction.date)}
                  </p>
                  {transaction.notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                      {transaction.notes}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${transaction.amount_brl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {transaction.amount_brl >= 0 ? '+' : ''}{formatCurrency(transaction.amount_brl, user?.currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            Nenhuma movimentação registrada
          </p>
        </div>
      )}
    </div>
  );
}
