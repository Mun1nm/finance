import { useState } from "react";
import { Wallet, ArrowRightLeft, Plus, Clock, Calculator, Layers } from "lucide-react";

export function WalletHeader({ 
  overallBalance, 
  futureBalance, 
  totalInvoices, 
  onOpenFutureModal, 
  onOpenTransferModal, 
  onOpenCreateModal,
  onOpenInstallmentsModal
}) {
  const [showNetBalance, setShowNetBalance] = useState(false);
  const displayBalance = showNetBalance ? overallBalance - totalInvoices : overallBalance;

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 gap-4">
        <div className="flex flex-col gap-1">
            <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                <Wallet size={16} /> Minhas Contas
            </h3>
            <div className="flex items-center gap-3">
                 <span className={`text-2xl font-bold transition-colors ${showNetBalance ? 'text-orange-300' : 'text-white'}`}>
                    R$ {displayBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
                 
                 {/* BOTAO DA CALCULADORA */}
                 <button 
                    onClick={() => setShowNetBalance(!showNetBalance)}
                    className={`p-1.5 rounded-lg border border-gray-600/50 transition-all ${showNetBalance ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700/30 text-gray-500 hover:text-white hover:bg-gray-700'}`}
                    title={showNetBalance ? "Voltar ao saldo total" : "Simular saldo líquido (descontar faturas)"}
                 >
                    <Calculator size={18} />
                 </button>

                 {/* BOTAO DE PARCELAS (Agora cinza padrão) */}
                 <button 
                    onClick={onOpenInstallmentsModal}
                    className="p-1.5 rounded-lg border border-gray-600/50 transition-all bg-gray-700/30 text-gray-500 hover:text-white hover:bg-gray-700"
                    title="Ver projeção de parcelas"
                 >
                    <Layers size={18} />
                 </button>

                 {futureBalance > 0 && (
                    <button onClick={onOpenFutureModal} className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-500/30 transition-colors ml-2">
                        <Clock size={12} /> + R$ {futureBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </button>
                 )}
            </div>
            <span className={`text-[10px] font-medium transition-colors ${showNetBalance ? 'text-orange-300/70' : 'text-gray-500'}`}>
                {showNetBalance ? "Líquido (Descontando Faturas)" : "Total Acumulado"}
            </span>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={onOpenTransferModal} className="flex-1 sm:flex-none justify-center text-xs bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/50 flex items-center gap-1 hover:bg-blue-600/30">
                <ArrowRightLeft size={14} /> Transferir
            </button>
            <button onClick={onOpenCreateModal} className="flex-1 sm:flex-none justify-center text-xs bg-gray-700 text-gray-300 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-600">
                <Plus size={14} /> Nova
            </button>
        </div>
    </div>
  );
}