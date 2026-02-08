import { useState, useEffect } from "react";
import { Wallet, ArrowRightLeft, Plus, Star, Trash2, AlertTriangle, Clock, CreditCard, Check, Save, Pencil, Loader2, Receipt, Calendar, ChevronDown } from "lucide-react"; 
import { useWallets } from "../../hooks/useWallets";
import { useTransactions } from "../../hooks/useTransactions";
import { MoneyInput } from "../ui/MoneyInput"; 

export function WalletManager({ 
  wallets, 
  walletBalances, 
  overallBalance, 
  futureBalance, 
  transactions, 
  onOpenFutureModal, 
  onAddWallet, 
  onSetDefault, 
  onDeleteWallet, 
  onTransfer, 
  onAddTransaction,
  setNotification 
}) {
  const { updateWallet } = useWallets();
  const { payInvoice } = useTransactions();

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', date: new Date().toLocaleDateString('en-CA') });
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  const [newWalletName, setNewWalletName] = useState("");
  const [hasCredit, setHasCredit] = useState(false);
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [creditLimit, setCreditLimit] = useState("");

  const [walletDeleteData, setWalletDeleteData] = useState(null);
  const [walletDestinyId, setWalletDestinyId] = useState("");

  const [invoiceModalWallet, setInvoiceModalWallet] = useState(null);
  const [editingLimit, setEditingLimit] = useState(false);
  const [newLimitValue, setNewLimitValue] = useState(""); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
      if (invoiceModalWallet) {
          const updatedWallet = walletBalances.find(w => w.id === invoiceModalWallet.id);
          if (updatedWallet) {
              setInvoiceModalWallet(updatedWallet);
          }
      }
  }, [walletBalances]);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim() || isSubmitting) return;

    try {
        setIsSubmitting(true);
        // O MoneyInput retorna float, passamos direto. Se creditLimit for vazio, o hook trata.
        await onAddWallet(newWalletName, hasCredit, closingDay, dueDay, creditLimit); 
        
        setNewWalletName("");
        setHasCredit(false);
        setCreditLimit("");
        setIsWalletModalOpen(false);
        setNotification({ msg: "Carteira criada!", type: "success" });
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro ao criar carteira.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const fromWallet = wallets.find(w => w.id === transferData.from);
    const toWallet = wallets.find(w => w.id === transferData.to);
    
    if (!fromWallet || !toWallet) {
        setNotification({ msg: "Selecione origem e destino.", type: "error" });
        return;
    }

    if (!transferData.amount || transferData.amount <= 0) {
        setNotification({ msg: "Insira um valor válido.", type: "error" });
        return;
    }
    
    try {
        setIsSubmitting(true);
        await onTransfer(
            transferData.amount, 
            transferData.from, 
            transferData.to, 
            transferData.date, 
            fromWallet.name, 
            toWallet.name
        );
        setIsTransferModalOpen(false);
        setTransferData({ from: '', to: '', amount: '', date: new Date().toLocaleDateString('en-CA') });
        setNotification({ msg: "Transferência realizada!", type: "success" });
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro na transferência.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePayInvoice = async () => {
      if (!invoiceModalWallet || isSubmitting) return;
      const { balance, currentInvoice, currentInvoiceDate, id } = invoiceModalWallet;

      if (balance < currentInvoice) {
          setNotification({ msg: "Saldo insuficiente nesta carteira!", type: "error" });
          return;
      }

      try {
          setIsSubmitting(true);
          const transactionsToPay = transactions
            .filter(t => t.walletId === id && t.paymentMethod === 'credit' && t.invoiceDate === currentInvoiceDate && !t.isPaidCredit)
            .map(t => t.id);

          await payInvoice(id, currentInvoice, currentInvoiceDate, transactionsToPay);
          setInvoiceModalWallet(null);
          setNotification({ msg: "Fatura paga com sucesso!", type: "success" });
      } catch (error) {
          console.error("Erro", error);
          setNotification({ msg: "Erro ao pagar fatura.", type: "error" });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleUpdateLimit = async () => {
      if (!newLimitValue || isNaN(newLimitValue) || isSubmitting) return;
      try {
          setIsSubmitting(true);
          await updateWallet(invoiceModalWallet.id, { creditLimit: parseFloat(newLimitValue) });
          setEditingLimit(false);
          setNotification({ msg: "Limite atualizado!", type: "success" });
      } catch (error) {
          console.error("Erro", error);
      } finally {
          setIsSubmitting(false);
      }
  };

  const initiateWalletDeletion = (wallet) => {
    if (wallets.length <= 1) {
        setNotification({ msg: "Você precisa ter pelo menos uma carteira.", type: "warning" });
        return;
    }
    setWalletDeleteData(wallet);
    setWalletDestinyId("");
  };

  const confirmWalletDeletion = async () => {
    if (!walletDeleteData || isSubmitting) return;
    const { id, name, balance } = walletDeleteData;

    try {
        setIsSubmitting(true);

        if (Math.abs(balance) > 0.01) {
            if (walletDestinyId) {
                const destinyWallet = wallets.find(w => w.id === walletDestinyId);
                const destinyName = destinyWallet ? destinyWallet.name : "Desconhecida";

                await onTransfer(
                    Math.abs(balance),
                    balance > 0 ? id : walletDestinyId,
                    balance > 0 ? walletDestinyId : id,
                    new Date().toISOString().split('T')[0],
                    balance > 0 ? name : destinyName,
                    balance > 0 ? destinyName : name
                );
            } else {
                const type = balance > 0 ? 'expense' : 'income';
                await onAddTransaction(
                    Math.abs(balance),
                    "Ajuste de Saldo",
                    "Outros",
                    type,
                    false,
                    `Encerramento da carteira: ${name}`,
                    new Date().toISOString().split('T')[0],
                    id
                );
            }
        }

        await onDeleteWallet(id);
        setWalletDeleteData(null);
        setNotification({ msg: "Carteira excluída.", type: "success" });
        
    } catch (error) {
        console.error("Erro", error);
        setNotification({ msg: "Erro ao excluir carteira.", type: "error" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
        
        <div className="flex justify-between items-end mb-4">
            <div className="flex flex-col gap-1">
                <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                    <Wallet size={16} /> Minhas Contas
                </h3>
                <div className="flex items-center gap-3">
                     <span className="text-2xl font-bold text-white">
                        R$ {overallBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                     {futureBalance > 0 && (
                        <button onClick={onOpenFutureModal} className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-500/30 transition-colors">
                            <Clock size={12} /> + R$ {futureBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </button>
                     )}
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Total Acumulado</span>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-2 rounded-lg border border-blue-500/50 flex items-center gap-1 hover:bg-blue-600/30">
                    <ArrowRightLeft size={14} /> Transferir
                </button>
                <button onClick={() => setIsWalletModalOpen(true)} className="text-xs bg-gray-700 text-gray-300 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-600">
                    <Plus size={14} /> Nova
                </button>
            </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {walletBalances.map(w => (
                <div key={w.id} className={`min-w-[160px] p-3 rounded-lg border flex flex-col relative group transition-all ${w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                        <button onClick={() => onSetDefault(w.id)} className={`p-1 rounded-full transition-colors hover:bg-gray-700/50 ${w.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}><Star size={12} fill={w.isDefault ? "currentColor" : "none"} /></button>
                        {!w.isDefault && (
                            <button onClick={() => setWalletDeleteData(w)} className="p-1 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
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
                                <button onClick={() => setInvoiceModalWallet(w)} className="w-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded flex items-center justify-between hover:bg-purple-500/30 transition-colors">
                                    <span title="Fatura Atual"><Receipt size={14} /></span>
                                    <span className="font-bold">R$ {w.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </button>
                            ) : (
                                <button onClick={() => setInvoiceModalWallet(w)} className="w-full text-[10px] text-gray-500 border border-gray-600/30 p-1.5 rounded flex items-center justify-center hover:bg-gray-700 transition-colors gap-2">
                                    <Receipt size={14} /> <span className="opacity-50">Zerada</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>

        {/* MODAL NOVA CARTEIRA */}
        {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
                    <h3 className="font-bold text-lg mb-4 text-white">Nova Conta</h3>
                    <form onSubmit={handleCreateWallet} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400">Nome</label>
                            <input type="text" className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} required autoFocus />
                        </div>
                        
                        <div className={`p-3 rounded-lg border transition-all ${hasCredit ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-700/30 border-gray-600'}`}>
                            <div className="flex items-center gap-2 mb-2">
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
                                            <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-center outline-none focus:border-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400">Vencimento (Dia)</label>
                                            <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white text-center outline-none focus:border-purple-500" />
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
                            <button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 p-2 bg-green-600 rounded text-white font-bold flex justify-center items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Criar"}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL TRANSFERÊNCIA */}
        {isTransferModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
                    <h3 className="font-bold text-lg mb-4 text-white">Transferência</h3>
                    <form onSubmit={handleTransfer} className="space-y-4">
                        <div className="relative">
                            <label className="text-xs text-gray-400">De</label>
                            <select className="w-full bg-gray-700 p-2 pr-10 rounded text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})} required>
                                <option value="">Selecione...</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
                        </div>
                        <div className="relative">
                            <label className="text-xs text-gray-400">Para</label>
                            <select className="w-full bg-gray-700 p-2 pr-10 rounded text-white appearance-none outline-none focus:ring-2 focus:ring-blue-500" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})} required>
                                <option value="">Selecione...</option>
                                {wallets.filter(w => w.id !== transferData.from).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-8 text-gray-400 pointer-events-none" />
                        </div>
                        
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block">Valor</label>
                            <MoneyInput value={transferData.amount} onChange={(val) => setTransferData({...transferData, amount: val})} />
                        </div>

                        <div className="relative">
                            <label className="text-xs text-gray-400 mb-1 block">Data</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input 
                                    type="date" 
                                    className="w-full bg-gray-700 p-3 pl-10 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-calendar-picker-indicator]:hidden"
                                    value={transferData.date} 
                                    onChange={e => setTransferData({...transferData, date: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                            <button type="submit" disabled={isSubmitting} className="flex-1 p-2 bg-blue-600 rounded text-white font-bold flex justify-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Transferir"}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* MODAL DELETAR */}
        {walletDeleteData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-red-500/30 animate-scale-up shadow-2xl">
                    <div className="flex items-center gap-3 mb-4 text-red-400">
                        <AlertTriangle size={24} />
                        <h3 className="font-bold text-lg text-white">Excluir {walletDeleteData.name}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">Saldo: <strong className="text-white">R$ {walletDeleteData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.</p>
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg border cursor-pointer transition-all ${walletDestinyId ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
                            <label className="text-xs text-gray-400 block mb-1">Transferir para...</label>
                            <div className="relative">
                                <select value={walletDestinyId} onChange={e => setWalletDestinyId(e.target.value)} className="w-full bg-gray-800 text-white rounded p-2 pr-10 text-sm outline-none border border-gray-600 focus:border-blue-500 appearance-none">
                                    <option value="">Selecione...</option>
                                    {wallets.filter(w => w.id !== walletDeleteData.id).map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div onClick={() => setWalletDestinyId("")} className={`p-3 rounded-lg border cursor-pointer transition-all ${!walletDestinyId ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-700/30 border-gray-600 opacity-50'}`}>
                            <p className="font-bold text-sm text-white mb-1">Apenas Excluir</p>
                            <p className="text-xs text-gray-400">Zerar o saldo com um ajuste e excluir.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button onClick={() => setWalletDeleteData(null)} className="flex-1 p-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 font-medium">Cancelar</button>
                        <button onClick={confirmWalletDeletion} disabled={isSubmitting} className={`flex-1 p-3 rounded-lg text-white font-bold shadow-lg flex justify-center gap-2 ${walletDestinyId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (walletDestinyId ? "Transferir e Excluir" : "Excluir Tudo")}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PAGAMENTO FATURA */}
        {invoiceModalWallet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-purple-500/30 animate-scale-up shadow-2xl relative">
                    <button onClick={() => setInvoiceModalWallet(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><Plus size={24} className="rotate-45" /></button>
                    <div className="flex flex-col mb-4">
                        <h3 className="font-bold text-lg text-white flex items-center gap-2"><CreditCard className="text-purple-400" /> {invoiceModalWallet.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">Vencimento dia {invoiceModalWallet.dueDay} • Fechamento dia {invoiceModalWallet.closingDay}</p>
                    </div>
                    {invoiceModalWallet.hasCredit && (
                        <div className="mb-5 bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[10px] text-gray-400 uppercase font-bold">Limite Utilizado</span>
                                {editingLimit ? (
                                    <div className="flex gap-1 items-center">
                                        <input type="number" autoFocus className="w-24 bg-gray-900 border border-purple-500 rounded text-xs text-white p-1 text-right outline-none" value={newLimitValue} onChange={e => setNewLimitValue(e.target.value)} placeholder={invoiceModalWallet.creditLimit} />
                                        <button onClick={handleUpdateLimit} className="bg-green-600 p-1 rounded text-white hover:bg-green-500"><Save size={12}/></button>
                                    </div>
                                ) : (
                                    <div className="text-xs text-purple-200 flex gap-2 items-center">
                                        <span>R$ {(invoiceModalWallet.usedLimit || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-gray-500 mx-1">/</span> {invoiceModalWallet.creditLimit > 0 ? `R$ ${invoiceModalWallet.creditLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Sem Limite Definido"}</span>
                                        <button onClick={() => { setEditingLimit(true); setNewLimitValue(invoiceModalWallet.creditLimit || ""); }} className="text-gray-500 hover:text-white underline p-1 hover:bg-gray-600 rounded"><Pencil size={14} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-500 ${invoiceModalWallet.creditLimit > 0 && (invoiceModalWallet.usedLimit / invoiceModalWallet.creditLimit) > 0.9 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${invoiceModalWallet.creditLimit > 0 ? Math.min(((invoiceModalWallet.usedLimit || 0) / invoiceModalWallet.creditLimit) * 100, 100) : 0}%` }}></div>
                            </div>
                        </div>
                    )}
                    <div className="mb-6 bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 text-center">
                        <p className="text-purple-300 text-sm mb-1">Valor da Fatura Aberta</p>
                        <span className="text-3xl font-bold text-white">R$ {invoiceModalWallet.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="max-h-[35vh] overflow-y-auto pr-2 mb-4 space-y-2 scrollbar-thin">
                        {transactions.length === 0 && <p className="text-center text-gray-500 text-sm py-4">Sem compras nesta fatura.</p>}
                        {transactions.filter(t => t.walletId === invoiceModalWallet.id && t.paymentMethod === 'credit' && t.invoiceDate === invoiceModalWallet.currentInvoiceDate).map(t => (
                            <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded border border-transparent hover:border-gray-600 transition-colors">
                                <span className="text-gray-300 truncate pr-2">{t.description || t.category}</span>
                                <span className="text-white font-bold whitespace-nowrap">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        ))}
                    </div>
                    <button onClick={handlePayInvoice} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={invoiceModalWallet.currentInvoice <= 0 || isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Pagar Fatura</>}
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}