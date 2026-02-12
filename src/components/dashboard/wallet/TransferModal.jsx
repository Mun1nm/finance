import { useState } from "react";
import { ChevronDown, Calendar, Loader2 } from "lucide-react";
import { MoneyInput } from "../../ui/MoneyInput";

export function TransferModal({ isOpen, onClose, onTransfer, wallets, isSubmitting }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!from || !to || !amount) return;
    await onTransfer(amount, from, to, date);
    // Reset fields
    setFrom("");
    setTo("");
    setAmount("");
    setDate(new Date().toLocaleDateString('en-CA'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
            <h3 className="font-bold text-lg mb-4 text-white">Transferência</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <label className="text-xs text-gray-400">De</label>
                    <select className="w-full bg-gray-700 p-2 pr-10 rounded text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500" value={from} onChange={e => setFrom(e.target.value)} required>
                        <option value="">Selecione...</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
                </div>
                <div className="relative">
                    <label className="text-xs text-gray-400">Para</label>
                    <select className="w-full bg-gray-700 p-2 pr-10 rounded text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500" value={to} onChange={e => setTo(e.target.value)} required>
                        <option value="">Selecione...</option>
                        {wallets.filter(w => w.id !== from).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Valor</label>
                    <MoneyInput value={amount} onChange={setAmount} />
                </div>

                <div className="relative overflow-hidden">
                    <label className="text-xs text-gray-400 mb-1 block">Data</label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input 
                            type="date" 
                            className="w-full bg-gray-700 p-3 pl-10 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:hidden appearance-none min-w-0 max-w-full"
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            required 
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-4">
                    <button type="button" onClick={onClose} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 p-2 bg-blue-600 rounded text-white font-bold flex justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Transferir"}</button>
                </div>
            </form>
        </div>
    </div>
  );
}