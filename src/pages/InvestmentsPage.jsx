import { useState, useEffect } from "react";
import { useInvestments } from "../hooks/useInvestments";
import { useTransactions } from "../hooks/useTransactions";
import { useWallets } from "../hooks/useWallets"; // <--- NOVO IMPORT
import { ArrowLeft, Plus, TrendingUp, DollarSign, RefreshCw, Trash2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MoneyInput } from "../components/MoneyInput";
import { Notification } from "../components/Notification";
import { ConfirmModal } from "../components/ConfirmModal";

export default function InvestmentsPage() {
  const { assets, addAsset, updateBalance, addContribution, deleteAsset } = useInvestments();
  const { addTransaction } = useTransactions();
  const { wallets } = useWallets(); // <--- Pegando as carteiras
  const navigate = useNavigate();

  // Estados de UI
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [actionType, setActionType] = useState(null); 
  
  // Estados de Delete
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  // Inputs
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [notification, setNotification] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(""); // <--- Estado da Carteira

  // Totais Gerais
  const totalInvested = assets.reduce((acc, a) => acc + (a.investedAmount || 0), 0);
  const totalCurrent = assets.reduce((acc, a) => acc + (a.currentValue || 0), 0);
  const totalYield = totalCurrent - totalInvested;
  const yieldPercentage = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

  // Efeito para selecionar carteira padrão automaticamente
  useEffect(() => {
    if (wallets && wallets.length > 0 && !selectedWallet) {
        const defaultWallet = wallets.find(w => w.isDefault);
        setSelectedWallet(defaultWallet ? defaultWallet.id : wallets[0].id);
    }
  }, [wallets, isCreating, selectedAsset]); // Reseta quando abre modais

  // --- AÇÃO 1: CRIAR NOVO ATIVO ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    if (!selectedWallet) {
        setNotification({ msg: "Selecione a conta de origem!", type: "error" });
        return;
    }
    
    // 1. Cria o ativo na carteira
    await addAsset(name, "fixed", amount); 
    
    // 2. Tira o dinheiro do caixa (Cria transação com walletId)
    // Params: valor, categoria, macro, tipo, isDebt, descricao, data, walletId
    await addTransaction(amount, name, "Investimentos", "investment", false, "Aporte Inicial", null, selectedWallet);

    setNotification({ msg: "Investimento criado e debitado do saldo!", type: "success" });
    setIsCreating(false);
    setName("");
    setAmount("");
  };

  // --- AÇÃO 2: APORTE OU RENDIMENTO ---
  const handleAction = async (e) => {
    e.preventDefault();
    if (!amount) return;

    if (actionType === 'update') {
      // Rendimento: NÃO mexe no caixa, só atualiza o valor lá dentro
      await updateBalance(selectedAsset.id, amount);
      setNotification({ msg: "Rentabilidade atualizada!", type: "success" });
    } 
    else if (actionType === 'contribute') {
      if (!selectedWallet) {
        setNotification({ msg: "Selecione a conta de origem!", type: "error" });
        return;
      }
      
      // Aporte: Mexe no caixa
      // 1. Aumenta o valor investido
      await addContribution(selectedAsset.id, amount);
      
      // 2. Registra a saída do dinheiro na Dashboard com a Carteira Selecionada
      await addTransaction(amount, selectedAsset.name, "Investimentos", "investment", false, "Aporte Adicional", null, selectedWallet);
      
      setNotification({ msg: "Aporte registrado e debitado do saldo!", type: "success" });
    }

    closeModal();
  };

  const handleDeleteRequest = (id) => {
    setDeleteModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (deleteModal.id) {
      await deleteAsset(deleteModal.id);
      setNotification({ msg: "Ativo removido da carteira.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const closeModal = () => {
    setSelectedAsset(null);
    setActionType(null);
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 pb-24">
       <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
       
       <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Excluir Ativo"
        message="Tem certeza? Isso apagará todo o histórico de rentabilidade. As transações de saída (aportes) NÃO serão apagadas do seu extrato."
      />

      {/* HEADER */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <ArrowLeft />
          </button>
          <h1 className="text-xl font-bold">Investimentos</h1>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-purple-900/20"
        >
          <Plus size={18} /> Novo Ativo
        </button>
      </header>

      {/* FORM DE CRIAÇÃO (Inline) */}
      {isCreating && (
        <div className="bg-gray-800 p-4 rounded-xl border border-purple-500/50 mb-6 animate-scale-up">
          <h3 className="text-sm font-bold uppercase text-purple-400 mb-4">Novo Investimento</h3>
          <p className="text-xs text-gray-400 mb-4">Isso criará o ativo e lançará uma despesa de investimento no seu extrato.</p>
          <form onSubmit={handleCreate} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome (ex: Nubank, Tesouro Selic)" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-purple-500"
            />
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Valor Inicial (Sai do caixa)</label>
              <MoneyInput value={amount} onChange={setAmount} />
            </div>

            {/* SELETOR DE CARTEIRA NA CRIAÇÃO */}
            {wallets.length > 0 && (
                <div className="space-y-1">
                    <label className="text-xs text-gray-400">Conta de Origem</label>
                    <div className="relative">
                        <select 
                            value={selectedWallet} 
                            onChange={e => setSelectedWallet(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 appearance-none"
                            required
                        >
                            <option value="" disabled>Selecione a conta...</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name} {w.isDefault ? '(Padrão)' : ''}</option>
                            ))}
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <Wallet size={16} />
                         </div>
                    </div>
                </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 bg-gray-700 rounded-lg font-medium hover:bg-gray-600">Cancelar</button>
              <button type="submit" className="flex-1 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 shadow-lg">Criar & Debitar</button>
            </div>
          </form>
        </div>
      )}

      {/* RESUMO PATRIMONIAL */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl border border-gray-700 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-gray-400 text-sm font-bold uppercase">Patrimônio Total</p>
            <h2 className="text-3xl font-bold text-white mt-1">R$ {totalCurrent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
          </div>
          <div className={`text-right ${totalYield >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            <p className="text-xs font-bold uppercase">Rentabilidade Geral</p>
            <p className="font-bold text-lg flex items-center justify-end gap-1">
              <TrendingUp size={16} />
              {totalYield >= 0 ? '+' : ''} R$ {totalYield.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs opacity-80">({yieldPercentage.toFixed(2)}%)</p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-right relative z-10">Total Aportado: R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      {/* LISTA DE ATIVOS */}
      <div className="space-y-4">
        <h3 className="text-gray-400 uppercase text-xs font-bold pl-1">Meus Ativos</h3>
        
        {assets.length === 0 && (
          <div className="text-center py-10 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
             <p className="text-gray-500 text-sm">Nenhum investimento cadastrado.</p>
          </div>
        )}

        {assets.map(asset => {
          const gain = asset.currentValue - asset.investedAmount;
          const gainPercent = asset.investedAmount > 0 ? (gain / asset.investedAmount) * 100 : 0;

          return (
            <div key={asset.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 transition-colors hover:border-gray-600">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-white">{asset.name}</h4>
                  <p className="text-xs text-gray-500">
                    Aportado: R$ {asset.investedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-white">R$ {asset.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  <span className={`text-xs font-bold ${gain >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {gain >= 0 ? '+' : ''}{gainPercent.toFixed(2)}% (R$ {gain.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="flex gap-2 mt-2 pt-3 border-t border-gray-700/50">
                <button 
                  onClick={() => { setSelectedAsset(asset); setActionType('contribute'); }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-blue-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <DollarSign size={14} /> Aporte
                </button>
                <button 
                  onClick={() => { setSelectedAsset(asset); setActionType('update'); }}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs font-bold text-green-300 flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={14} /> Atualizar
                </button>
                <button 
                  onClick={() => handleDeleteRequest(asset.id)}
                  className="px-3 py-2 bg-gray-700 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-colors flex items-center justify-center"
                  title="Excluir Ativo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE AÇÃO */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-800 w-full max-w-sm rounded-2xl p-6 border border-gray-700 animate-scale-up shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">
              {actionType === 'contribute' ? 'Novo Aporte' : 'Atualizar Saldo'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {actionType === 'contribute' 
                ? `Quanto você está tirando do caixa para o ${selectedAsset.name}?` 
                : `Qual o valor TOTAL atual do ${selectedAsset.name} no banco/corretora?`
              }
            </p>

            <div className="mb-4">
              <MoneyInput value={amount} onChange={setAmount} />
              {actionType === 'contribute' && (
                <p className="text-xs text-orange-400 mt-2 text-center">Isso será registrado como saída na sua Dashboard.</p>
              )}
            </div>

            {/* SELETOR DE CARTEIRA NO MODAL DE APORTE */}
            {actionType === 'contribute' && wallets.length > 0 && (
                <div className="mb-6 space-y-1">
                    <label className="text-xs text-gray-400">Saindo da Conta</label>
                    <div className="relative">
                        <select 
                            value={selectedWallet} 
                            onChange={e => setSelectedWallet(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded-lg p-3 outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600 appearance-none"
                            required
                        >
                            <option value="" disabled>Selecione a conta...</option>
                            {wallets.map(w => (
                                <option key={w.id} value={w.id}>{w.name} {w.isDefault ? '(Padrão)' : ''}</option>
                            ))}
                        </select>
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                             <Wallet size={16} />
                         </div>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 py-3 rounded-lg border border-gray-600 text-gray-300 font-bold hover:bg-gray-700">Cancelar</button>
              <button 
                onClick={handleAction} 
                className={`flex-1 py-3 rounded-lg text-white font-bold shadow-lg ${actionType === 'contribute' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}