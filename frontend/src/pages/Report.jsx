import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronRight } from "lucide-react";
import { formatCurrency, formatDateLocal } from '../utils/formatters'
import { useAuth } from '../context/AuthContext'
import { transactionsAPI } from '../services/api'

const API_URL = import.meta.env.VITE_API_URL;

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                     'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
                     'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#ec4899', '#84cc16', '#6366f1',
  '#14b8a6', '#e11d48', '#d97706', '#7c3aed', '#0891b2',
];

// Par validado para daltonismo sobre superfície escura (ΔE deutan 9.6)
const INCOME_COLOR = '#059669';
const EXPENSE_COLOR = '#ef4444';

const STATUS_STYLES = {
  good: { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400', fill: '#059669' },
  warn: { dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', fill: '#d97706' },
  bad:  { dot: 'bg-red-500',   text: 'text-red-600 dark:text-red-400',     fill: '#ef4444' },
};

const fmtPct = (v, digits = 1) => `${v.toFixed(digits).replace('.', ',')}%`;

// Par validado para daltonismo sobre superfície escura (ΔE protan 30.2)
const KIND_META = {
  fixed:        { label: 'Fixas',             color: '#3b82f6' },
  variable:     { label: 'Variáveis',         color: '#d97706' },
  unclassified: { label: 'Sem classificação', color: '#52525b' },
};

function SpendingBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-zinc-100 dark:bg-[#1a1a1a] rounded-full h-2 mt-2">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function DeltaBadge({ current, previous, periodLabel, invert = false, mode = 'percent', currency }) {
  if (previous == null) return null;
  const diff = current - previous;
  if (mode === 'percent' && previous === 0) return null;
  const up = diff >= 0;
  const good = invert ? !up : up;
  const cls = good ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const display = mode === 'percent'
    ? fmtPct(Math.abs((diff / Math.abs(previous)) * 100))
    : formatCurrency(Math.abs(diff), currency);
  return (
    <p className={`text-xs mt-1 flex items-center gap-0.5 ${cls}`}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      <span className="font-medium">{display}</span>
      <span className="text-zinc-500 dark:text-zinc-400 ml-0.5">vs {periodLabel}</span>
    </p>
  );
}

function HealthTile({ label, value, status, statusLabel, hint, meterPct }) {
  const s = status ? STATUS_STYLES[status] : null;
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4">
      <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium mb-2">{label}</p>
      <p className="text-xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {s && statusLabel && (
        <p className={`text-xs mt-1 flex items-center gap-1.5 ${s.text}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {statusLabel}
        </p>
      )}
      {meterPct != null && s && (
        <div className="w-full bg-zinc-100 dark:bg-[#1a1a1a] rounded-full h-1.5 mt-2">
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(Math.max(meterPct, 0), 100)}%`, backgroundColor: s.fill }}
          />
        </div>
      )}
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">{hint}</p>}
    </div>
  );
}

function ExpenseCompositionCard({ byKind, income, currency }) {
  const total = byKind.fixed + byKind.variable + byKind.unclassified;
  const classified = byKind.fixed + byKind.variable;
  const fixedCommitment = income > 0 && byKind.fixed > 0 ? (byKind.fixed / income) * 100 : null;
  const commitStatus = fixedCommitment == null ? null
    : fixedCommitment <= 50 ? { ...STATUS_STYLES.good, label: 'Saudável' }
    : fixedCommitment <= 70 ? { ...STATUS_STYLES.warn, label: 'Atenção' }
    : { ...STATUS_STYLES.bad, label: 'Alto' };

  const rows = ['fixed', 'variable', 'unclassified']
    .map(key => ({ key, ...KIND_META[key], value: byKind[key] }))
    .filter(r => r.value > 0);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
      <h3 className="font-semibold text-zinc-800 dark:text-white mb-4 text-sm sm:text-base">
        Fixas × Variáveis
      </h3>

      {classified === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Classifique suas categorias como <span className="font-medium text-zinc-700 dark:text-zinc-300">fixas</span> ou{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">variáveis</span> na página Categorias
          para ver quanto da sua despesa é compressível e quanto já está comprometido.
        </p>
      ) : (
        <>
          <div className="flex h-3 rounded-full overflow-hidden gap-[2px] mb-4">
            {rows.map(r => (
              <div
                key={r.key}
                style={{ width: `${(r.value / total) * 100}%`, backgroundColor: r.color }}
              />
            ))}
          </div>

          <div className="space-y-2">
            {rows.map(r => (
              <div key={r.key} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.label}
                </span>
                <span className="text-zinc-800 dark:text-zinc-200">
                  <span className="font-semibold">{formatCurrency(r.value, currency)}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1.5">{fmtPct((r.value / total) * 100, 0)}</span>
                </span>
              </div>
            ))}
          </div>

          {fixedCommitment != null && commitStatus && (
            <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-white/[0.06]">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Comprometimento fixo da receita</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-0.5">{fmtPct(fixedCommitment)}</p>
              <p className={`text-xs mt-1 flex items-center gap-1.5 ${commitStatus.text}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${commitStatus.dot}`} />
                {commitStatus.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                gastos fixos que se repetem antes do mês começar
              </p>
            </div>
          )}

          {byKind.unclassified > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
              {formatCurrency(byKind.unclassified, currency)} ainda sem classificação — ajuste em Categorias.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TrendChart({ months, currency }) {
  const max = Math.max(1, ...months.flatMap(m => [m.income, m.expense]));
  const barH = (v) => v > 0 ? `${Math.max((v / max) * 100, 1.5)}%` : '0%';

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: INCOME_COLOR }} /> Receitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} /> Despesas
        </span>
      </div>

      <div className="flex items-end gap-1 sm:gap-3 h-40 sm:h-48 border-b border-zinc-200 dark:border-white/[0.06]">
        {months.map((m, i) => {
          const tipPos = i === 0
            ? 'left-0'
            : i === months.length - 1
              ? 'right-0'
              : 'left-1/2 -translate-x-1/2';
          return (
            <div key={m.key} className="group relative flex-1 h-full flex items-end justify-center">
              <div className={`pointer-events-none absolute bottom-full ${tipPos} mb-2 hidden group-hover:block z-10 whitespace-nowrap rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#1a1a1a] shadow-lg px-3 py-2 text-xs`}>
                <p className="font-semibold text-zinc-800 dark:text-white mb-1">{m.fullLabel}</p>
                <p className="text-zinc-600 dark:text-zinc-400">Receitas: <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(m.income, currency)}</span></p>
                <p className="text-zinc-600 dark:text-zinc-400">Despesas: <span className="font-medium text-red-600 dark:text-red-400">{formatCurrency(m.expense, currency)}</span></p>
                <p className="text-zinc-600 dark:text-zinc-400 pt-1 mt-1 border-t border-zinc-200 dark:border-white/[0.08]">
                  Saldo: <span className={`font-medium ${m.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(m.balance, currency)}</span>
                </p>
              </div>
              <div className="flex items-end gap-[2px] h-full">
                <div
                  className="w-3 sm:w-4 lg:w-5 rounded-t transition-all duration-500 group-hover:opacity-80"
                  style={{ height: barH(m.income), backgroundColor: INCOME_COLOR }}
                />
                <div
                  className="w-3 sm:w-4 lg:w-5 rounded-t transition-all duration-500 group-hover:opacity-80"
                  style={{ height: barH(m.expense), backgroundColor: EXPENSE_COLOR }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 sm:gap-3 mt-1.5">
        {months.map(m => (
          <span key={m.key} className="flex-1 text-center text-xs text-zinc-500 dark:text-zinc-400 capitalize">
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function CategoryBarChart({ categories, maxExpense, total, currency }) {
  return (
    <div className="space-y-3">
      {categories.map((cat, i) => {
        const expense = Math.abs(cat.total_expense);
        const pct = total > 0 ? ((expense / total) * 100).toFixed(1) : 0;
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
                <div className="flex-1 bg-zinc-100 dark:bg-[#1a1a1a] rounded-full h-5 relative overflow-hidden">
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
      {arcPath(60, 60, 45, 0, expenseAngle, EXPENSE_COLOR)}
      {arcPath(60, 60, 45, expenseAngle + 2, incomeAngle, INCOME_COLOR)}
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
  const [trend, setTrend] = useState([]);
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

      const now = new Date();
      let selYear, selMonthIdx;
      if (selectedMonth === 'current') {
        selYear = now.getFullYear();
        selMonthIdx = now.getMonth();
      } else {
        const [year, month] = selectedMonth.split('-');
        selYear = parseInt(year);
        selMonthIdx = parseInt(month) - 1;
      }

      // Mês selecionado + 5 anteriores (para tendência e comparativos)
      const monthRanges = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(selYear, selMonthIdx - i, 1);
        const y = d.getFullYear();
        const mo = d.getMonth();
        const mm = String(mo + 1).padStart(2, '0');
        const lastDay = new Date(y, mo + 1, 0).getDate();
        monthRanges.push({
          key: `${y}-${mm}`,
          label: MONTH_SHORT[mo],
          fullLabel: `${MONTH_NAMES[mo]} ${y}`,
          start: `${y}-${mm}-01`,
          end: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
        });
      }
      const { start: startDate, end: endDate } = monthRanges[monthRanges.length - 1];

      const [dashboardRes, categoryRes, transactions, ...periodResults] = await Promise.all([
        fetch(`${API_URL}/dashboard?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        fetch(`${API_URL}/transactions/totals/by-category?start_date=${startDate}&end_date=${endDate}`, fetchOpts),
        transactionsAPI.getAll(false, 5000),
        ...monthRanges.map(r => fetch(`${API_URL}/transactions/totals/by-period?start=${r.start}&end=${r.end}`, fetchOpts)),
      ]);

      if (!dashboardRes.ok || !categoryRes.ok || periodResults.some(r => !r.ok)) {
        throw new Error('Erro ao carregar dados dos relatórios');
      }

      const dashboard = await dashboardRes.json();
      const categories = await categoryRes.json();
      const periods = await Promise.all(periodResults.map(r => r.json()));

      const trendData = monthRanges.map((r, i) => ({
        ...r,
        income: periods[i].total_income,
        expense: Math.abs(periods[i].total_expense),
        balance: periods[i].balance,
        count: periods[i].transaction_count,
      }));

      const filteredTransactions = transactions.filter(t => t.date >= startDate && t.date <= endDate);

      const monthsSet = new Set();
      transactions.forEach(t => {
        const date = new Date(t.date + 'T00:00:00');
        monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
      });
      setAvailableMonths(Array.from(monthsSet).sort().reverse());

      setDashboardData(dashboard);
      setCategoryData(categories.sort((a, b) => Math.abs(b.total_expense) - Math.abs(a.total_expense)));
      setPeriodData(periods[periods.length - 1]);
      setTrend(trendData);
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

  const expenseByKind = onlyExpenses.reduce((acc, c) => {
    const kind = KIND_META[c.expense_kind] ? c.expense_kind : 'unclassified';
    acc[kind] += Math.abs(c.total_expense);
    return acc;
  }, { fixed: 0, variable: 0, unclassified: 0 });

  // Pagamentos de fatura de cartão no período: transfers negativos saindo de contas não-cartão
  const creditCardPayments = allTransactions.filter(t =>
    t.transaction_type === 'transfer' &&
    t.amount < 0 &&
    t.account?.account_type !== 'credit_card'
  );
  const totalCreditCardPayments = creditCardPayments.reduce((s, t) => s + Math.abs(t.amount), 0);

  // ---- Indicadores de saúde financeira ----
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedMonth === 'current' || selectedMonth === currentKey;

  const income = periodData?.total_income ?? 0;
  const expenseMonth = Math.abs(periodData?.total_expense ?? 0);
  const prevMonth = trend.length >= 2 ? trend[trend.length - 2] : null;

  const savingsRate = income > 0 ? ((income - expenseMonth) / income) * 100 : null;
  const savingsStatus = savingsRate == null ? null
    : savingsRate >= 20 ? { status: 'good', label: 'Ótimo' }
    : savingsRate >= 0 ? { status: 'warn', label: 'Pode melhorar' }
    : { status: 'bad', label: 'Gastando mais que ganha' };

  const daysInSelMonth = periodData ? parseInt(periodData.period_end.split('-')[2]) : 30;
  const dayOfMonth = now.getDate();
  const projectedExpense = isCurrentMonth && dayOfMonth > 0
    ? (expenseMonth / dayOfMonth) * daysInSelMonth
    : null;
  const projectionStatus = projectedExpense == null || income === 0 ? null
    : projectedExpense <= income * 0.9 ? { status: 'good', label: 'Dentro da receita' }
    : projectedExpense <= income ? { status: 'warn', label: 'No limite' }
    : { status: 'bad', label: 'Acima da receita' };
  const avgDailySpend = expenseMonth / (isCurrentMonth ? Math.max(dayOfMonth, 1) : daysInSelMonth);

  const monthsWithExpense = trend.filter(m => m.expense > 0);
  const avgMonthlyExpense = monthsWithExpense.length > 0
    ? monthsWithExpense.reduce((s, m) => s + m.expense, 0) / monthsWithExpense.length
    : 0;
  const reserveMonths = avgMonthlyExpense > 0 && dashboardData
    ? dashboardData.total_balance / avgMonthlyExpense
    : null;
  const reserveStatus = reserveMonths == null ? null
    : reserveMonths >= 6 ? { status: 'good', label: 'Confortável' }
    : reserveMonths >= 3 ? { status: 'warn', label: 'Razoável' }
    : { status: 'bad', label: 'Reforçar reserva' };

  const cardCommitment = income > 0 && totalCreditCardPayments > 0
    ? (totalCreditCardPayments / income) * 100
    : null;
  const cardStatus = cardCommitment == null ? null
    : cardCommitment <= 30 ? { status: 'good', label: 'Saudável' }
    : cardCommitment <= 50 ? { status: 'warn', label: 'Atenção' }
    : { status: 'bad', label: 'Alto' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div role="status" aria-label="Carregando relatórios" className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
    <div className="space-y-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Relatórios Financeiros</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
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
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Saldo Total</p>
              <Wallet className="text-blue-500" size={16} />
            </div>
            <p className={`text-xl font-bold ${dashboardData.total_balance >= 0 ? 'text-zinc-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(dashboardData.total_balance, user?.currency)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Saldo do Mês</p>
              {periodData?.balance >= 0
                ? <TrendingUp className="text-green-500" size={16} />
                : <TrendingDown className="text-red-500" size={16} />}
            </div>
            <p className={`text-xl font-bold ${(periodData?.balance ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(periodData?.balance ?? 0, user?.currency)}
            </p>
            <DeltaBadge
              current={periodData?.balance ?? 0}
              previous={prevMonth?.balance}
              periodLabel={prevMonth?.label}
              mode="currency"
              currency={user?.currency}
            />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Receitas</p>
              <ArrowUpCircle className="text-green-500" size={16} />
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(dashboardData.total_income, user?.currency)}
            </p>
            <DeltaBadge
              current={income}
              previous={prevMonth?.income}
              periodLabel={prevMonth?.label}
            />
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">Despesas</p>
              <ArrowDownCircle className="text-red-500" size={16} />
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(Math.abs(dashboardData.total_expense), user?.currency)}
            </p>
            <DeltaBadge
              current={expenseMonth}
              previous={prevMonth?.expense}
              periodLabel={prevMonth?.label}
              invert
            />
            {totalCreditCardPayments > 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                + {formatCurrency(totalCreditCardPayments, user?.currency)} em faturas
              </p>
            )}
          </div>
        </div>
      )}

      {/* Saúde Financeira */}
      {dashboardData && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            Saúde Financeira
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
            <HealthTile
              label="Taxa de Poupança"
              value={savingsRate != null ? fmtPct(savingsRate) : '—'}
              status={savingsStatus?.status}
              statusLabel={savingsStatus?.label}
              meterPct={savingsRate}
              hint="quanto da receita sobra no mês"
            />
            {isCurrentMonth ? (
              <HealthTile
                label="Projeção de Despesas"
                value={projectedExpense != null ? formatCurrency(projectedExpense, user?.currency) : '—'}
                status={projectionStatus?.status}
                statusLabel={projectionStatus?.label}
                hint={`ritmo atual: ${formatCurrency(avgDailySpend, user?.currency)}/dia`}
              />
            ) : (
              <HealthTile
                label="Gasto Médio Diário"
                value={formatCurrency(avgDailySpend, user?.currency)}
                hint="despesas ÷ dias do mês"
              />
            )}
            <HealthTile
              label="Reserva de Emergência"
              value={reserveMonths != null ? `${reserveMonths.toFixed(1).replace('.', ',')} meses` : '—'}
              status={reserveStatus?.status}
              statusLabel={reserveStatus?.label}
              hint="saldo total ÷ despesa média (6m)"
            />
            <HealthTile
              label="Fatura ÷ Receita"
              value={cardCommitment != null ? fmtPct(cardCommitment) : '—'}
              status={cardStatus?.status}
              statusLabel={cardStatus?.label}
              hint="faturas de cartão sobre as receitas"
            />
          </div>
        </div>
      )}

      {/* Tendência + Receitas vs Despesas lado a lado em telas grandes */}
      <div className="grid gap-5 xl:grid-cols-2 items-start">
        {trend.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <h3 className="font-semibold text-zinc-800 dark:text-white mb-4 text-sm sm:text-base">Últimos 6 Meses</h3>
            <TrendChart months={trend} currency={user?.currency} />
          </div>
        )}

        {periodData && (periodData.total_income > 0 || Math.abs(periodData.total_expense) > 0) && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <h3 className="font-semibold text-zinc-800 dark:text-white mb-4 text-sm sm:text-base">Receitas vs Despesas</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="shrink-0">
                <DonutChart income={periodData.total_income} expense={Math.abs(periodData.total_expense)} />
              </div>
              <div className="flex-1 w-full space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: INCOME_COLOR }} /> Receitas
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(periodData.total_income, user?.currency)}
                    </span>
                  </div>
                  <SpendingBar
                    value={periodData.total_income}
                    max={Math.max(periodData.total_income, Math.abs(periodData.total_expense))}
                    color={INCOME_COLOR}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} /> Despesas
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatCurrency(Math.abs(periodData.total_expense), user?.currency)}
                    </span>
                  </div>
                  <SpendingBar
                    value={Math.abs(periodData.total_expense)}
                    max={Math.max(periodData.total_income, Math.abs(periodData.total_expense))}
                    color={EXPENSE_COLOR}
                  />
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                  {periodData.transaction_count} transações no período
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Categorias + composição e faturas lado a lado em telas grandes */}
      <div className="grid gap-5 xl:grid-cols-3 items-start">
        <div className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm overflow-hidden ${totalExpense > 0 || creditCardPayments.length > 0 ? 'xl:col-span-2' : 'xl:col-span-3'}`}>
          {/* Tab bar */}
          <div className="flex border-b border-zinc-200 dark:border-white/[0.06]">
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
              <div className="h-32 flex items-center justify-center bg-zinc-50 dark:bg-[#1a1a1a] rounded-lg text-zinc-400 dark:text-zinc-500 text-sm">
                Nenhuma despesa neste período
              </div>
            ) : activeTab === 'grafico' ? (
              <CategoryBarChart
                categories={onlyExpenses}
                maxExpense={maxExpense}
                total={totalExpense}
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
                    <div key={category.category_id} className="border border-zinc-200 dark:border-white/[0.06] rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategory(category.category_id)}
                        className="w-full p-3 sm:p-4 hover:bg-zinc-50 dark:hover:bg-white/[0.06] transition-colors text-left"
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
                        <div className="border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-[#1a1a1a]/50">
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

        {/* Coluna lateral: composição fixo × variável + pagamentos de fatura */}
        {(totalExpense > 0 || creditCardPayments.length > 0) && (
          <div className="space-y-5">
            {totalExpense > 0 && (
              <ExpenseCompositionCard
                byKind={expenseByKind}
                income={income}
                currency={user?.currency}
              />
            )}

            {creditCardPayments.length > 0 && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-zinc-800 dark:text-white text-sm sm:text-base">
                Pagamentos de Fatura
              </h3>
              <span className="text-xs font-semibold text-orange-500 dark:text-orange-400">
                {formatCurrency(totalCreditCardPayments, user?.currency)}
              </span>
            </div>
            <div className="space-y-2">
              {creditCardPayments.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 text-sm py-1.5 border-t border-white/[0.04] first:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-700 dark:text-zinc-300 truncate">{t.description}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateLocal(t.date)}{t.account?.name ? ` · ${t.account.name}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-orange-600 dark:text-orange-400 shrink-0">
                    -{formatCurrency(Math.abs(t.amount), user?.currency)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3 pt-2 border-t border-white/[0.04]">
              Pagamentos de fatura são transferências e não contam como despesa para evitar dupla contagem com os gastos do cartão.
            </p>
          </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
