import { useState, useEffect } from "react";
import { Star, Trash2, CreditCard, Receipt, MoreVertical, X } from "lucide-react";

export function WalletList({ wallets, onSetDefault, onDeleteClick, onWalletClick }) {
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin px-1">
        {wallets.map(w => (
            <div 
                key={w.id} 
                className={`min-w-[170px] p-3 rounded-lg border flex flex-col relative group transition-all shrink-0 ${
                    w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                }`}
            >
                {/* --- AÇÕES (POSICIONAMENTO ABSOLUTO) --- */}
                <div className="absolute top-2 right-2 z-20">
                    <div className="hidden md:flex flex-col gap-1 items-center">
                         <button 
                            onClick={(e) => { e.stopPropagation(); onSetDefault(w.id); }} 
                            className={`p-1.5 rounded-full transition-colors ${w.isDefault ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-200 hover:bg-gray-700'}`}
                            title={w.isDefault ? "Padrão" : "Definir como Padrão"}
                        >
                            <Star size={14} fill={w.isDefault ? "currentColor" : "none"} />
                        </button>
                        
                        {!w.isDefault && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteClick(w); }} 
                                className="p-1.5 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Excluir Carteira"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* MOBILE: Menu 3 Pontinhos */}
                    <div className="md:hidden relative">
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                setOpenMenuId(openMenuId === w.id ? null : w.id); 
                            }} 
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                            {openMenuId === w.id ? <X size={16} /> : <MoreVertical size={16} />}
                        </button>

                        {openMenuId === w.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-fade-in z-30">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSetDefault(w.id); setOpenMenuId(null); }} 
                                    className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${w.isDefault ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-300 hover:bg-gray-800'}`}
                                >
                                    <Star size={12} fill={w.isDefault ? "currentColor" : "none"} /> 
                                    {w.isDefault ? 'É Padrão' : 'Tornar Padrão'}
                                </button>
                                
                                {!w.isDefault && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteClick(w); setOpenMenuId(null); }} 
                                        className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 border-t border-gray-800"
                                    >
                                        <Trash2 size={12} /> Excluir
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- CONTEÚDO DO CARD --- */}
                <div className="flex items-center gap-2 mb-2 pr-6">
                    <span className="text-xs text-gray-400 truncate font-medium">{w.name}</span>
                    {w.hasCredit && <CreditCard size={12} className="text-purple-400 shrink-0" />}
                </div>

                {/* AJUSTE 1: Reduzi mb-3 para mb-2 */}
                <span className={`font-bold text-lg mb-2 ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                    R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>

                {w.hasCredit && (
                    // AJUSTE 1: Reduzi pt-2 para pt-1
                    <div className="mt-auto pt-1">
                        {w.currentInvoice > 0 ? (
                            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded flex items-center justify-between hover:bg-purple-500/30 transition-colors">
                                <span title="Fatura Atual" className="flex items-center gap-1"><Receipt size={12} /> Fatura</span>
                                <span className="font-bold">R$ {w.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </button>
                        ) : (
                            <button onClick={() => onWalletClick(w)} className="w-full text-[10px] text-gray-500 border border-gray-600/30 p-1.5 rounded flex items-center justify-center hover:bg-gray-700 transition-colors gap-2 cursor-default">
                                <Receipt size={12} /> <span className="opacity-50">Fatura Zerada</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        ))}
    </div>
  );
}