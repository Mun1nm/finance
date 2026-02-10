import { useState } from "react";
import { X, CreditCard, ChevronLeft, ChevronRight, Check, Loader2, Save, Pencil, Trash2 } from "lucide-react";
import { useWallets } from "../../hooks/useWallets";

export function InvoiceModal({ wallet, transactions, onClose, onPayInvoice }) {
  const { updateWallet } = useWallets();
  
  const [viewDate, setViewDate] = useState(() => {
    if (wallet.currentInvoiceDate) {
        const [year, month] = wallet.currentInvoiceDate.split('-').map(Number);
        return new Date(year, month - 1, 1);
    }
    return new Date();
  });
  
  const [editingLimit, setEditingLimit] = useState(false);
  const [newLimitValue, setNewLimitValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInvoiceString = (date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  const changeMonth = (offset) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  const viewingInvoiceString = getInvoiceString(viewDate);
  
  const invoiceTransactions = transactions.filter(t => 
    t.walletId === wallet.id && 
    t.paymentMethod === 'credit' && 
    t.invoiceDate === viewingInvoiceString
  );

  const totalAmount = invoiceTransactions.reduce((acc, t) => acc + t.amount, 0);
  const unpaidTransactions = invoiceTransactions.filter(t => !t.isPaidCredit);
  const payableAmount = unpaidTransactions.reduce((acc, t) => acc + t.amount, 0);

  const globalUsedLimit = transactions
    .filter(t => t.walletId === wallet.id && t.paymentMethod === 'credit' && !t.isPaidCredit)
    .reduce((acc, t) => acc + t.amount, 0);

  const today = new Date();
  const closingDay = parseInt(wallet.closingDay);
  const currentDay = today.getDate();
  let targetMonth = today.getMonth();
  let targetYear = today.getFullYear();
  
  if (currentDay >= closingDay) {
      targetMonth++;
      if (targetMonth > 11) { targetMonth = 0; targetYear++; }
  }
  const currentRealInvoiceString = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
  
  let status = "future"; 
  let statusColor = "text-gray-400";
  let statusBg = "bg-gray-700/30";

  if (viewingInvoiceString === currentRealInvoiceString) {
      status = "open"; 
      statusColor = "text-blue-400";
      statusBg = "bg-blue-500/10 border-blue-500/30";
  } else if (viewingInvoiceString < currentRealInvoiceString) {
      if (payableAmount > 0.01) {
          status = "overdue"; 
          statusColor = "text-red-400";
          statusBg = "bg-red-500/10 border-red-500/30";
      } else {
          status = "paid"; 
          statusColor = "text-green-400";
          statusBg = "bg-green-500/10 border-green-500/30";
      }
  }

  const handleUpdateLimit = async () => {
    if (!newLimitValue || isNaN(newLimitValue) || isSubmitting) return;
    try {
        setIsSubmitting(true);
        await updateWallet(wallet.id, { creditLimit: parseFloat(newLimitValue) });
        setEditingLimit(false);
    } catch (error) {
        console.error("Erro ao atualizar limite", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const onPay = async () => {
      if (payableAmount <= 0 || isSubmitting) return;
      try {
          setIsSubmitting(true);
          const idsToPay = unpaidTransactions.map(t => t.id);
          await onPayInvoice(wallet.id, payableAmount, viewingInvoiceString, idsToPay);
      } catch (error) {
          console.error("Erro ao pagar", error);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
        <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-purple-500/30 animate-scale-up shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
            
            <div className="flex flex-col mb-4">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <CreditCard className="text-purple-400" /> {wallet.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                    Vencimento dia {wallet.dueDay} • Fechamento dia {wallet.closingDay}
                </p>
            </div>

            <div className="mb-5 bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold">Limite Utilizado (Total)</span>
                    {editingLimit ? (
                        <div className="flex gap-1 items-center">
                            <input 
                                type="number" 
                                autoFocus
                                className="w-24 bg-gray-900 border border-purple-500 rounded text-xs text-white p-1 text-right outline-none"
                                value={newLimitValue}
                                onChange={e => setNewLimitValue(e.target.value)}
                                placeholder={wallet.creditLimit}
                            />
                            <button onClick={handleUpdateLimit} className="bg-green-600 p-1 rounded text-white hover:bg-green-500"><Save size={12}/></button>
                        </div>
                    ) : (
                        <div className="text-xs text-purple-200 flex gap-2 items-center">
                            <span>R$ {(globalUsedLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-gray-500 mx-1">/</span> {wallet.creditLimit > 0 ? `R$ ${wallet.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Sem Limite"}</span>
                            <button onClick={() => { setEditingLimit(true); setNewLimitValue(wallet.creditLimit || ""); }} className="text-gray-500 hover:text-white underline p-1 hover:bg-gray-600 rounded"><Pencil size={14} /></button>
                        </div>
                    )}
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${wallet.creditLimit > 0 && (globalUsedLimit / wallet.creditLimit) > 0.9 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${wallet.creditLimit > 0 ? Math.min(((globalUsedLimit || 0) / wallet.creditLimit) * 100, 100) : 0}%` }}></div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4 bg-gray-900/50 p-2 rounded-lg border border-gray-700">
                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                <div className="text-center">
                    <span className="block font-bold text-white capitalize text-sm">{viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${statusColor} bg-white/5`}>
                        {status === 'open' && "Fatura Atual"}
                        {status === 'future' && "Fatura Futura"}
                        {status === 'overdue' && "Em Aberto / Vencida"}
                        {status === 'paid' && "Paga"}
                    </span>
                </div>
                <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
            </div>

            <div className={`mb-4 p-4 rounded-xl border text-center transition-colors ${statusBg}`}>
                <p className={`text-sm mb-1 ${statusColor}`}>Total desta Fatura</p>
                <span className="text-3xl font-bold text-white">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                {status === 'overdue' && (
                    <p className="text-xs text-red-300 mt-1 font-bold">Restante a Pagar: R$ {payableAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                )}
            </div>

            <div className="max-h-[30vh] overflow-y-auto pr-2 mb-4 space-y-2 scrollbar-thin">
                {invoiceTransactions.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Nenhum lançamento nesta fatura.</p>}
                {invoiceTransactions.map(t => (
                    <div key={t.id} className={`flex justify-between items-center text-sm p-2 rounded border transition-colors ${t.isPaidCredit ? 'bg-green-900/10 border-green-900/30 opacity-60' : 'bg-gray-700/30 border-transparent hover:border-gray-600'}`}>
                        <div className="flex flex-col overflow-hidden">
                            {/* TÍTULO: Categoria (ex: Restaurante) */}
                            <span className={`truncate pr-2 font-medium ${t.isPaidCredit ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                                {t.category}
                            </span>
                            
                            {/* SUBTÍTULO: Descrição (ex: Doce 1/2) + Data */}
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span className="truncate max-w-[150px]">
                                    {t.description ? t.description : 'Sem descrição'}
                                </span>
                                <span className="mx-1 text-gray-600">•</span>
                                <span>{new Date(t.date.seconds * 1000).toLocaleDateString('pt-BR')}</span>
                            </span>
                        </div>
                        <span className={`font-bold whitespace-nowrap ${t.isPaidCredit ? 'text-gray-500' : 'text-white'}`}>R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                ))}
            </div>

            {payableAmount > 0.01 ? (
                <button 
                    onClick={onPay}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Pagar R$ {payableAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>}
                </button>
            ) : (
                <div className="w-full py-3 bg-gray-700/50 text-gray-500 font-bold rounded-lg flex items-center justify-center gap-2 cursor-default border border-gray-600">
                    <Check size={18} /> {totalAmount > 0 ? "Fatura Paga" : "Sem Débitos"}
                </div>
            )}
        </div>
    </div>
  );
}