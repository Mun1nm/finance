import { useState } from "react";
import { Wallet, ArrowRightLeft, Plus, Star, Trash2, AlertTriangle, Clock } from "lucide-react"; // Import Clock

export function WalletManager({ 
  wallets, 
  walletBalances, 
  overallBalance, 
  futureBalance, // <--- NOVO PROP
  onOpenFutureModal, // <--- NOVO PROP
  onAddWallet, 
  onSetDefault, 
  onDeleteWallet, 
  onTransfer, 
  onAddTransaction 
}) {
  
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");

  const [walletDeleteData, setWalletDeleteData] = useState(null);
  const [walletDestinyId, setWalletDestinyId] = useState("");

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    await onAddWallet(newWalletName);
    setNewWalletName("");
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
                
                {/* SALDO ACUMULADO + FUTURO */}
                <div className="flex items-center gap-3">
                     <span className="text-2xl font-bold text-white">
                        R$ {overallBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                     
                     {/* BADGE DE FUTURO (Reposicionado aqui) */}
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
                <div key={w.id} className={`min-w-[150px] p-3 rounded-lg border flex flex-col relative group transition-all ${w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                    
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

                    <span className="text-xs text-gray-400 truncate pr-8 mt-1">{w.name}</span>
                    <span className={`font-bold text-sm ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                        R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            ))}
        </div>

        {/* MODAIS (Cópia dos modais de Transfer e Create Wallet) */}
        {isWalletModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
                    <h3 className="font-bold text-lg mb-4 text-white">Nova Conta</h3>
                    <form onSubmit={handleCreateWallet} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400">Nome</label>
                            <input type="text" className="w-full bg-gray-700 p-3 rounded-lg text-white" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} required autoFocus />
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                            <button type="submit" className="flex-1 p-2 bg-green-600 rounded text-white font-bold">Criar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

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
    </div>
  );
}