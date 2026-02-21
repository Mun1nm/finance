import { useState, useMemo } from "react";
import { X, Layers, CalendarDays, Wallet, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

export function InstallmentsModal({ isOpen, transactions, wallets, onClose }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedWalletFilter, setSelectedWalletFilter] = useState("");

    const allInstallments = useMemo(() => {
        return transactions.filter(t => {
            const isInstallment = t.totalInstallments > 1;
            const matchWallet = selectedWalletFilter ? t.walletId === selectedWalletFilter : true;
            return isInstallment && matchWallet;
        });
    }, [transactions, selectedWalletFilter]);

    const totalAllMonths = useMemo(() => {
        return allInstallments.reduce((acc, t) => {
            const isPaid = t.isPaidCredit || (t.isDebt && t.debtPaid);
            return isPaid ? acc : acc + t.amount;
        }, 0);
    }, [allInstallments]);

    const monthlyInstallments = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        return allInstallments.filter(t => {
            if (!t.date) return false;
            const d = new Date(t.date.seconds * 1000);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        }).sort((a, b) => new Date(a.date.seconds * 1000) - new Date(b.date.seconds * 1000));
    }, [allInstallments, currentDate]);

    const totalSelectedMonth = useMemo(() => {
        return monthlyInstallments.reduce((acc, t) => {
            const isPaid = t.isPaidCredit || (t.isDebt && t.debtPaid);
            return isPaid ? acc : acc + t.amount;
        }, 0);
    }, [monthlyInstallments]);

    const prevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const nextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-blue-500/30 animate-scale-up shadow-2xl relative flex flex-col max-h-[90vh]">
                
                {/* Botão de Fechar Absoluto */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors shrink-0">
                    <X size={24} />
                </button>

                {/* Cabeçalho Consistente */}
                <div className="flex flex-col mb-4 shrink-0 pr-8">
                    <h3 className="font-bold text-lg text-white flex items-center gap-2">
                        <Layers className="text-blue-400" /> Projeção de Parcelas
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Acompanhe seus compromissos futuros.
                    </p>
                </div>

                {/* Total Global (Estilo Bloco do Limite) */}
                <div className="mb-5 bg-gray-700/30 p-3 rounded-lg border border-gray-600 shrink-0">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Total Acumulado Pendente</span>
                        <div className="text-xs text-blue-200 font-bold">
                            R$ {totalAllMonths.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Filtro de Carteira (Novo layout mais discreto) */}
                <div className="flex items-center gap-2 mb-4 shrink-0">
                    <Wallet size={16} className="text-gray-500" />
                    <select 
                        value={selectedWalletFilter} 
                        onChange={e => setSelectedWalletFilter(e.target.value)}
                        className="flex-1 bg-transparent border-b border-gray-600 text-sm text-gray-300 pb-1 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    >
                        <option value="" className="bg-gray-800">Todas as Contas / Carteiras</option>
                        {wallets.map(w => (
                            <option key={w.id} value={w.id} className="bg-gray-800">{w.name}</option>
                        ))}
                    </select>
                </div>

                {/* Seletor de Mês (Idêntico ao InvoiceModal) */}
                <div className="flex items-center justify-between mb-4 bg-gray-900/50 p-2 rounded-lg border border-gray-700 shrink-0">
                    <button onClick={prevMonth} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <ChevronLeft size={20}/>
                    </button>
                    <div className="text-center">
                        <span className="block font-bold text-white capitalize text-sm">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${totalSelectedMonth > 0 ? 'text-blue-400 bg-blue-500/10' : 'text-gray-400 bg-white/5'} mt-1 inline-block`}>
                            {totalSelectedMonth > 0 ? "Com Parcelas" : "Mês Livre"}
                        </span>
                    </div>
                    <button onClick={nextMonth} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors">
                        <ChevronRight size={20}/>
                    </button>
                </div>

                {/* Card de Soma do Mês (Idêntico ao "Total desta Fatura") */}
                <div className="mb-4 p-4 rounded-xl border text-center transition-colors bg-blue-500/10 border-blue-500/30 shrink-0">
                    <p className="text-sm mb-1 text-blue-400">Total Previsto no Mês</p>
                    <span className="text-3xl font-bold text-white">R$ {totalSelectedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                {/* Lista de Transações (Mesmo container do InvoiceModal) */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin pb-2 min-h-[150px]">
                    {monthlyInstallments.length === 0 && (
                        <p className="text-center text-gray-500 text-sm py-4">Nenhuma parcela agendada para este mês.</p>
                    )}
                    {monthlyInstallments.map(t => {
                        const walletName = wallets.find(w => w.id === t.walletId)?.name || "Desconhecida";
                        const isPaid = t.isPaidCredit || (t.isDebt && t.debtPaid);

                        return (
                            <div key={t.id} className={`flex justify-between items-center text-sm p-2 rounded border transition-colors ${isPaid ? 'bg-green-900/10 border-green-900/30 opacity-60' : 'bg-gray-700/30 border-transparent hover:border-gray-600'}`}>
                                <div className="flex flex-col overflow-hidden w-full pr-2">
                                    <span className={`truncate font-medium flex items-center gap-1.5 ${isPaid ? 'text-gray-400 line-through' : 'text-gray-300'}`}>
                                        {t.category}
                                        {isPaid && <CheckCircle2 size={12} className="text-green-500/70 shrink-0" />}
                                    </span>
                                    
                                    <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                        <span className={`truncate max-w-[120px] ${isPaid ? 'line-through' : ''}`}>
                                            {t.description ? t.description : 'Sem descrição'}
                                        </span>
                                        <span className="mx-1 text-gray-600">•</span>
                                        <span className={`truncate ${isPaid ? 'line-through' : 'text-blue-300/60'}`}>{walletName}</span>
                                    </span>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className={`font-bold whitespace-nowrap ${isPaid ? 'text-gray-500 line-through' : 'text-white'}`}>
                                        R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}