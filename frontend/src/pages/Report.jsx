import React, { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,00';
  }
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [periodData, setPeriodData] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      // Get current month start and end dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [dashboardRes, categoryRes, periodRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`, { headers }),
        fetch(`${API_URL}/transactions/totals/by-category`, { headers }),
        fetch(`${API_URL}/transactions/totals/by-period?start=${startDate}&end=${endDate}`, { headers })
      ]);

      if (!dashboardRes.ok || !categoryRes.ok || !periodRes.ok) {
        throw new Error('Erro ao carregar dados dos relatórios');
      }

      const dashboard = await dashboardRes.json();
      const categories = await categoryRes.json();
      const period = await periodRes.json();

      setDashboardData(dashboard);
      setCategoryData(categories);
      setPeriodData(period);
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatórios');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Carregando relatórios">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios Financeiros</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios Financeiros</h1>

      {/* Dashboard Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total de Contas</p>
              <Wallet className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.total_accounts}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Saldo Total</p>
              <Wallet className="text-purple-500" size={20} />
            </div>
            <p className={`text-2xl font-bold ${dashboardData.total_balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              R$ {formatCurrency(dashboardData.total_balance)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Receitas</p>
              <ArrowUpCircle className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {formatCurrency(dashboardData.total_income)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Despesas</p>
              <ArrowDownCircle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              R$ {formatCurrency(dashboardData.total_expense)}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <BarChart3 size={24} />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white">Despesas por Categoria</h3>
        </div>

        {categoryData && categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.category_id} className="border-b border-gray-100 dark:border-gray-700 pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">{category.category_name}</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    R$ {formatCurrency(Math.abs(category.total_expense))}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{category.transaction_count} transações</span>
                  {category.total_income > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      Receita: R$ {formatCurrency(category.total_income)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500">
            Nenhuma transação encontrada
          </div>
        )}
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Fluxo de Caixa do Mês</h3>
          </div>

          {periodData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Receitas</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  R$ {formatCurrency(periodData.total_income)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Despesas</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  R$ {formatCurrency(Math.abs(periodData.total_expense))}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-white">Saldo</span>
                  <span className={`font-bold text-lg ${periodData.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    R$ {formatCurrency(periodData.balance)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                {periodData.transaction_count} transações no período
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500">
              Sem dados
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <PieChart size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Resumo Geral</h3>
          </div>

          {dashboardData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total de Categorias</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {dashboardData.total_categories}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total de Transações</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {dashboardData.total_transactions}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800 dark:text-white">Saldo Líquido</span>
                  <span className={`font-bold text-lg ${dashboardData.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    R$ {formatCurrency(dashboardData.net_balance)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500">
              Sem dados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
