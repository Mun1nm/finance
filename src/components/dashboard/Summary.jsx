import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, AlertCircle } from "lucide-react";

export function Summary({ transactions, assets = [], totalBalance, budgets = [], onOpenBudgetModal }) { 

  const income = transactions
    .filter((t) => t.type === "income")
    .filter((t) => !t.isDebt)
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .filter((t) => !(t.isDebt && t.debtPaid))
    .reduce((acc, t) => acc + t.amount, 0);

  const investmentsFlow = transactions
    .filter((t) => t.type === "investment")
    .reduce((acc, t) => acc + t.amount, 0);

  // Saldo líquido de dívidas pendentes:
  // expense+isDebt = alguém me deve (positivo / a receber)
  // income+isDebt = eu devo a alguém (negativo / a pagar)
  const pendingDebt = transactions
    .filter((t) => t.isDebt && !t.debtPaid)
    .reduce((acc, t) => {
      if (t.type === 'expense') return acc + t.amount;  // a receber
      if (t.type === 'income') return acc - t.amount;   // devo
      return acc;
    }, 0);

  const totalNetWorth = assets.reduce((acc, a) => acc + (a.currentValue || 0), 0);

  // --- ORÇAMENTO ---
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + b.limit, 0);
  
  const relevantExpense = transactions
    .filter((t) => t.type === "expense" && !(t.isDebt && t.debtPaid))
    .filter((t) => budgets.some(b => b.macro === t.macro))
    .reduce((acc, t) => acc + t.amount, 0);

  const remainingBudget = totalBudgetLimit - relevantExpense;
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Entradas */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between lg:flex-col lg:justify-center">
        <span className="text-gray-400 text-xs uppercase font-bold lg:mb-1">Entradas (Mês)</span>
        <div className="flex items-center gap-2 text-green-400">
          <ArrowUpCircle size={24} className="lg:w-6 lg:h-6" />
          <span className="font-bold text-xl lg:text-2xl">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 2. SAÍDAS (CORRIGIDO: Estrutura Híbrida Mobile/Desktop) */}
      <div 
        onClick={totalBudgetLimit > 0 ? onOpenBudgetModal : undefined}
        className={`bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col justify-center relative overflow-hidden ${totalBudgetLimit > 0 ? 'cursor-pointer hover:border-red-500/50 transition-colors' : ''} lg:items-center`}
      >
        {/* Wrapper: w-full no mobile (para separar título/valor), w-auto no desktop (para linha compacta) */}
        <div className="z-10 w-full lg:w-auto flex flex-col lg:items-center">
            
            {/* Header: Row no Mobile, Col no Desktop */}
            <div className="flex items-center justify-between w-full lg:flex-col lg:justify-center lg:gap-1">
                <span className="text-gray-400 text-xs uppercase font-bold flex items-center gap-1">
                    Saídas (Mês)
                    {totalBudgetLimit > 0 && isOverBudget && <AlertCircle size={12} className="text-red-500"/>}
                </span>
                
                <div className="flex items-center gap-2 text-red-400">
                    <ArrowDownCircle size={24} className="lg:w-6 lg:h-6" />
                    <span className="font-bold text-xl lg:text-2xl">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Linha do Orçamento */}
            {totalBudgetLimit > 0 && (
                <div className="mt-1 lg:mt-2 pt-2 border-t border-red-500/30 w-full flex flex-col items-end lg:items-center">
                    <span className={`text-[10px] uppercase ${isOverBudget ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                        {isOverBudget ? 'Excedido' : 'Disponível'}
                    </span>
                    <span className={`text-sm font-bold ${isOverBudget ? 'text-red-400' : 'text-white'}`}>
                        R$ {Math.abs(remainingBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* 3. INVESTIMENTOS (Mesma correção aplicada) */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col justify-center relative overflow-hidden lg:items-center">
        
        <div className="z-10 w-full lg:w-auto flex flex-col lg:items-center">
            {/* Header */}
            <div className="flex items-center justify-between w-full lg:flex-col lg:justify-center lg:gap-1">
                <span className="text-purple-400 text-xs uppercase font-bold">Aportes (Mês)</span>
                
                <div className="flex items-center gap-2 text-purple-300">
                    <TrendingUp size={24} className="lg:w-6 lg:h-6" />
                    <span className="font-bold text-xl lg:text-2xl">R$ {investmentsFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>
            
            {/* Linha Patrimônio */}
            <div className="mt-1 lg:mt-2 pt-2 border-t border-purple-500/30 w-full flex flex-col items-end lg:items-center">
                <span className="text-[10px] text-gray-400 uppercase">Patrimônio Total</span>
                <span className="text-sm font-bold text-white">R$ {totalNetWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
        
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* 4. SALDO */}
      <div className={`bg-gray-800 p-4 rounded-xl border flex flex-col items-center justify-center relative ${totalBalance < 0 ? 'border-red-500/50' : 'border-blue-500/50'}`}>
        <span className="text-gray-400 text-xs uppercase font-bold mb-1">Saldo em Caixa (Mês)</span>
        <div className="flex items-center gap-2 text-white">
          <Wallet size={24} className="lg:w-6 lg:h-6" />
          <span className="font-bold text-xl lg:text-2xl">R$ {totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        
        {pendingDebt !== 0 && (
          <span className={`text-[10px] mt-1 px-2 py-0.5 rounded-full border flex items-center gap-1 ${
            pendingDebt > 0
              ? 'text-orange-400 bg-orange-900/20 border-orange-900/50'
              : 'text-red-400 bg-red-900/20 border-red-900/50'
          }`}>
             {pendingDebt > 0 ? '+' : '-'} R$ {Math.abs(pendingDebt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} {pendingDebt > 0 ? 'a receber' : 'a pagar'}
          </span>
        )}
      </div>
    </div>
  );
}