import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateLocal } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { transactionsAPI } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL;

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
  '#14b8a6', '#e11d48', '#d97706', '#7c3aed', '#0891b2',
];

function SpendingBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function CategoryBarChart({ categories, maxExpense, currency }) {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const expense = Math.abs(cat.total_expense);
        const pct = maxExpense > 0 ? ((expense / maxExpense) * 100).toFixed(1) : 0;
        const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
        const barWidth = maxExpense > 0 ? Math.max((expense / maxExpense) * 100, 1) : 0;

        return (
          <div key={cat.category_id} className="flex items-center gap-3">
            <div className="w-28 sm:w-36 shrink-0 text-right">
              <span className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 truncate block">
                {cat.category_name}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-5 relative overflow-hidden">
                  <div
                    className="h-5 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  >
                    {barWidth > 25 && (
                      <span className="text-white text-xs font-medium">{pct}%</span>
                    )}
                  </div>
                </div>
                {barWidth <= 25 && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">{pct}%</span>
                )}
              </div>
            </div>
            <div className="w-24 sm:w-32 shrink-0 text-right">
              <span className="text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(expense, currency)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ income, expense }) {
  const total = income + expense;
  if (total === 0) return null;

  const incomeAngle = (income / total) * 360;
  const expenseAngle = (expense / total) * 360;

  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (cx, cy, r, startAngle, sweepAngle, color) => {
    if (sweepAngle >= 360) sweepAngle = 359.99;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, startAngle + sweepAngle);
    const largeArc = sweepAngle > 180 ? 1 : 0;
    return (
      <path
        d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`}
        fill="none"
        stroke={color}
        strokeWidth="18"
        strokeLinecap="round"
      />
    );
  };

  return (
    <svg viewBox="0 0 120 120" className="w-28 h-28 sm:w-36 sm:h-36">
      {arcPath(60, 60, 45, 0, expenseAngle, '#ef4444')}
      {arcPath(60, 60, 45, expenseAngle + 2, incomeAngle, '#10b981')}
      <text x="60" y="55" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300" fontSize="9" fontWeight="600">
        {total > 0 ? ((expense / total) * 100).toFixed(0) : 0}%
      </text>
      <text x="60" y="67" textAnchor="middle" className="fill-zinc-500" fontSize="7">
        despesas
      </text>
    </svg>
  );
}

export default function Report() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [periodData, setPeriodData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('current');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [activeTab, setActiveTab] = useState('grafico');

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError('');

      const fetchOpts = { headers: { "Content-Type": "application/json" }, credentials: "include" };

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

      const [dashboardRes, categoryRes, periodRes, transactions] = await Promise.all([
        fetch(`${API_URL}/dashboard?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        fetch(`${API_URL}/transactions/totals/by-category?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        fetch(`${API_URL}/transactions/totals/by-period?start=${startDate}&end=${endDate}`, fetchOpts),
        transactionsAPI.getAll(false, 5000)
      ]);

      if (!dashboardRes.ok || !categoryRes.ok || !periodRes.ok) {
        throw new Error('Erro ao carregar dados dos relatórios');
      }

      const dashboard = await dashboardRes.json();
      const categories = await categoryRes.json();
      const period = await periodRes.json();

      const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);

      const monthsSet = new Set();
      transactions.forEach(t => {
        const date = new Date(t.date + 'T00:00:00');
        monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      });
      setAvailableMonths(Array.from(monthsSet).sort().reverse());

      setDashboardData(dashboard);
      setCategoryData(categories.sort((a, b) => Math.abs(b.total_expense) - Math.abs(a.total_expense)));
      setPeriodData(period);
      setAllTransactions(filteredTransactions);
    } catch (err) {
      setError(err.message || 'Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    const next = new Set(expandedCategories);
    next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
    setExpandedCategories(next);
  };

  const getTransactionsForCategory = (categoryId) =>
    allTransactions
      .filter(t => t.category?.id === categoryId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatMonthDisplay = (monthKey) => {
    const [year, month] = monthKey.split('-');
    return `${MONTH_NAMES[parseInt(month) - 1]} ${year}`;
  };

  const onlyExpenses = categoryData.filter(c => Math.abs(c.total_expense) > 0);
  const maxExpense = onlyExpenses.length > 0 ? Math.abs(onlyExpenses[0].total_expense) : 0;
  const totalExpense = onlyExpenses.reduce((s, c) => s + Math.abs(c.total_expense), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Relatórios Financeiros</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
        >
          <option value="current">Mês Atual</option>
          {availableMonths.length > 0 && <option disabled>─────────────</option>}
          {availableMonths.map(k => (
            <option key={k} value={k}>{formatMonthDisplay(k)}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {dashboardData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Saldo Total</p>
              <Wallet className="text-blue-500" size={16} />
            </div>
            <p className={`text-xl font-bold ${dashboardData.total_balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dashboardData.total_balance, user?.currency)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Saldo do Mês</p>
              {periodData?.balance >= 0
                ? <TrendingUp className="text-green-500" size={16} />
                : <TrendingDown className="text-red-500" size={16} />}
            </div>
            <p className={`text-xl font-bold ${(periodData?.balance ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(periodData?.balance ?? 0, user?.currency)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Receitas</p>
              <ArrowUpCircle className="text-green-500" size={16} />
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(dashboardData.total_income, user?.currency)}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Despesas</p>
              <ArrowDownCircle className="text-red-500" size={16} />
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(Math.abs(dashboardData.total_expense), user?.currency)}
            </p>
          </div>
        </div>
      )}

      {/* Income vs Expense visual */}
      {periodData && (periodData.total_income > 0 || Math.abs(periodData.total_expense) > 0) && (
        <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="font-semibold text-zinc-800 dark:text-white mb-4 text-sm sm:text-base">Receitas vs Despesas</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="shrink-0">
              <DonutChart income={periodData.total_income} expense={Math.abs(periodData.total_expense)} />
            </div>
            <div className="flex-1 w-full space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Receitas
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(periodData.total_income, user?.currency)}
                  </span>
                </div>
                <SpendingBar
                  value={periodData.total_income}
                  max={Math.max(periodData.total_income, Math.abs(periodData.total_expense))}
                  color="#10b981"
                />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Despesas
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(Math.abs(periodData.total_expense), user?.currency)}
                  </span>
                </div>
                <SpendingBar
                  value={Math.abs(periodData.total_expense)}
                  max={Math.max(periodData.total_income, Math.abs(periodData.total_expense))}
                  color="#ef4444"
                />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                {periodData.transaction_count} transações no período
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category breakdown with tabs */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('grafico')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'grafico'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
          >
            Gráfico
          </button>
          <button
            onClick={() => setActiveTab('detalhes')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'detalhes'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
          >
            Detalhes
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-800 dark:text-white text-sm sm:text-base">
              Despesas por Categoria
            </h3>
            {totalExpense > 0 && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Total: {formatCurrency(totalExpense, user?.currency)}
              </span>
            )}
          </div>

          {onlyExpenses.length === 0 ? (
            <div className="h-32 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400 dark:text-zinc-500 text-sm">
              Nenhuma despesa neste período
            </div>
          ) : activeTab === 'grafico' ? (
            <CategoryBarChart
              categories={onlyExpenses}
              maxExpense={maxExpense}
              currency={user?.currency}
            />
          ) : (
            /* Detalhes — lista expandível */
            <div className="space-y-2">
              {categoryData.map((category, i) => {
                const expense = Math.abs(category.total_expense);
                if (expense === 0 && category.total_income === 0) return null;
                const isExpanded = expandedCategories.has(category.category_id);
                const categoryTransactions = getTransactionsForCategory(category.category_id);
                const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                const pct = totalExpense > 0 && expense > 0
                  ? ((expense / totalExpense) * 100).toFixed(1)
                  : null;

                return (
                  <div key={category.category_id} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category.category_id)}
                      className="w-full p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded
                          ? <ChevronDown size={16} className="text-zinc-400 shrink-0" />
                          : <ChevronRight size={16} className="text-zinc-400 shrink-0" />}
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-medium text-zinc-800 dark:text-white text-sm flex-1 truncate">
                          {category.category_name}
                        </span>
                        <div className="text-right shrink-0">
                          {expense > 0 && (
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                              {formatCurrency(expense, user?.currency)}
                            </span>
                          )}
                          {pct && (
                            <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{pct}%</span>
                          )}
                        </div>
                      </div>

                      {expense > 0 && (
                        <SpendingBar value={expense} max={maxExpense} color={color} />
                      )}

                      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 ml-5">
                        <span>{category.transaction_count} transações</span>
                        {category.total_income > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            +{formatCurrency(category.total_income, user?.currency)}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                        {categoryTransactions.length > 0 ? (
                          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {categoryTransactions.map((t) => (
                              <div key={t.id} className="px-4 py-2.5 flex justify-between items-center text-sm">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-zinc-900 dark:text-white truncate text-sm">
                                    {t.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    <span>{formatDateLocal(t.date)}</span>
                                    {t.account && <><span>·</span><span className="truncate">{t.account.name}</span></>}
                                  </div>
                                </div>
                                <span className={`ml-3 font-semibold text-sm shrink-0 ${t.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {t.amount >= 0 ? '+' : ''}{formatCurrency(t.amount, user?.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                            Nenhuma transação nesta categoria no período
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
