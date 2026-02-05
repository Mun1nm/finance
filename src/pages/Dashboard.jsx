import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; 
import { useWallets } from "../hooks/useWallets"; 
import { LogOut, Settings, ChevronLeft, ChevronRight, BarChart3, PieChart, TrendingUp, Wallet, ArrowRightLeft, Plus, Star } from "lucide-react";
import { Summary } from "../components/Summary";
import { CategoryChart } from "../components/CategoryChart";
import { ConfirmModal } from "../components/ConfirmModal";
import { Notification } from "../components/Notification";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout } = useAuth();
  const { transactions, addTransaction, deleteTransaction, updateTransaction, toggleDebtStatus, addTransfer } = useTransactions();
  const { categories } = useCategories();
  const { assets, addContribution } = useInvestments();
  const { wallets, addWallet, setAsDefault } = useWallets(); 
  const { createSubscription, processSubscriptions } = useSubscriptions();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [chartMode, setChartMode] = useState("macro");
  const [editingData, setEditingData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  // State para Modal de Transferência
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });

  // State para Modal de Nova Carteira (CORREÇÃO: Substituindo o prompt)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");

  useEffect(() => {
    processSubscriptions((val, cat, mac, typ) => {
      addTransaction(val, cat, mac, typ);
      setNotification({ msg: "Recorrências processadas!", type: "info" });
    });
  }, []);

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date.seconds * 1000);
    return tDate.getMonth() === currentDate.getMonth() && 
           tDate.getFullYear() === currentDate.getFullYear();
  });

  const overallBalance = transactions.reduce((acc, t) => {
    if (t.type === 'income') {
      return acc + t.amount;
    } 
    else if (t.type === 'expense') {
      if (t.isDebt && t.debtPaid) return acc;
      return acc - t.amount;
    } 
    else if (t.type === 'investment') {
      return acc - t.amount;
    }
    return acc;
  }, 0);

  const walletBalances = wallets.map(w => {
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .reduce((acc, t) => {
         if (t.type === 'income') return acc + t.amount;
         if (t.type === 'expense' || t.type === 'investment') {
            return acc - t.amount;
         }
         return acc;
      }, 0);
    return { ...w, balance };
  });

  const handleFormSubmit = async (formData) => {
    const { amount, categoryName, macro, type, isSubscription, isDebt, description, assetId, date, walletId } = formData;

    if (editingData) {
      await updateTransaction(editingData.id, amount, categoryName, macro, type, isDebt, description, date);
      setNotification({ msg: "Atualizado com sucesso!", type: "success" });
      setEditingData(null);
    } else {
      if (type === 'investment' && assetId) {
         await addContribution(assetId, amount);
      }
      
      await addTransaction(amount, categoryName, macro, type, isDebt, description, date, walletId);
      
      if (isSubscription) {
        await createSubscription(amount, categoryName, macro, categoryName, type);
        setNotification({ msg: "Recorrência configurada!", type: "info" });
      } else {
        const msg = type === 'investment' ? "Aporte realizado e registrado!" : "Salvo com sucesso!";
        setNotification({ msg, type: "success" });
      }
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const fromWallet = wallets.find(w => w.id === transferData.from);
    const toWallet = wallets.find(w => w.id === transferData.to);
    
    await addTransfer(
        transferData.amount, 
        transferData.from, 
        transferData.to, 
        transferData.date, 
        fromWallet.name, 
        toWallet.name
    );
    setIsTransferModalOpen(false);
    setTransferData({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setNotification({ msg: "Transferência realizada!", type: "success" });
  };

  // NOVA FUNÇÃO: Criar Carteira via Modal
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;

    await addWallet(newWalletName);
    setNotification({ msg: "Nova conta criada!", type: "success" });
    setNewWalletName("");
    setIsWalletModalOpen(false);
  };

  const handleDelete = async () => {
    if (deleteModal.id) {
      await deleteTransaction(deleteModal.id);
      setNotification({ msg: "Removido.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
      if (editingData?.id === deleteModal.id) setEditingData(null);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-24">
      <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="Excluir" message="Confirma a exclusão?" />

      {/* HEADER */}
      <header className="p-4 flex justify-between items-center bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-md">
        <h1 className="font-bold text-xl text-white tracking-tight">Finance</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate("/investments")} className="p-2 text-gray-400 hover:text-purple-400" title="Meus Investimentos">
            <TrendingUp size={20} />
          </button>
          <button onClick={() => navigate("/categories")} className="p-2 text-gray-400 hover:text-blue-400"><Settings size={20} /></button>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-white"><LogOut size={20} /></button>
        </div>
      </header>

      {/* NAV MÊS */}
      <div className="flex items-center justify-center gap-4 py-4 bg-gray-900/95 backdrop-blur-md sticky top-[60px] z-40 border-b border-gray-800 shadow-sm">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-800 rounded"><ChevronLeft /></button>
        <span className="font-bold text-lg capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-800 rounded"><ChevronRight /></button>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Summary 
            transactions={filteredTransactions} 
            assets={assets}                     
            totalBalance={overallBalance}       
        />

        {/* SECTION CARTEIRAS */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2">
                <Wallet size={16} /> Minhas Contas
              </h3>
              <div className="flex gap-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/50 flex items-center gap-1 hover:bg-blue-600/30">
                  <ArrowRightLeft size={14} /> Transferir
                </button>
                <button onClick={() => setIsWalletModalOpen(true)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-600">
                  <Plus size={14} /> Nova
                </button>
              </div>
           </div>

           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {wallets.length === 0 && <p className="text-sm text-gray-500">Nenhuma conta cadastrada.</p>}
            
            {walletBalances.map(w => (
                <div 
                  key={w.id} 
                  className={`min-w-[140px] p-3 rounded-lg border flex flex-col relative group transition-all ${w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}
                >
                  {/* BOTÃO ESTRELA */}
                  <button 
                      onClick={() => setAsDefault(w.id)}
                      className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${w.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}
                      title={w.isDefault ? "Conta Padrão" : "Definir como Padrão"}
                  >
                      <Star size={12} fill={w.isDefault ? "currentColor" : "none"} />
                  </button>

                  <span className="text-xs text-gray-400 truncate pr-4">{w.name}</span>
                  <span className={`font-bold text-sm ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                      R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-5 relative lg:sticky lg:top-40 z-0">
            <TransactionForm 
              onSubmit={handleFormSubmit}
              categories={categories}
              assets={assets}
              wallets={wallets}
              initialData={editingData}
              onCancelEdit={() => setEditingData(null)}
            />
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 relative z-0">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-gray-400 text-sm font-bold uppercase">Análise</h3>
                    <div className="flex bg-gray-700 rounded-lg p-1">
                        <button onClick={() => setChartMode("macro")} className={`p-1 rounded ${chartMode === 'macro' ? 'bg-gray-600' : ''}`}><PieChart size={16}/></button>
                        <button onClick={() => setChartMode("category")} className={`p-1 rounded ${chartMode === 'category' ? 'bg-gray-600' : ''}`}><BarChart3 size={16}/></button>
                    </div>
                </div>
                <CategoryChart transactions={filteredTransactions} mode={chartMode} />
            </div>

            <TransactionList 
              transactions={filteredTransactions} 
              onEdit={setEditingData} 
              onDelete={(id) => setDeleteModal({ isOpen: true, id })} 
              onToggleDebt={toggleDebtStatus}
              editingId={editingData?.id}
            />
          </div>
        </div>
      </main>

      {/* MODAL DE TRANSFERÊNCIA */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
              <h3 className="font-bold text-lg mb-4 text-white">Transferência entre Contas</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                 <div>
                    <label className="text-xs text-gray-400">De (Origem)</label>
                    <select className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})} required>
                       <option value="">Selecione...</option>
                       {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-gray-400">Para (Destino)</label>
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

     {/* MODAL DE NOVA CARTEIRA (NOVO) */}
     {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
              <h3 className="font-bold text-lg mb-4 text-white">Nova Conta / Carteira</h3>
              <form onSubmit={handleCreateWallet} className="space-y-4">
                 <div>
                    <label className="text-xs text-gray-400">Nome da Conta</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Nubank, Bradesco, Cofre..." 
                        className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500" 
                        value={newWalletName} 
                        onChange={e => setNewWalletName(e.target.value)} 
                        required 
                        autoFocus
                    />
                 </div>
                 <div className="flex gap-2 mt-4">
                    <button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button>
                    <button type="submit" className="flex-1 p-2 bg-green-600 rounded text-white font-bold hover:bg-green-700">Criar</button>
                 </div>
              </form>
           </div>
        </div>
     )}

    </div>
  );
}