import React, { useState, useEffect } from "react";
import { TrendingUp, Target, DollarSign, Calendar, ArrowUpCircle } from "lucide-react";
import { investmentsAPI } from "../services/api";
import { formatCurrency, formatDateLocal } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

export default function Investments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState(null);
  const [goal, setGoal] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryData, goalData] = await Promise.all([
        investmentsAPI.getSummary(),
        investmentsAPI.getGoal().catch(() => null),
      ]);

      setSummary(summaryData);
      setGoal(goalData);

      // Get progress if goal exists
      if (goalData) {
        try {
          const progressData = await investmentsAPI.getGoalProgress();
          setProgress(progressData);
        } catch (err) {
          console.log("No progress data yet");
        }
      }
    } catch (err) {
      setError(err.detail || "Erro ao carregar dados");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-label="Carregando">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Investimentos</h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md text-red-700 dark:text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Investimentos</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Invested */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Patrimônio Investido
            </p>
            <DollarSign className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            {formatCurrency(summary?.total_invested || 0, user?.currency)}
          </p>
        </div>

        {/* This Month Contributions */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Aportes do Mês
            </p>
            <ArrowUpCircle className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(summary?.total_contributions_month || 0, user?.currency)}
          </p>
        </div>

        {/* Goal Progress */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Progresso da Meta
            </p>
            <Target className="text-purple-500" size={20} />
          </div>
          {goal ? (
            <>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {progress ? `${progress.progress_percentage.toFixed(1)}%` : "0%"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Meta: {formatCurrency(goal.target_value_brl, user?.currency)}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Nenhuma meta configurada
            </p>
          )}
        </div>

        {/* Projected Final Value */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              Projeção Final
            </p>
            <TrendingUp className="text-orange-500" size={20} />
          </div>
          {progress ? (
            <>
              <p className={`text-2xl font-bold ${progress.on_track ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(progress.projected_final_value, user?.currency)}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {progress.on_track ? '✓ No caminho certo' : '⚠ Fora do planejado'}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Configure uma meta
            </p>
          )}
        </div>
      </div>

      {/* Goal Details */}
      {goal && progress && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">
            {goal.goal_name}
          </h3>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <span>Progresso</span>
                <span>{progress.progress_percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Valor Atual</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(progress.current_value, user?.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Meses Decorridos</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {progress.months_elapsed} de {goal.months}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Meses Restantes</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {progress.months_remaining}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Taxa Mensal</p>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {(goal.default_monthly_rate * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets Breakdown */}
      {summary && summary.by_asset && summary.by_asset.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">
            Distribuição por Ativo
          </h3>
          <div className="space-y-3">
            {summary.by_asset.map((asset) => (
              <div key={asset.asset_id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-white">
                    {asset.asset_name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {asset.asset_type} • {asset.transaction_count} transações
                  </p>
                </div>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {formatCurrency(asset.total_invested, user?.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last 12 Months Chart */}
      {summary && summary.last_12_months && summary.last_12_months.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">
            Aportes Últimos 12 Meses
          </h3>
          <div className="space-y-2">
            {summary.last_12_months.map((month) => {
              const maxValue = Math.max(...summary.last_12_months.map(m => m.total));
              const percentage = maxValue > 0 ? (month.total / maxValue) * 100 : 0;

              return (
                <div key={month.month} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 w-16">
                    {month.month}
                  </span>
                  <div className="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center px-2"
                      style={{ width: `${percentage}%` }}
                    >
                      {month.total > 0 && (
                        <span className="text-xs font-medium text-white">
                          {formatCurrency(month.total, user?.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!summary || summary.total_invested === 0) && (
        <div className="bg-white dark:bg-zinc-900 p-12 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-2">
            Comece a Investir
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Cadastre seus ativos e registre seus aportes para acompanhar seu progresso rumo à meta
          </p>
        </div>
      )}
    </div>
  );
}
