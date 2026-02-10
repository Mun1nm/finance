import { Wallet, CreditCard, Layers, Check } from "lucide-react";

export function PaymentOptions({ 
  paymentMethod, 
  setPaymentMethod, 
  hasCredit, 
  isInstallment, 
  setIsInstallment, 
  installmentsCount, 
  setInstallmentsCount,
  isSubscription 
}) {
  return (
    <div className="space-y-2">
        <div className="flex gap-2 bg-gray-700/50 p-1 rounded-lg border border-gray-600">
            <button type="button" onClick={() => setPaymentMethod("debit")} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'debit' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><Wallet size={14} /> Débito</button>
            <button type="button" onClick={() => setPaymentMethod("credit")} className={`flex-1 py-2 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${paymentMethod === 'credit' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><CreditCard size={14} /> Crédito</button>
        </div>
        
        {/* Lógica: Se for crédito E NÃO for assinatura, mostra opção de parcelar */}
        {paymentMethod === 'credit' && !isSubscription && (
            <div className={`p-2 rounded-lg border transition-all ${isInstallment ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-700/30 border-gray-600'}`}>
                <div className={`flex items-center gap-2 ${isInstallment ? 'mb-2' : ''}`}>
                    <div className="relative flex items-center">
                        <input type="checkbox" id="installCheck" checked={isInstallment} onChange={(e) => setIsInstallment(e.target.checked)} className="peer appearance-none w-5 h-5 rounded border border-gray-500 bg-gray-800 checked:bg-purple-600 checked:border-purple-600 transition-colors cursor-pointer" />
                        <Check size={12} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none opacity-0 peer-checked:opacity-100" />
                    </div>
                    <label htmlFor="installCheck" className="text-sm text-gray-300 cursor-pointer select-none flex items-center gap-2 w-full"><Layers size={14} /> Parcelar Compra</label>
                </div>
                {isInstallment && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        <label className="text-xs text-gray-400 whitespace-nowrap">Nº Parcelas:</label>
                        <input type="number" inputMode="numeric" min="2" max="60" value={installmentsCount} onChange={e => setInstallmentsCount(e.target.value)} className="w-16 bg-gray-900 text-white p-1 rounded text-center border border-purple-500/50 outline-none text-sm h-auto" />
                    </div>
                )}
            </div>
        )}
    </div>
  );
}