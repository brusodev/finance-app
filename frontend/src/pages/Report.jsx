import React from "react";
import { BarChart3, PieChart, TrendingUp } from "lucide-react";

export default function Report() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Relatórios Financeiros</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Despesas por Categoria</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Fluxo de Caixa</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
            Em breve
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <PieChart size={24} />
            </div>
            <h3 className="font-semibold text-gray-800">Balanço Mensal</h3>
          </div>
          <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 text-gray-400">
            Em breve
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Relatórios Detalhados</h2>
        <p className="text-gray-500">
          Estamos trabalhando para trazer gráficos e análises detalhadas sobre suas finanças.
          <br />
          Em breve você poderá visualizar a evolução do seu patrimônio e gastos.
        </p>
      </div>
    </div>
  );
}
