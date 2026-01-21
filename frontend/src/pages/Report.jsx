import React, { useState, useEffect } from "react";
import { BarChart3, PieChart, TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatCurrency } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Report() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [periodData, setPeriodData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [availableMonths, setAvailableMonths] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      // Get dates based on selectedMonth
      let startDate, endDate;
      const now = new Date();

      if (selectedMonth === 'current') {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      } else {
        const [year, month] = selectedMonth.split('-');
        startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      }

      const [dashboardRes, categoryRes, periodRes, transactionsRes] = await Promise.all([
        fetch(`${API_URL}/dashboard?start_date=${startDate}&end_date=${endDate}`, { headers }),
        fetch(`${API_URL}/transactions/totals/by-category?start_date=${startDate}&end_date=${endDate}`, { headers }),
        fetch(`${API_URL}/transactions/totals/by-period?start=${startDate}&end=${endDate}`, { headers }),
        fetch(`${API_URL}/transactions/`, { headers })
      ]);

      if (!dashboardRes.ok || !categoryRes.ok || !periodRes.ok || !transactionsRes.ok) {
        throw new Error('Erro ao carregar dados dos relatórios');
      }

      const dashboard = await dashboardRes.json();
      const categories = await categoryRes.json();
      const period = await periodRes.json();
      const transactions = await transactionsRes.json();

      // Extract available months from transactions
      const monthsSet = new Set();
      transactions.forEach(t => {
        const date = new Date(t.date + 'T00:00:00');
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(monthKey);
      });
      setAvailableMonths(Array.from(monthsSet).sort().reverse());

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

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
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
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Relatórios Financeiros</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Relatórios Financeiros</h1>
        <div className="w-full sm:w-64">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
          >
            <option value="current">Mês Atual</option>
            {availableMonths.length > 0 && <option disabled>─────────────</option>}
            {availableMonths.map(monthKey => (
              <option key={monthKey} value={monthKey}>
                {formatMonthDisplay(monthKey)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Total de Contas</p>
              <Wallet className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">
              {dashboardData.total_accounts}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Saldo Total</p>
              <Wallet className="text-purple-500" size={20} />
            </div>
            <p className={`text-2xl font-bold ${dashboardData.total_balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dashboardData.total_balance, user?.currency)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Receitas</p>
              <ArrowUpCircle className="text-green-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(dashboardData.total_income, user?.currency)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Despesas</p>
              <ArrowDownCircle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(dashboardData.total_expense, user?.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <BarChart3 size={24} />
          </div>
          <h3 className="font-semibold text-zinc-800 dark:text-white">Despesas por Categoria</h3>
        </div>

        {categoryData && categoryData.length > 0 ? (
          <div className="space-y-4">
            {categoryData.map((category) => (
              <div key={category.category_id} className="border-b border-zinc-100 dark:border-zinc-700 pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-zinc-800 dark:text-white">{category.category_name}</span>
                  <span className="text-red-600 dark:text-red-400 font-semibold">
                    {formatCurrency(Math.abs(category.total_expense), user?.currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                  <span>{category.transaction_count} transações</span>
                  {category.total_income > 0 && (
                    <span className="text-green-600 dark:text-green-400">
                      Receita: {formatCurrency(category.total_income, user?.currency)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-zinc-50 dark:bg-zinc-700 rounded-lg text-zinc-400 dark:text-zinc-500">
            Nenhuma transação encontrada
          </div>
        )}
      </div>

      {/* Period Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-zinc-800 dark:text-white">Fluxo de Caixa do Mês</h3>
          </div>

          {periodData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Receitas</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  {formatCurrency(periodData.total_income, user?.currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Despesas</span>
                <span className="text-red-600 dark:text-red-400 font-semibold">
                  {formatCurrency(Math.abs(periodData.total_expense), user?.currency)}
                </span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-800 dark:text-white">Saldo</span>
                  <span className={`font-bold text-lg ${periodData.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(periodData.balance, user?.currency)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-4">
                {periodData.transaction_count} transações no período
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-zinc-50 dark:bg-zinc-700 rounded-lg text-zinc-400 dark:text-zinc-500">
              Sem dados
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <PieChart size={24} />
            </div>
            <h3 className="font-semibold text-zinc-800 dark:text-white">Resumo Geral</h3>
          </div>

          {dashboardData ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Total de Categorias</span>
                <span className="font-semibold text-zinc-800 dark:text-white">
                  {dashboardData.total_categories}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-600 dark:text-zinc-400">Total de Transações</span>
                <span className="font-semibold text-zinc-800 dark:text-white">
                  {dashboardData.total_transactions}
                </span>
              </div>
              <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-zinc-800 dark:text-white">Saldo Líquido</span>
                  <span className={`font-bold text-lg ${dashboardData.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(dashboardData.net_balance, user?.currency)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center bg-zinc-50 dark:bg-zinc-700 rounded-lg text-zinc-400 dark:text-zinc-500">
              Sem dados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

