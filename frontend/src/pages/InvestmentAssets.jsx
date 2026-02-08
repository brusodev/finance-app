import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { investmentsAPI } from "../services/api";
import { formatDateLocal } from "../utils/formatters";

const ASSET_TYPES = [
  { value: "TESOURO", label: "Tesouro Direto" },
  { value: "CDB", label: "CDB" },
  { value: "ETF", label: "ETF" },
  { value: "FII", label: "FII" },
  { value: "ACAO", label: "Ação" },
  { value: "CRIPTO", label: "Criptomoeda" },
  { value: "OUTRO", label: "Outro" },
];

export default function InvestmentAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "TESOURO",
    broker: "",
    currency: "BRL",
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await investmentsAPI.listAssets();
      setAssets(data);
    } catch (err) {
      setError(err.detail || "Erro ao carregar ativos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await investmentsAPI.updateAsset(editingAsset.id, formData);
      } else {
        await investmentsAPI.createAsset(formData);
      }
      await fetchAssets();
      resetForm();
    } catch (err) {
      setError(err.detail || "Erro ao salvar ativo");
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      broker: asset.broker || "",
      currency: asset.currency,
    });
    setShowForm(true);
  };

  const handleDelete = async (assetId) => {
    if (!confirm("Deseja realmente excluir este ativo? Todas as transações associadas serão removidas.")) return;
    try {
      await investmentsAPI.deleteAsset(assetId);
      await fetchAssets();
    } catch (err) {
      setError(err.detail || "Erro ao excluir ativo");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", type: "TESOURO", broker: "", currency: "BRL" });
    setEditingAsset(null);
    setShowForm(false);
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
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Ativos</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          <span className="whitespace-nowrap">Novo Ativo</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">
            {editingAsset ? "Editar Ativo" : "Novo Ativo"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome do Ativo
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Ex: Tesouro Selic 2029"
                />
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
                  {ASSET_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Corretora (opcional)
                </label>
                <input
                  type="text"
                  value={formData.broker}
                  onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  placeholder="Ex: Clear, XP, Rico"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingAsset ? "Atualizar" : "Criar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {assets.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <Building2 className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-2">
            Nenhum ativo cadastrado
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400">
            Comece criando seu primeiro ativo de investimento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {ASSET_TYPES.find((t) => t.value === asset.type)?.label || asset.type}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(asset)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {asset.broker && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Corretora: {asset.broker}
                </p>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                Criado em {formatDateLocal(asset.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
