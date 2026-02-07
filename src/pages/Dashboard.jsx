import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; 
import { useWallets } from "../hooks/useWallets"; 
import { ChevronLeft, ChevronRight, BarChart3, PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { Summary } from "../components/Summary";
import { CategoryChart } from "../components/CategoryChart";
import { ConfirmModal } from "../components/ConfirmModal";
import { Notification } from "../components/Notification";
import { TransactionForm } from "../components/TransactionForm";
import { TransactionList } from "../components/TransactionList";
import { WalletManager } from "../components/WalletManager";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, toggleDebtStatus, addTransfer } = useTransactions();
  const { categories } = useCategories();
  const { assets, addContribution, removeContribution } = useInvestments();
  const { wallets, addWallet, setAsDefault, deleteWallet } = useWallets(); 
  const { createSubscription, processSubscriptions, updateSubscription } = useSubscriptions();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [chartMode, setChartMode] = useState("macro");
  const [chartType, setChartType] = useState("expense"); 
  const [editingData, setEditingData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

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

  // 1. CÁLCULO DO SALDO DO MÊS (Novo foco do Summary)
  const monthlyBalance = filteredTransactions.reduce((acc, t) => {
    if (t.type === 'income') return acc + t.amount;
    if (t.type === 'expense') {
        if (t.isDebt && t.debtPaid) return acc;
        return acc - t.amount;
    }
    if (t.type === 'investment') return acc - t.amount;
    return acc;
  }, 0);

  // 2. CÁLCULO DO SALDO GERAL ACUMULADO (Antigo overallBalance)
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
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDelete} title="Excluir Transação" message="Confirma a exclusão?" />

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronLeft /></button>
        <span className="font-bold text-lg capitalize">{currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ChevronRight /></button>
      </div>

      <div className="space-y-6">
        {/* AGORA PASSA O MENSAL PARA O SUMMARY */}
        <Summary 
          transactions={filteredTransactions} 
          assets={assets} 
          totalBalance={monthlyBalance} 
        />

        {/* AGORA PASSA O TOTAL GERAL PARA O WALLET MANAGER */}
        <WalletManager 
            wallets={wallets}
            walletBalances={walletBalances}
            overallBalance={overallBalance} // <--- NOVO PROP
            onAddWallet={addWallet}
            onSetDefault={setAsDefault}
            onDeleteWallet={deleteWallet}
            onTransfer={addTransfer}
            onAddTransaction={addTransaction}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 relative lg:sticky lg:top-24 z-0">
            <TransactionForm onSubmit={handleFormSubmit} categories={categories} assets={assets} wallets={wallets} initialData={editingData} onCancelEdit={() => setEditingData(null)} />
          </div>
          
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-4 relative z-0">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                    <h3 className="text-gray-400 text-sm font-bold uppercase self-start sm:self-center">Análise</h3>
                    <div className="flex gap-3">
                        <div className="flex bg-gray-700 rounded-lg p-1">
                            <button onClick={() => setChartType("income")} className={`p-1.5 px-3 rounded text-xs font-bold flex items-center gap-1 transition-all ${chartType === 'income' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><TrendingUp size={14}/> Entradas</button>
                            <button onClick={() => setChartType("expense")} className={`p-1.5 px-3 rounded text-xs font-bold flex items-center gap-1 transition-all ${chartType === 'expense' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><TrendingDown size={14}/> Saídas</button>
                        </div>
                        <div className="flex bg-gray-700 rounded-lg p-1">
                            <button onClick={() => setChartMode("macro")} className={`p-1.5 rounded transition-all ${chartMode === 'macro' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'}`}><PieChart size={16}/></button>
                            <button onClick={() => setChartMode("category")} className={`p-1.5 rounded transition-all ${chartMode === 'category' ? 'bg-gray-600 text-white shadow' : 'text-gray-400'}`}><BarChart3 size={16}/></button>
                        </div>
                    </div>
                </div>
                <div className="h-80 w-full">
                    <CategoryChart transactions={filteredTransactions.filter(t => t.type === chartType)} mode={chartMode} type={chartType} />
                </div>
            </div>
            
            <TransactionList transactions={filteredTransactions} wallets={wallets} onEdit={setEditingData} onDelete={(id) => setDeleteModal({ isOpen: true, id })} onToggleDebt={toggleDebtStatus} editingId={editingData?.id} />
          </div>
        </div>
      </div>
    </div>
  );
}