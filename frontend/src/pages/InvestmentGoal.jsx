import React, { useState, useEffect } from "react";
import { Target, TrendingUp, Calculator, Edit, Plus, Trash2 } from "lucide-react";
import { investmentsAPI } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import { useAuth } from "../context/AuthContext";

export default function InvestmentGoal() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [simulationParams, setSimulationParams] = useState({
    rate_monthly: 0.009,
    months: 120,
  });

  // Form state
  const [formData, setFormData] = useState({
    goal_name: "",
    target_value_brl: "",
    start_date: new Date().toISOString().split('T')[0],
    months: 120,
    default_monthly_rate: 0.009,
    plan_mode: "ESCADA",
    steps: [
      { start_month: 1, end_month: 36, monthly_contribution_brl: 1000 },
      { start_month: 37, end_month: 72, monthly_contribution_brl: 2000 },
      { start_month: 73, end_month: 120, monthly_contribution_brl: 3000 },
    ]
  });

  useEffect(() => {
    fetchGoal();
  }, []);

  const fetchGoal = async () => {
    try {
      setLoading(true);
      const data = await investmentsAPI.getGoal();
      if (data) {
        setGoal(data);
        setSimulationParams({
          rate_monthly: data.default_monthly_rate,
          months: data.months,
        });
        runSimulation(data.default_monthly_rate, data.months);
      } else {
        setShowForm(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async (rate = simulationParams.rate_monthly, months = simulationParams.months) => {
    try {
      const result = await investmentsAPI.simulate({
        rate_monthly: rate,
        months: months,
      });
      setSimulation(result);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditGoal = () => {
    setFormData({
      goal_name: goal.goal_name,
      target_value_brl: goal.target_value_brl,
      start_date: goal.start_date,
      months: goal.months,
      default_monthly_rate: goal.default_monthly_rate,
      plan_mode: goal.plan_mode,
      steps: goal.steps.map(s => ({
        start_month: s.start_month,
        end_month: s.end_month,
        monthly_contribution_brl: s.monthly_contribution_brl
      }))
    });
    setShowForm(true);
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    try {
      const goalData = {
        ...formData,
        target_value_brl: parseFloat(formData.target_value_brl),
        default_monthly_rate: parseFloat(formData.default_monthly_rate),
        months: parseInt(formData.months),
        steps: formData.steps.map(s => ({
          start_month: parseInt(s.start_month),
          end_month: parseInt(s.end_month),
          monthly_contribution_brl: parseFloat(s.monthly_contribution_brl)
        }))
      };

      await investmentsAPI.createOrUpdateGoal(goalData);
      await fetchGoal();
      setShowForm(false);
    } catch (err) {
      alert(err.detail || "Erro ao salvar meta");
    }
  };

  const addStep = () => {
    const lastStep = formData.steps[formData.steps.length - 1];
    const newStartMonth = lastStep ? lastStep.end_month + 1 : 1;
    setFormData({
      ...formData,
      steps: [...formData.steps, {
        start_month: newStartMonth,
        end_month: Math.min(newStartMonth + 35, formData.months),
        monthly_contribution_brl: 1000
      }]
    });
  };

  const removeStep = (index) => {
    if (formData.steps.length <= 1) {
      alert("É necessário ter pelo menos 1 passo de aporte");
      return;
    }
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const useDefaultGoal = () => {
    setFormData({
      goal_name: "Meta 500k em 10 anos",
      target_value_brl: 500000,
      start_date: new Date().toISOString().split('T')[0],
      months: 120,
      default_monthly_rate: 0.009,
      plan_mode: "ESCADA",
      steps: [
        { start_month: 1, end_month: 36, monthly_contribution_brl: 1000 },
        { start_month: 37, end_month: 72, monthly_contribution_brl: 2000 },
        { start_month: 73, end_month: 120, monthly_contribution_brl: 3000 },
      ]
    });
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
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-white">Planejamento & Meta</h1>
        {goal && !showForm && (
          <button
            onClick={handleEditGoal}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={20} />
            <span className="whitespace-nowrap">Editar Meta</span>
          </button>
        )}
      </div>

      {/* Goal Form */}
      {showForm && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
              {goal ? "Editar Meta" : "Criar Nova Meta"}
            </h3>
            {!goal && (
              <button
                type="button"
                onClick={useDefaultGoal}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Usar modelo padrão (500k/10anos)
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitGoal} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nome da Meta
                </label>
                <input
                  type="text"
                  required
                  value={formData.goal_name}
                  onChange={(e) => setFormData({ ...formData, goal_name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                  placeholder="Ex: Aposentadoria, Casa própria..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Valor da Meta (R$)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.target_value_brl}
                  onChange={(e) => setFormData({ ...formData, target_value_brl: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prazo (meses)
                </label>
                <input
                  type="number"
                  required
                  value={formData.months}
                  onChange={(e) => setFormData({ ...formData, months: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                  placeholder="120"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {Math.floor(formData.months / 12)} anos e {formData.months % 12} meses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Taxa Mensal Estimada (%)
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={(formData.default_monthly_rate * 100).toFixed(2)}
                  onChange={(e) => setFormData({ ...formData, default_monthly_rate: parseFloat(e.target.value) / 100 })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                  placeholder="0.9"
                />
              </div>
            </div>

            {/* Contribution Steps */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Plano de Aportes (Escada)
                </label>
                <button
                  type="button"
                  onClick={addStep}
                  className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Plus size={16} />
                  Adicionar Passo
                </button>
              </div>

              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          Mês Inicial
                        </label>
                        <input
                          type="number"
                          required
                          value={step.start_month}
                          onChange={(e) => updateStep(index, 'start_month', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          Mês Final
                        </label>
                        <input
                          type="number"
                          required
                          value={step.end_month}
                          onChange={(e) => updateStep(index, 'end_month', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                          Aporte Mensal (R$)
                        </label>
                        <input
                          type="number"
                          required
                          step="0.01"
                          value={step.monthly_contribution_brl}
                          onChange={(e) => updateStep(index, 'monthly_contribution_brl', e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      disabled={formData.steps.length <= 1}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {goal ? "Atualizar Meta" : "Criar Meta"}
              </button>
              {goal && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 bg-zinc-200 dark:bg-[#1a1a1a] text-zinc-800 dark:text-white rounded-lg hover:bg-zinc-300 dark:hover:bg-white/[0.06] transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Goal Display (when not editing) */}
      {goal && !showForm && (
        <>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-6">
            <h3 className="text-lg font-semibold text-zinc-800 dark:text-white mb-4">
              {goal.goal_name}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Meta</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(goal.target_value_brl, user?.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Prazo</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  {goal.months} meses ({Math.floor(goal.months / 12)} anos)
                </p>
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Taxa Mensal</p>
                <p className="text-xl font-bold text-zinc-900 dark:text-white">
                  {(goal.default_monthly_rate * 100).toFixed(2)}%
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/[0.06]">
              <h4 className="font-semibold text-zinc-800 dark:text-white mb-3">
                Plano de Aportes
              </h4>
              <div className="space-y-2">
                {goal.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-[#1a1a1a] rounded-lg"
                  >
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Meses {step.start_month} - {step.end_month}
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      {formatCurrency(step.monthly_contribution_brl, user?.currency)}/mês
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Simulation */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={20} className="text-purple-500" />
              <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
                Simulação
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Taxa Mensal (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={(simulationParams.rate_monthly * 100).toFixed(2)}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) / 100;
                    setSimulationParams({ ...simulationParams, rate_monthly: rate });
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prazo (meses)
                </label>
                <input
                  type="number"
                  value={simulationParams.months}
                  onChange={(e) => setSimulationParams({ ...simulationParams, months: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-white/[0.08] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-[#1a1a1a] text-zinc-900 dark:text-white"
                />
              </div>
            </div>
            <button
              onClick={() => runSimulation()}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Simular
            </button>
          </div>

          {simulation && (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] dark:bg-white/[0.03] backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-green-500" />
                <h3 className="text-lg font-semibold text-zinc-800 dark:text-white">
                  Resultado da Simulação
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Valor Final</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(simulation.final_value, user?.currency)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Total Aportado</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(simulation.contributed_total, user?.currency)}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Juros Acumulados</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(simulation.interest_total, user?.currency)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Evolução Mensal (últimos 24 meses)
                </p>
                {simulation.series.slice(-24).map((month) => {
                  const maxBalance = Math.max(...simulation.series.slice(-24).map(m => m.balance));
                  const percentage = (month.balance / maxBalance) * 100;

                  return (
                    <div key={month.month} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 w-12">
                        M{month.month}
                      </span>
                      <div className="flex-1 bg-zinc-200 dark:bg-[#1a1a1a] rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-blue-600 h-full rounded-full flex items-center px-2"
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 30 && (
                            <span className="text-xs font-medium text-white">
                              {formatCurrency(month.balance, user?.currency)}
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
        </>
      )}
    </div>
  );
}
