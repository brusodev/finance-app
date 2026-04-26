import React, { useState, useEffect } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { investmentsAPI, accountsAPI } from "../services/api";
import { formatCurrency, formatDateLocal } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

const TRANSACTION_TYPES = [
  { value: "APORTE", label: "Aporte", color: "text-green-600 dark:text-green-400" },
  { value: "RESGATE", label: "Resgate", color: "text-red-600 dark:text-red-400" },
  { value: "RENDIMENTO", label: "Rendimento", color: "text-blue-600 dark:text-blue-400" },
  { value: "TAXA", label: "Taxa", color: "text-orange-600 dark:text-orange-400" },
];

const EMPTY_FORM = {
  asset_id: "",
  date: new Date().toISOString().split('T')[0],
  type: "APORTE",
  amount_brl: "",
  notes: "",
  account_id: "",
};

export default function InvestmentTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [transactionsData, assetsData, accountsData] = await Promise.all([
        investmentsAPI.listTransactions(),
        investmentsAPI.listAssets(),
        accountsAPI.getAll(),
      ]);
      setTransactions(transactionsData);
      setAssets(assetsData);
      setAccounts(accountsData.filter(a => a.is_active && a.account_type !== 'credit_card'));
    } catch (err) {
      setFormError("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const needsAccount = formData.type === "APORTE" || formData.type === "RESGATE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const amount = parseFloat(formData.amount_brl);
      const submitData = {
        ...formData,
        asset_id: parseInt(formData.asset_id),
        amount_brl: formData.type === "RESGATE" || formData.type === "TAXA"
          ? -Math.abs(amount)
          : Math.abs(amount),
        account_id: needsAccount && formData.account_id ? parseInt(formData.account_id) : null,
        notes: formData.notes || null,
      };

      await investmentsAPI.createTransaction(submitData);
      await fetchData();
      setFormData(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setFormError(err.detail || "Erro ao salvar transação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await investmentsAPI.deleteTransaction(id);
      await fetchData();
    } catch (err) {
      setFormError(err.detail || "Erro ao excluir transação");
    }
  };

  const inputCls = "w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Movimentações</h1>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ativo</label>
                <select
                  required
                  value={formData.asset_id}
                  onChange={e => setFormData({ ...formData, asset_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Selecione um ativo</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tipo</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value, account_id: "" })}
                  className={inputCls}
                >
                  {TRANSACTION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formData.amount_brl}
                  onChange={e => setFormData({ ...formData, amount_brl: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Data</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            {needsAccount && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Conta bancária{" "}
                  <span className="text-zinc-400 font-normal">
                    ({formData.type === "APORTE" ? "débito automático" : "crédito automático"} — opcional)
                  </span>
                </label>
                <select
                  value={formData.account_id}
                  onChange={e => setFormData({ ...formData, account_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Não vincular conta</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
                {formData.account_id && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {formData.type === "APORTE"
                      ? "O valor será debitado automaticamente desta conta."
                      : "O valor será creditado automaticamente nesta conta."}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Observações (opcional)</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className={inputCls}
              />
            </div>

            {formError && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(""); }}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {transactions.map(transaction => {
          const typeConfig = TRANSACTION_TYPES.find(t => t.value === transaction.type);
          const asset = assets.find(a => a.id === transaction.asset_id);
          const linkedAccount = transaction.account_id
            ? accounts.find(a => a.id === transaction.account_id)
            : null;

          return (
            <div
              key={transaction.id}
              className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold ${typeConfig?.color}`}>
                      {typeConfig?.label}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">•</span>
                    <span className="text-zinc-700 dark:text-zinc-300 truncate">{asset?.name}</span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    {formatDateLocal(transaction.date)}
                  </p>
                  {linkedAccount && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                      {transaction.type === "APORTE" ? "Debitado de" : "Creditado em"}: {linkedAccount.name}
                    </p>
                  )}
                  {transaction.notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{transaction.notes}</p>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <p className={`text-lg font-bold whitespace-nowrap ${transaction.amount_brl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {transaction.amount_brl >= 0 ? '+' : ''}{formatCurrency(transaction.amount_brl, user?.currency)}
                  </p>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">Nenhuma movimentação registrada</p>
        </div>
      )}
    </div>
  );
}
