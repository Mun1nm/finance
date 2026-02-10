import { TrendingUp, TrendingDown, PieChart, BarChart3 } from "lucide-react";
import { CategoryChart } from "./CategoryChart";

export function AnalysisSection({ 
  transactions, 
  chartType, 
  setChartType, 
  chartMode, 
  setChartMode 
}) {
  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 relative z-0">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
            <h3 className="text-gray-400 text-sm font-bold uppercase self-start sm:self-center">Análise</h3>
            <div className="flex gap-3">
                <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setChartType("income")} className={`p-1.5 px-3 rounded text-xs font-bold flex items-center gap-1 transition-all ${chartType === 'income' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><TrendingUp size={14}/> Entradas</button>
                    <button onClick={() => setChartType("expense")} className={`p-1.5 px-3 rounded text-xs font-bold flex items-center gap-1 transition-all ${chartType === 'expense' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><TrendingDown size={14}/> Saídas</button>
                </div>
                <div className="flex bg-gray-700 rounded-lg p-1">
                    <button onClick={() => setChartMode("macro")} className={`p-1.5 rounded transition-all ${chartMode === 'macro' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'}`}><PieChart size={16}/></button>
                    <button onClick={() => setChartMode("category")} className={`p-1.5 rounded transition-all ${chartMode === 'category' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'}`}><BarChart3 size={16}/></button>
                </div>
            </div>
        </div>
        <div className="h-80 w-full">
            <CategoryChart 
                transactions={transactions} 
                mode={chartMode} 
                type={chartType} 
            />
        </div>
    </div>
  );
}