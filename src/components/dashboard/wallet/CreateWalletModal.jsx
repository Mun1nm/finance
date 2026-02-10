import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { MoneyInput } from "../../ui/MoneyInput";

export function CreateWalletModal({ isOpen, onClose, onAddWallet, isSubmitting }) {
  const [newWalletName, setNewWalletName] = useState("");
  const [hasCredit, setHasCredit] = useState(false);
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [creditLimit, setCreditLimit] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    await onAddWallet(newWalletName, hasCredit, closingDay, dueDay, creditLimit);
    // Reset form
    setNewWalletName("");
    setHasCredit(false);
    setCreditLimit("");
    setClosingDay("1");
    setDueDay("10");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
            <h3 className="font-bold text-lg mb-4 text-white">Nova Conta</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs text-gray-400">Nome</label>
                    <input type="text" className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} required autoFocus />
                </div>
                
                <div className={`p-2 rounded-lg border transition-all ${hasCredit ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-700/30 border-gray-600'}`}>
                    <div className={`flex items-center gap-2 ${hasCredit ? 'mb-2' : ''}`}>
                        <div className="relative flex items-center">
                            <input type="checkbox" id="creditCheck" checked={hasCredit} onChange={(e) => setHasCredit(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-purple-600 checked:border-purple-600 transition-colors cursor-pointer" />
                            <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                        </div>
                        <label htmlFor="creditCheck" className="text-sm text-gray-300 cursor-pointer select-none">Possui Função Crédito?</label>
                    </div>
                    
                    {hasCredit && (
                        <div className="space-y-3 animate-fade-in mt-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400">Fechamento (Dia)</label>
                                    <input type="number" inputMode="numeric" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-center outline-none focus:border-purple-500" />
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] text-gray-400">Vencimento (Dia)</label>
                                    <input type="number" inputMode="numeric" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-center outline-none focus:border-purple-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Limite do Cartão</label>
                                <MoneyInput value={creditLimit} onChange={setCreditLimit} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-4">
                    <button type="button" onClick={onClose} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 p-2 bg-green-600 rounded text-white font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Criar"}</button>
                </div>
            </form>
        </div>
    </div>
  );
}