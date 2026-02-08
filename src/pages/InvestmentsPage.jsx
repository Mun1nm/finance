import { useState, useEffect } from "react";
import { useInvestments } from "../hooks/useInvestments";
import { useTransactions } from "../hooks/useTransactions";
import { useWallets } from "../hooks/useWallets"; 
import { ArrowLeft, Plus, TrendingUp, DollarSign, RefreshCw, Trash2, Wallet, ArrowDownRight, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MoneyInput } from "../components/ui/MoneyInput";
import { Notification } from "../components/ui/Notification";
import { ConfirmModal } from "../components/ui/ConfirmModal";

export default function InvestmentsPage() {
  const { assets, addAsset, updateBalance, addContribution, deleteAsset, processWithdrawal } = useInvestments();
  const { addTransaction, deleteTransactionsByAssetId } = useTransactions();
  const { wallets } = useWallets(); 
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null); 
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(""); 
  const [withdrawTax, setWithdrawTax] = useState("");
  const [isFullWithdrawal, setIsFullWithdrawal] = useState(false);

  const totalInvested = assets.reduce((acc, a) => acc + (a.investedAmount || 0), 0);
  const totalCurrent = assets.reduce((acc, a) => acc + (a.currentValue || 0), 0);
  const totalYield = totalCurrent - totalInvested;
  const yieldPercentage = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

  useEffect(() => {
    if (wallets && wallets.length > 0 && !selectedWallet) {
        const defaultWallet = wallets.find(w => w.isDefault);
        setSelectedWallet(defaultWallet ? defaultWallet.id : wallets[0].id);
    }
  }, [wallets, isCreating, selectedAsset]);

  // --- CRIAR ATIVO ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !amount || !selectedWallet) return;
    
    const newAssetRef = await addAsset(name, "fixed", amount); 
    await addTransaction(amount, name, "Investimentos", "investment", false, "Aporte Inicial", null, selectedWallet, null, newAssetRef.id);

    setNotification({ msg: "Investimento criado!", type: "success" });
    setIsCreating(false);
    setName("");
    setAmount("");
  };

  const handleAction = async (e) => {
    e.preventDefault();
    if (!amount && actionType !== 'withdraw') return; 

    if (actionType === 'update') {
      await updateBalance(selectedAsset.id, amount);
      setNotification({ msg: "Rentabilidade atualizada!", type: "success" });
    } 
    else if (actionType === 'contribute') {
      if (!selectedWallet) return setNotification({ msg: "Selecione a conta!", type: "error" });
      
      await addContribution(selectedAsset.id, amount);
      await addTransaction(amount, selectedAsset.name, "Investimentos", "investment", false, "Aporte Adicional", null, selectedWallet, null, selectedAsset.id);
      
      setNotification({ msg: "Aporte realizado!", type: "success" });
    }
    else if (actionType === 'withdraw') {
      if (!selectedWallet) return setNotification({ msg: "Selecione o destino!", type: "error" });
      if (!amount) return setNotification({ msg: "Informe o valor resgatado.", type: "error" });

      const netAmount = parseFloat(amount);
      const tax = withdrawTax ? parseFloat(withdrawTax) : 0;
      const grossAmount = netAmount + tax;

      await processWithdrawal(selectedAsset.id, grossAmount, isFullWithdrawal);
      
      await addTransaction(netAmount, selectedAsset.name, "Rendimentos", "income", false, "Resgate de Investimento", null, selectedWallet, null, selectedAsset.id);

      if (tax > 0) {
        await addTransaction(tax, "Impostos e Taxas", "Investimentos", "expense", false, `Imposto sobre Resgate: ${selectedAsset.name}`, null, selectedWallet, null, selectedAsset.id);
      }

      setNotification({ msg: isFullWithdrawal ? "Resgate total concluído!" : "Resgate realizado!", type: "success" });
    }

    closeModal();
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      await deleteTransactionsByAssetId(deleteModal.id);
      await deleteAsset(deleteModal.id);
      setNotification({ msg: "Ativo e histórico removidos.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const closeModal = () => {
    setSelectedAsset(null);
    setActionType(null);
    setAmount("");
    setWithdrawTax("");
    setIsFullWithdrawal(false);
  };

  return (
    <div className="pb-24">
       <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
       <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={confirmDelete} title="Excluir Ativo" message="Isso apagará o ativo E devolverá os valores dos aportes para as carteiras (removendo as despesas)." />

      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Carteira de Investimentos</h1>
        <button onClick={() => setIsCreating(true)} className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg">
          <Plus size={18} /> Novo
        </button>
      </header>

      {isCreating && (
        <div className="bg-gray-800 p-4 rounded-xl border border-purple-500/50 mb-6 animate-scale-up">
          <h3 className="text-sm font-bold uppercase text-purple-400 mb-4">Novo Investimento</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg text-white" />
            <div className="space-y-1"><label className="text-xs text-gray-400">Valor Inicial</label><MoneyInput value={amount} onChange={setAmount} /></div>
            
            {/* CORREÇÃO AQUI: Select de Criação estilizado */}
            {wallets.length > 0 && (
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Origem</label>
                    <div className="relative">
                        <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 appearance-none outline-none focus:ring-2 focus:ring-purple-500" required>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            )}
            
            <div className="flex gap-2"><button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-gray-700 rounded-lg">Cancelar</button><button type="submit" className="flex-1 py-3 bg-purple-600 rounded-lg font-bold">Criar</button></div>
          </form>
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div><p className="text-gray-400 text-sm font-bold uppercase">Patrimônio Total</p><h2 className="text-3xl font-bold text-white mt-1">R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2></div>
          <div className={`text-right ${totalYield >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <p className="text-xs font-bold uppercase">Rentabilidade</p>
            <p className="font-bold text-lg flex items-center justify-end gap-1"><TrendingUp size={16} />{totalYield >= 0 ? '+' : ''} R$ {totalYield.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs opacity-80">({yieldPercentage.toFixed(2)}%)</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden relative z-10"><div className="h-full bg-purple-500" style={{ width: '100%' }}></div></div>
        <p className="text-xs text-gray-500 mt-2 text-right relative z-10">Aportado: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="space-y-4">
        {assets.length === 0 && <p className="text-center text-gray-500 py-10">Nenhum investimento.</p>}
        {assets.map(asset => {
          const gain = asset.currentValue - asset.investedAmount;
          const gainPercent = asset.investedAmount > 0 ? (gain / asset.investedAmount) * 100 : 0;

          return (
            <div key={asset.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-white">{asset.name}</h4>
                  <p className="text-xs text-gray-500">Aportado: R$ {asset.investedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-white">R$ {asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className={`text-xs font-bold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>{gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}% (R$ {gain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-700/50">
                <button onClick={() => { setSelectedAsset(asset); setActionType('contribute'); }} className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-blue-300 flex flex-col items-center gap-1"><DollarSign size={14} /> Aportar</button>
                <button onClick={() => { setSelectedAsset(asset); setActionType('update'); }} className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-yellow-300 flex flex-col items-center gap-1"><RefreshCw size={14} /> Atualizar</button>
                <button onClick={() => { setSelectedAsset(asset); setActionType('withdraw'); }} className="py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-green-300 flex flex-col items-center gap-1"><ArrowDownRight size={14} /> Resgatar</button>
                <button onClick={() => setDeleteModal({ isOpen: true, id: asset.id })} className="py-2 bg-gray-700 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg flex flex-col items-center gap-1 justify-center"><Trash2 size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 w-full max-w-sm rounded-2xl p-6 border border-gray-700 animate-scale-up shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {actionType === 'contribute' ? 'Novo Aporte' : actionType === 'withdraw' ? 'Resgatar Valor' : 'Atualizar Saldo'}
            </h3>
            
            <p className="text-sm text-gray-400 mb-4">
              {actionType === 'contribute' && `Saindo do caixa para o ${selectedAsset.name}.`}
              {actionType === 'update' && `Valor TOTAL atual no banco/corretora.`}
              {actionType === 'withdraw' && `O dinheiro voltará para sua carteira.`}
            </p>

            <div className="space-y-4">
              <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                      {actionType === 'withdraw' ? 'Valor Líquido (Caiu na conta)' : 'Valor'}
                  </label>
                  <MoneyInput value={amount} onChange={setAmount} />
              </div>

              {actionType === 'withdraw' && (
                  <>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Taxas / Impostos (Se houve)</label>
                        <MoneyInput value={withdrawTax} onChange={setWithdrawTax} />
                    </div>
                    
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <input type="checkbox" id="fullWithdraw" checked={isFullWithdrawal} onChange={e => setIsFullWithdrawal(e.target.checked)} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-red-500" />
                        <label htmlFor="fullWithdraw" className="text-sm text-red-200">Resgate Total (Zerar/Encerrar Ativo)</label>
                    </div>
                  </>
              )}

              {(actionType === 'contribute' || actionType === 'withdraw') && wallets.length > 0 && (
                  <div className="relative">
                      <label className="text-xs text-gray-400 mb-1 block">{actionType === 'withdraw' ? 'Destino' : 'Origem'}</label>
                      <div className="relative">
                        <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)} className="w-full bg-gray-700 text-white rounded-lg p-3 pr-10 border border-gray-600 appearance-none outline-none focus:ring-2 focus:ring-blue-500" required>
                            {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                  </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={closeModal} className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 font-bold hover:bg-gray-700">Cancelar</button>
              <button onClick={handleAction} className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg ${actionType === 'withdraw' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}