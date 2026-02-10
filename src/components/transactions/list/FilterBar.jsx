import { Calendar, Shapes, Wallet } from "lucide-react";

export function FilterBar({ viewMode, setViewMode, groupBy, setGroupBy, pendingDebtsCount }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit">
          <button 
            onClick={() => setViewMode("all")} 
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'all' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setViewMode("debts")} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'debts' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Reembolsos {pendingDebtsCount > 0 && <span className="bg-orange-500 text-white text-[9px] px-1.5 rounded-full">{pendingDebtsCount}</span>}
          </button>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit self-end sm:self-auto">
          <span className="text-[10px] text-gray-500 uppercase font-bold pl-2 hidden sm:block">Agrupar:</span>
          <button onClick={() => setGroupBy("date")} title="Por Data" className={`p-1.5 rounded-md transition-all ${groupBy === 'date' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}><Calendar size={16} /></button>
          <button onClick={() => setGroupBy("macro")} title="Por Categoria" className={`p-1.5 rounded-md transition-all ${groupBy === 'macro' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}><Shapes size={16} /></button>
          <button onClick={() => setGroupBy("wallet")} title="Por Carteira" className={`p-1.5 rounded-md transition-all ${groupBy === 'wallet' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' : 'text-gray-400 hover:bg-gray-700'}`}><Wallet size={16} /></button>
        </div>
    </div>
  );
}