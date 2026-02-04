import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp, Landmark } from "lucide-react";

export function Summary({ transactions, assets = [] }) { // Recebe assets agora
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  // Calcula despesas (ignorando dívidas pagas que anulam o efeito)
  const expense = transactions
    .filter((t) => t.type === "expense")
    .filter((t) => !(t.isDebt && t.debtPaid))
    .reduce((acc, t) => acc + t.amount, 0);

  // Aportes do MÊS (Dinheiro que saiu do caixa)
  const investmentsFlow = transactions
    .filter((t) => t.type === "investment")
    .reduce((acc, t) => acc + t.amount, 0);

  // Saldo Disponível (Caixa)
  const balance = income - expense - investmentsFlow;

  const pendingDebt = transactions
    .filter((t) => t.isDebt && !t.debtPaid)
    .reduce((acc, t) => acc + t.amount, 0);

  // NOVO: Cálculo do Patrimônio Total (Baseado nos Ativos atualizados)
  const totalNetWorth = assets.reduce((acc, a) => acc + (a.currentValue || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Entradas */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between lg:flex-col lg:justify-center">
        <span className="text-gray-400 text-xs uppercase font-bold lg:mb-1">Entradas</span>
        <div className="flex items-center gap-2 text-green-400">
          <ArrowUpCircle size={24} className="lg:w-6 lg:h-6" />
          <span className="font-bold text-xl lg:text-2xl">R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 2. Saídas */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between lg:flex-col lg:justify-center">
        <span className="text-gray-400 text-xs uppercase font-bold lg:mb-1">Saídas</span>
        <div className="flex items-center gap-2 text-red-400">
          <ArrowDownCircle size={24} className="lg:w-6 lg:h-6" />
          <span className="font-bold text-xl lg:text-2xl">R$ {expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 3. Investimentos (HÍBRIDO: Fluxo do Mês + Patrimônio Total) */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between lg:flex-col lg:justify-center relative overflow-hidden">
        <div className="z-10 flex flex-col items-start lg:items-center">
            <span className="text-purple-400 text-xs uppercase font-bold lg:mb-1">Aportes (Mês)</span>
            <div className="flex items-center gap-2 text-purple-300">
            <TrendingUp size={24} className="lg:w-6 lg:h-6" />
            <span className="font-bold text-xl lg:text-2xl">R$ {investmentsFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {/* Exibe o Total Acumulado logo abaixo */}
            <div className="mt-1 lg:mt-2 pt-2 border-t border-purple-500/30 w-full flex flex-col lg:items-center">
                <span className="text-[10px] text-gray-400 uppercase">Patrimônio Total</span>
                <span className="text-sm font-bold text-white">R$ {totalNetWorth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
        {/* Decoração de fundo */}
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-purple-500/10 rounded-full blur-2xl"></div>
      </div>

      {/* 4. Saldo em Conta */}
      <div className={`bg-gray-800 p-4 rounded-xl border flex flex-col items-center justify-center relative ${balance < 0 ? 'border-red-500/50' : 'border-blue-500/50'}`}>
        <span className="text-gray-400 text-xs uppercase font-bold mb-1">Saldo Disponível (Caixa)</span>
        <div className="flex items-center gap-2 text-white">
          <Wallet size={24} className="lg:w-6 lg:h-6" />
          <span className="font-bold text-xl lg:text-2xl">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        
        {pendingDebt > 0 && (
          <span className="text-[10px] text-orange-400 mt-1 bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-900/50 flex items-center gap-1">
             + R$ {pendingDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a receber
          </span>
        )}
      </div>
    </div>
  );
}