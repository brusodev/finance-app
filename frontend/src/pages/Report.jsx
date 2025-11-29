import React from "react";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";

export default function Report() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios Financeiros</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
              <BarChart3 size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Despesas por Categoria</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500">
            Em breve
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Fluxo de Caixa</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500">
            Em breve
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
              <PieChart size={24} />
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white">Balanço Mensal</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500">
            Em breve
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Relatórios Detalhados</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Estamos trabalhando para trazer gráficos e análises detalhadas sobre suas finanças.
          <br />
          Em breve você poderá visualizar a evolução do seu patrimônio e gastos.
        </p>
      </div>
    </div>
  );
}
