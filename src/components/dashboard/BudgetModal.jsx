import { useState } from "react";
import { X, Check, Pencil, SlidersHorizontal } from "lucide-react";
import { EXPENSE_MACROS } from "../../utils/constants";
import { CompactMoneyInput } from "../ui/CompactMoneyInput";

export function BudgetModal({ isOpen, onClose, budgets, transactions, saveBudget }) {
  if (!isOpen) return null;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthExpenses = transactions.filter(t => {
    if (!t.date || t.type !== 'expense' || (t.isDebt && t.debtPaid)) return false;
    const tDate = new Date(t.date.seconds * 1000);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const activeBudgets = EXPENSE_MACROS.filter(macro => {
      const b = budgets.find(bg => bg.macro === macro);
      return b && b.limit > 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 w-full max-w-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden animate-scale-up">
        
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersHorizontal size={20} className="text-blue-400" />
            Controle de Gastos
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
          {activeBudgets.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">Nenhum limite de gasto definido.</p>
          ) : (
              activeBudgets.map(macro => {
                const budget = budgets.find(b => b.macro === macro);
                const limit = budget ? budget.limit : 0;
                
                const spent = currentMonthExpenses
                    .filter(t => t.macro === macro)
                    .reduce((acc, t) => acc + t.amount, 0);

                const remaining = limit - spent;
                const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                const isOver = remaining < 0;
                
                return (
                  <BudgetRow 
                    key={macro} 
                    macro={macro} 
                    limit={limit} 
                    spent={spent}
                    remaining={remaining}
                    percentage={percentage} 
                    isOver={isOver}
                    saveBudget={saveBudget}
                  />
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}

function BudgetRow({ macro, limit, spent, remaining, percentage, isOver, saveBudget }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newLimit, setNewLimit] = useState(limit);

  const handleSave = async () => {
    await saveBudget(macro, newLimit);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewLimit(limit); // Reseta o valor
  };

  return (
    <div className={`p-3 rounded-xl border transition-colors ${isOver ? 'bg-red-500/5 border-red-500/30' : 'bg-gray-700/30 border-gray-700'}`}>
        <div className="flex justify-between items-center mb-2 h-8">
            <span className="font-bold text-sm text-gray-200">{macro}</span>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <div className="w-24">
                            <CompactMoneyInput 
                                value={newLimit}
                                onChange={setNewLimit}
                                placeholder="0,00"
                                autoFocus={true}
                            />
                        </div>
                        <button onClick={handleSave} className="text-green-400 hover:text-green-300"><Check size={16}/></button>
                        <button onClick={handleCancel} className="text-gray-400 hover:text-gray-300 ml-1"><X size={16}/></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsEditing(true)}>
                        <span className="text-xs text-gray-400">
                            Posso gastar no total: <span className="text-white font-medium">R$ {limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </span>
                        <Pencil size={12} className="text-gray-600 group-hover:text-blue-400 transition-colors"/>
                    </div>
                )}
            </div>
        </div>

        {/* Barra de Progresso */}
        <div className="relative h-1.5 bg-gray-900 rounded-full overflow-hidden mb-1">
            <div 
                className={`absolute top-0 left-0 h-full transition-all duration-500 ${isOver ? 'bg-red-500' : percentage > 85 ? 'bg-orange-500' : 'bg-blue-500'}`}
                style={{ width: `${percentage}%` }}
            ></div>
        </div>

        <div className="flex justify-between text-[10px] mt-1">
            <span className="text-gray-400">Gasto: <span className="text-gray-300">R$ {spent.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></span>
            <span className={isOver ? 'text-red-400 font-bold' : 'text-green-400 font-bold'}>
                {remaining >= 0 
                    ? `Resta: R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits: 2})}` 
                    : `Excedido: R$ ${Math.abs(remaining).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
                }
            </span>
        </div>
    </div>
  );
}