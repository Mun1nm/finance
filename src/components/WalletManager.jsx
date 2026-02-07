import { useState } from "react";
import { Wallet, ArrowRightLeft, Plus, Star, Trash2, AlertTriangle, Clock, CreditCard, ChevronRight, Check } from "lucide-react";

export function WalletManager({ 
  wallets, 
  walletBalances, 
  overallBalance, 
  futureBalance, 
  transactions, // Recebe transações para listar na fatura
  onOpenFutureModal, 
  onAddWallet, 
  onSetDefault, 
  onDeleteWallet, 
  onTransfer, 
  onAddTransaction 
}) {
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // States para Nova Carteira
  const [newWalletName, setNewWalletName] = useState("");
  const [hasCredit, setHasCredit] = useState(false);
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");

  const [walletDeleteData, setWalletDeleteData] = useState(null);
  const [walletDestinyId, setWalletDestinyId] = useState("");

  // States para Fatura
  const [invoiceModalWallet, setInvoiceModalWallet] = useState(null);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    await onAddWallet(newWalletName, hasCredit, closingDay, dueDay);
    setNewWalletName("");
    setHasCredit(false);
    setIsWalletModalOpen(false);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const fromWallet = wallets.find(w => w.id === transferData.from);
    const toWallet = wallets.find(w => w.id === transferData.to);
    
    if (!fromWallet || !toWallet) {
        alert("Selecione as carteiras de origem e destino.");
        return;
    }
    
    await onTransfer(
        transferData.amount, 
        transferData.from, 
        transferData.to, 
        transferData.date, 
        fromWallet.name, 
        toWallet.name
    );
    
    setIsTransferModalOpen(false);
    setTransferData({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const handlePayInvoice = async () => {
      if (!invoiceModalWallet) return;
      const { balance, currentInvoice, currentInvoiceDate, id } = invoiceModalWallet;

      if (balance < currentInvoice) {
          alert("Saldo insuficiente na carteira para pagar a fatura.");
          return;
      }

      await onAddTransaction(
          currentInvoice,
          "Pagamento de Fatura",
          "Transferências",
          "expense",
          false,
          `Fatura ${currentInvoiceDate}`,
          new Date().toISOString().split('T')[0],
          id, // Wallet ID
          null, null, null, false, 
          'debit', // Sai como débito
          currentInvoiceDate, // Marca qual fatura pagou
          true // isInvoicePayment
      );

      setInvoiceModalWallet(null);
  };

  const initiateWalletDeletion = (wallet) => {
    if (wallets.length <= 1) {
        alert("Você precisa ter pelo menos uma carteira.");
        return;
    }
    setWalletDeleteData(wallet);
    setWalletDestinyId("");
  };

  const confirmWalletDeletion = async () => {
    if (!walletDeleteData) return;
    const { id, name, balance } = walletDeleteData;

    try {
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
    } catch (error) {
        console.error(error);
    } finally {
        setWalletDeleteData(null);
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
                        <button 
                            onClick={onOpenFutureModal}
                            className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
                            title="Ver recebimentos futuros"
                        >
                            <Clock size={12} />
                            + R$ {futureBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <button onClick={() => onSetDefault(w.id)} className={`p-1 rounded-full transition-colors hover:bg-gray-700/50 ${w.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`} title="Definir como Padrão">
                            <Star size={12} fill={w.isDefault ? "currentColor" : "none"} />
                        </button>
                        
                        {!w.isDefault && (
                            <button onClick={() => initiateWalletDeletion(w)} className="p-1 rounded-full text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100" title="Excluir Carteira">
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 truncate pr-6 font-medium">{w.name}</span>
                        {w.hasCredit && <CreditCard size={10} className="text-purple-400" />}
                    </div>
                    
                    <span className={`font-bold text-sm ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>

                    {/* Exibir Fatura se tiver crédito */}
                    {w.hasCredit && w.currentInvoice > 0 && (
                        <button 
                            onClick={() => setInvoiceModalWallet(w)}
                            className="mt-2 text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 p-1.5 rounded flex items-center justify-between hover:bg-purple-500/30 transition-colors"
                        >
                            <span>Fatura Atual</span>
                            <span className="font-bold">R$ {w.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </button>
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
                            <input type="text" className="w-full bg-gray-700 p-3 rounded-lg text-white" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} required autoFocus />
                        </div>
                        
                        {/* TOGGLE CRÉDITO */}
                        <div className={`p-3 rounded-lg border transition-all ${hasCredit ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-700/30 border-gray-600'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <input type="checkbox" id="creditCheck" checked={hasCredit} onChange={(e) => setHasCredit(e.target.checked)} className="w-4 h-4 rounded text-purple-500 bg-gray-700 border-gray-500 cursor-pointer accent-purple-500" />
                                <label htmlFor="creditCheck" className="text-sm text-gray-300 cursor-pointer select-none">
                                    Possui Função Crédito?
                                </label>
                            </div>
                            
                            {hasCredit && (
                                <div className="flex gap-2 animate-fade-in">
                                    <div>
                                        <label className="text-[10px] text-gray-400">Fechamento (Dia)</label>
                                        <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-600" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400">Vencimento (Dia)</label>
                                        <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full bg-gray-800 text-white p-2 rounded text-sm border border-gray-600" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                            <button type="submit" className="flex-1 p-2 bg-green-600 rounded text-white font-bold">Criar</button>
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
                        <div>
                            <label className="text-xs text-gray-400">De</label>
                            <select className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})} required>
                                <option value="">Selecione...</option>
                                {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400">Para</label>
                            <select className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})} required>
                                <option value="">Selecione...</option>
                                {wallets.filter(w => w.id !== transferData.from).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <input type="number" step="0.01" placeholder="Valor" className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} required />
                        <input type="date" className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.date} onChange={e => setTransferData({...transferData, date: e.target.value})} required />
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                            <button type="submit" className="flex-1 p-2 bg-blue-600 rounded text-white font-bold">Transferir</button>
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
                    
                    <p className="text-gray-300 text-sm mb-4">
                        Saldo: <strong className="text-white">R$ {walletDeleteData.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
                    </p>

                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg border cursor-pointer transition-all ${walletDestinyId ? 'bg-blue-600/20 border-blue-500' : 'bg-gray-700/50 border-gray-600'}`}>
                            <label className="text-xs text-gray-400 block mb-1">Transferir para...</label>
                            <select value={walletDestinyId} onChange={e => setWalletDestinyId(e.target.value)} className="w-full bg-gray-800 text-white rounded p-2 text-sm outline-none border border-gray-600 focus:border-blue-500">
                                <option value="">Selecione...</option>
                                {wallets.filter(w => w.id !== walletDeleteData.id).map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                            </select>
                        </div>

                        <div onClick={() => setWalletDestinyId("")} className={`p-3 rounded-lg border cursor-pointer transition-all ${!walletDestinyId ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-700/30 border-gray-600 opacity-50'}`}>
                            <p className="font-bold text-sm text-white mb-1">Apenas Excluir</p>
                            <p className="text-xs text-gray-400">Zerar o saldo com um ajuste e excluir.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                        <button onClick={() => setWalletDeleteData(null)} className="flex-1 p-3 bg-gray-700 rounded-lg text-gray-300 hover:bg-gray-600 font-medium">Cancelar</button>
                        <button onClick={confirmWalletDeletion} className={`flex-1 p-3 rounded-lg text-white font-bold shadow-lg ${walletDestinyId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            {walletDestinyId ? "Transferir e Excluir" : "Excluir Tudo"}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL PAGAMENTO DE FATURA */}
        {invoiceModalWallet && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-purple-500/30 animate-scale-up shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <CreditCard className="text-purple-400" />
                            <h3 className="font-bold text-lg text-white">{invoiceModalWallet.name} - Fatura</h3>
                        </div>
                        <button onClick={() => setInvoiceModalWallet(null)} className="text-gray-400 hover:text-white"><Plus size={20} className="rotate-45" /></button>
                    </div>

                    <div className="mb-6 bg-purple-900/20 p-4 rounded-xl border border-purple-500/30 text-center">
                        <p className="text-purple-300 text-sm mb-1">Valor da Fatura Aberta</p>
                        <span className="text-3xl font-bold text-white">R$ {invoiceModalWallet.currentInvoice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <p className="text-gray-400 text-xs mt-2">Vence dia {invoiceModalWallet.dueDay}</p>
                    </div>

                    {/* Lista das despesas da fatura */}
                    <div className="max-h-[40vh] overflow-y-auto pr-2 mb-4 space-y-2 scrollbar-thin">
                        {transactions
                            .filter(t => t.walletId === invoiceModalWallet.id && t.paymentMethod === 'credit' && t.invoiceDate === invoiceModalWallet.currentInvoiceDate)
                            .map(t => (
                                <div key={t.id} className="flex justify-between items-center text-sm p-2 bg-gray-700/30 rounded">
                                    <span className="text-gray-300">{t.description || t.category}</span>
                                    <span className="text-white font-bold">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                    </div>

                    <button 
                        onClick={handlePayInvoice}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={18} /> Pagar Fatura
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}