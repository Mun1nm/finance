import { useState } from "react";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";

export function DeleteWalletModal({ wallet, onClose, onConfirm, wallets, isSubmitting }) {
  const [destinyId, setDestinyId] = useState("");

  const handleConfirm = () => {
    onConfirm(wallet.id, destinyId);
  };

  if (!wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-red-500/30 animate-scale-up shadow-2xl">
            <div className="flex items-center gap-3 mb-4 text-red-400">
                <AlertTriangle size={24} />
                <h3 className="font-bold text-lg text-white">Excluir {wallet.name}</h3>
            </div>
            <p className="text-gray-300 text-sm mb-4">Saldo: <strong className="text-white">R$ {wallet.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</p>
            <div className="space-y-4">
                <div className={`p-3 rounded-lg border cursor-pointer transition-all ${destinyId ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
                    <label className="text-xs text-gray-400 block mb-1">Transferir para...</label>
                    <div className="relative">
                        <select value={destinyId} onChange={e => setDestinyId(e.target.value)} className="w-full bg-gray-800 text-white rounded p-2 pr-10 text-sm outline-none border border-gray-600 focus:border-blue-500 appearance-none">
                            <option value="">Selecione...</option>
                            {wallets.filter(w => w.id !== wallet.id).map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
                <div onClick={() => setDestinyId("")} className={`p-3 rounded-lg border cursor-pointer transition-all ${!destinyId ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-700/30 border-gray-600 opacity-50'}`}>
                    <p className="font-bold text-sm text-white mb-1">Apenas Excluir</p>
                    <p className="text-xs text-gray-400">Zerar o saldo com um ajuste e excluir.</p>
                </div>
            </div>
            <div className="flex gap-2 mt-6">
                <button onClick={onClose} className="flex-1 p-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 font-medium">Cancelar</button>
                <button onClick={handleConfirm} disabled={isSubmitting} className={`flex-1 p-3 rounded-lg text-white font-bold shadow-lg flex justify-center gap-2 ${destinyId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (destinyId ? "Transferir e Excluir" : "Excluir Tudo")}
                </button>
            </div>
        </div>
    </div>
  );
}