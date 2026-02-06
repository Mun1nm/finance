import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; 
import { useWallets } from "../hooks/useWallets"; 
import { ChevronLeft, ChevronRight, BarChart3, PieChart, Wallet, ArrowRightLeft, Plus, Star } from "lucide-react";
import { Summary } from "../components/Summary";
import { CategoryChart } from "../components/CategoryChart";
import { ConfirmModal } from "../components/ConfirmModal";
import { Notification } from "../components/Notification";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, toggleDebtStatus, addTransfer } = useTransactions();
  const { categories } = useCategories();
  const { assets, addContribution, removeContribution } = useInvestments();
  const { wallets, addWallet, setAsDefault } = useWallets(); 
  const { createSubscription, processSubscriptions, updateSubscription } = useSubscriptions();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [chartMode, setChartMode] = useState("macro");
  const [editingData, setEditingData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [newWalletName, setNewWalletName] = useState("");

  const hasProcessedSubscriptions = useRef(false);

  useEffect(() => {
    if (hasProcessedSubscriptions.current) return;
    hasProcessedSubscriptions.current = true;

    processSubscriptions((val, cat, mac, typ, isDebt, desc, date, walletId, subId) => {
      addTransaction(val, cat, mac, typ, isDebt, desc, date, walletId, subId);
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
    if (t.date && t.date.seconds * 1000 > new Date().getTime()) return acc;
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') {
      if (t.isDebt && t.debtPaid) return acc;
      return acc - t.amount;
    } 
    if (t.type === 'investment') return acc - t.amount;
    return acc;
  }, 0);

  const walletBalances = wallets.map(w => {
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .filter(t => t.date && t.date.seconds * 1000 <= new Date().getTime())
      .reduce((acc, t) => {
         if (t.type === 'income') return acc + t.amount;
         if (t.type === 'expense' || t.type === 'investment') return acc - t.amount;
         return acc;
      }, 0);
    return { ...w, balance };
  });

  const handleFormSubmit = async (formData) => {
    const { amount, categoryName, macro, type, isSubscription, isDebt, description, assetId, date, walletId, dueDay } = formData;
    const todayDay = new Date().getDate();

    if (editingData) {
      await updateTransaction(editingData.id, amount, categoryName, macro, type, isDebt, description, date, walletId);
      if (editingData.subscriptionId) {
         try {
           await updateSubscription(editingData.subscriptionId, {
              amount: parseFloat(amount),
              name: description.replace("Assinatura Mensal: ", ""), 
              walletId: walletId
           });
           setNotification({ msg: "Registro e Assinatura atualizados!", type: "success" });
         } catch (error) {
           setNotification({ msg: "Registro atualizado!", type: "warning" });
         }
      } else {
         setNotification({ msg: "Atualizado com sucesso!", type: "success" });
      }
      setEditingData(null);
    } else {
      const shouldProcessNow = !isSubscription || (isSubscription && dueDay <= todayDay);
      if (shouldProcessNow) {
          if (type === 'investment' && assetId) await addContribution(assetId, amount);
          await addTransaction(amount, categoryName, macro, type, isDebt, description, date, walletId, null, assetId);
      }
      if (isSubscription) {
        await createSubscription(amount, categoryName, macro, categoryName, type, dueDay, walletId, shouldProcessNow);
        setNotification({ msg: shouldProcessNow ? `Assinatura criada e debitada!` : `Agendado para dia ${dueDay}.`, type: "success" });
      } else {
        setNotification({ msg: "Salvo com sucesso!", type: "success" });
      }
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const fromWallet = wallets.find(w => w.id === transferData.from);
    const toWallet = wallets.find(w => w.id === transferData.to);
    await addTransfer(transferData.amount, transferData.from, transferData.to, transferData.date, fromWallet.name, toWallet.name);
    setIsTransferModalOpen(false);
    setTransferData({ from: '', to: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setNotification({ msg: "Transferência realizada!", type: "success" });
  };

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
      const transactionToDelete = transactions.find(t => t.id === deleteModal.id);
      if (transactionToDelete && transactionToDelete.type === 'investment' && transactionToDelete.assetId) {
          try {
              await removeContribution(transactionToDelete.assetId, transactionToDelete.amount);
          } catch (error) {
              console.error("Erro ao abater investimento:", error);
          }
      }
      await deleteTransaction(deleteModal.id);
      setNotification({ msg: "Removido.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
      if (editingData?.id === deleteModal.id) setEditingData(null);
    }
  };

  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));

  return (
    <div className="pb-24">
      <Notification message={notification?.msg} type={notification?.type} onClose={() => setNotification(null)} />
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="Excluir" message="Confirma a exclusão?" />

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft /></button>
        <span className="font-bold text-lg capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronRight /></button>
      </div>

      <div className="space-y-6">
        <Summary transactions={filteredTransactions} assets={assets} totalBalance={overallBalance} />

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-400 text-xs font-bold uppercase flex items-center gap-2"><Wallet size={16} /> Minhas Contas</h3>
              <div className="flex gap-2">
                <button onClick={() => setIsTransferModalOpen(true)} className="text-xs bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/50 flex items-center gap-1 hover:bg-blue-600/30"><ArrowRightLeft size={14} /> Transferir</button>
                <button onClick={() => setIsWalletModalOpen(true)} className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-gray-600"><Plus size={14} /> Nova</button>
              </div>
           </div>
           <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
              {walletBalances.map(w => (
                 <div key={w.id} className={`min-w-[140px] p-3 rounded-lg border flex flex-col relative group transition-all ${w.isDefault ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-700/30 border-gray-600 hover:border-gray-500'}`}>
                     <button onClick={() => setAsDefault(w.id)} className={`absolute top-2 right-2 p-1 rounded-full transition-colors ${w.isDefault ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-200'}`}><Star size={12} fill={w.isDefault ? "currentColor" : "none"} /></button>
                    <span className="text-xs text-gray-400 truncate pr-4">{w.name}</span>
                    <span className={`font-bold text-sm ${w.balance >= 0 ? 'text-white' : 'text-red-400'}`}>R$ {w.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                 </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 relative lg:sticky lg:top-24 z-0">
            <TransactionForm onSubmit={handleFormSubmit} categories={categories} assets={assets} wallets={wallets} initialData={editingData} onCancelEdit={() => setEditingData(null)} />
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
            
            {/* AQUI ESTÁ A ATUALIZAÇÃO: wallets={wallets} */}
            <TransactionList 
                transactions={filteredTransactions} 
                wallets={wallets} 
                onEdit={setEditingData} 
                onDelete={(id) => setDeleteModal({ isOpen: true, id })} 
                onToggleDebt={toggleDebtStatus} 
                editingId={editingData?.id} 
            />
          </div>
        </div>
      </div>

      {isTransferModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
              <h3 className="font-bold text-lg mb-4 text-white">Transferência entre Contas</h3>
              <form onSubmit={handleTransfer} className="space-y-4">
                 <div><label className="text-xs text-gray-400">De (Origem)</label><select className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})} required>{wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                 <div><label className="text-xs text-gray-400">Para (Destino)</label><select className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})} required>{wallets.filter(w => w.id !== transferData.from).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                 <input type="number" step="0.01" placeholder="Valor" className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} required />
                 <input type="date" className="w-full bg-gray-700 p-2 rounded text-white" value={transferData.date} onChange={e => setTransferData({...transferData, date: e.target.value})} required />
                 <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button><button type="submit" className="flex-1 p-2 bg-blue-600 rounded text-white font-bold">Transferir</button></div>
              </form>
           </div>
        </div>
      )}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-gray-800 p-6 rounded-2xl w-full max-w-sm border border-gray-700 animate-scale-up">
              <h3 className="font-bold text-lg mb-4 text-white">Nova Conta / Carteira</h3>
              <form onSubmit={handleCreateWallet} className="space-y-4">
                 <div><label className="text-xs text-gray-400">Nome da Conta</label><input type="text" placeholder="Ex: Nubank, Bradesco, Cofre..." className="w-full bg-gray-700 p-3 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500" value={newWalletName} onChange={e => setNewWalletName(e.target.value)} required autoFocus /></div>
                 <div className="flex gap-2 mt-4"><button type="button" onClick={() => setIsWalletModalOpen(false)} className="flex-1 p-2 bg-gray-700 rounded text-gray-300">Cancelar</button><button type="submit" className="flex-1 p-2 bg-green-600 rounded text-white font-bold">Criar</button></div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}