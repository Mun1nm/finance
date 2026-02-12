import { Star, Trash2, CreditCard, Receipt } from "lucide-react";

export function WalletList({ wallets, onSetDefault, onDeleteClick, onWalletClick }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {wallets.map(w => (
            <div key={w.id} className={`min-w-[160px] p-3 rounded-lg border flex flex-col relative group transition-all ${w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); onSetDefault(w.id); }} className={`p-1 rounded-full transition-colors hover:bg-gray-700/50 ${w.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}><Star size={12} fill={w.isDefault ? "currentColor" : "none"} /></button>
                    {!w.isDefault && (
                        // Ajuste aqui: opacity-100 por padrão (mobile), md:opacity-0 (esconde no desktop até hover), p-2 (maior clique)
                        <button onClick={(e) => { e.stopPropagation(); onDeleteClick(w); }} className="p-2 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"><Trash2 size={14} /></button>
                    )}
                </div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 truncate pr-6 font-medium">{w.name}</span>
                    {w.hasCredit && <CreditCard size={10} className="text-purple-400" />}
                </div>
                <span className={`font-bold text-sm ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {w.hasCredit && (
                    <div className="mt-2 space-y-1">
                        {w.currentInvoice > 0 ? (
                            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded flex items-center justify-between hover:bg-purple-500/30 transition-colors">
                                <span title="Fatura Atual"><Receipt size={14} /></span>
                                <span className="font-bold">R$ {w.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </button>
                        ) : (
                            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] text-gray-500 border border-gray-600/30 p-1.5 rounded flex items-center justify-center hover:bg-gray-700 transition-colors gap-2">
                                <Receipt size={14} /> <span className="opacity-50">Zerada</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        ))}
    </div>
  );
}