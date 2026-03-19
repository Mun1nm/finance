import { useState, useEffect } from "react";
import { X, SlidersHorizontal, AlertTriangle, Loader2 } from "lucide-react";
import { MoneyInput } from "../../ui/MoneyInput";

export function WalletEditModal({ wallet, onClose, onSave, isSubmitting }) {
    const [targetBalance, setTargetBalance] = useState("");

    useEffect(() => {
        if (wallet) {
            setTargetBalance(String(wallet.balance.toFixed(2)));
        }
    }, [wallet]);

    if (!wallet) return null;

    // Saldo puro de transações (sem o offset)
    const transactionBalance = wallet.balance - (wallet.initialBalance || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        const target = parseFloat(String(targetBalance).replace(",", "."));
        if (isNaN(target)) return;
        const newInitialBalance = target - transactionBalance;
        onSave(wallet.id, newInitialBalance);
    };

    const previewNewBalance = () => {
        const target = parseFloat(String(targetBalance).replace(",", "."));
        return isNaN(target) ? null : target;
    };

    const preview = previewNewBalance();

    return (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-blue-400" />
                        <h2 className="text-white font-bold text-base">{wallet.name}</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* Saldo atual */}
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-4">
                    <p className="text-xs text-gray-400 mb-1">Saldo atual</p>
                    <p className={`text-lg font-bold ${wallet.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        R$ {wallet.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {(wallet.initialBalance || 0) !== 0 && (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                            Transações: R$ {transactionBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} + Ajuste: R$ {(wallet.initialBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    )}
                </div>

                {/* Aviso */}
                <div className="flex gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-yellow-300 leading-relaxed">
                        Use apenas para alinhar com o saldo real da conta. Se ajustar, não registre as transações do período separadamente.
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Definir saldo como:</label>
                        <MoneyInput value={targetBalance} onChange={setTargetBalance} />
                    </div>

                    {preview !== null && preview !== wallet.balance && (
                        <p className="text-xs text-center text-gray-400">
                            Novo saldo: <span className={`font-bold ${preview >= 0 ? 'text-white' : 'text-red-400'}`}>
                                R$ {preview.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg text-sm text-gray-400 bg-gray-700 hover:bg-gray-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-2.5 rounded-lg text-sm text-white bg-blue-600 hover:bg-blue-700 font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
