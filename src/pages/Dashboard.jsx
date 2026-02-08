import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; 
import { useWallets } from "../hooks/useWallets"; 
import { ChevronLeft, ChevronRight, BarChart3, PieChart, TrendingUp, TrendingDown, Clock, CheckCircle2, Calendar } from "lucide-react";
import { Summary } from "../components/dashboard/Summary";
import { CategoryChart } from "../components/dashboard/CategoryChart";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Notification } from "../components/ui/Notification";
import { TransactionForm } from "../components/transactions/TransactionForm";
import { TransactionList } from "../components/transactions/TransactionList";
import { WalletManager } from "../components/dashboard/WalletManager";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { transactions, addTransaction, deleteTransaction, updateTransaction, toggleDebtStatus, addTransfer, confirmFutureReceipt } = useTransactions();
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
  const [futureModalOpen, setFutureModalOpen] = useState(false); 

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

  const monthlyBalance = filteredTransactions.reduce((acc, t) => {
    if (t.isFuture) return acc;
    if (t.isTransfer) return acc;
    
    if (t.type === 'income') return acc + t.amount;
    
    if (t.type === 'expense') {
        if (t.isInvoicePayment) return acc;
        if (t.isDebt && t.debtPaid) return acc;
        return acc - t.amount;
    }
    
    if (t.type === 'investment') return acc - t.amount;
    return acc;
  }, 0);

  const overallBalance = transactions.reduce((acc, t) => {
    if (t.isFuture) return acc;
    if (t.isTransfer) return acc; 
    
    if (t.date && t.date.seconds * 1000 > new Date().getTime()) return acc;
    
    if (t.type === 'income') return acc + t.amount;
    
    if (t.type === 'expense') {
      if (t.isDebt && t.debtPaid) return acc;
      if (t.paymentMethod === 'credit') return acc;
      return acc - t.amount;
    } 
    
    if (t.type === 'investment') return acc - t.amount;
    return acc;
  }, 0);

  const futureTransactions = transactions.filter(t => t.isFuture && t.type === 'income');
  const futureBalance = futureTransactions.reduce((acc, t) => acc + t.amount, 0);

  // CÁLCULO DE SALDOS, FATURAS E LIMITES
  const walletBalances = wallets.map(w => {
    // A. Saldo Caixa
    const balance = transactions
      .filter(t => t.walletId === w.id)
      .filter(t => !t.isFuture) 
      .filter(t => t.date && t.date.seconds * 1000 <= new Date().getTime())
      .reduce((acc, t) => {
         if (t.type === 'income') return acc + t.amount;
         if (t.type === 'expense' || t.type === 'investment') {
             if (t.paymentMethod === 'credit') return acc;
             return acc - t.amount;
         }
         return acc;
      }, 0);

    let currentInvoice = 0;
    let currentInvoiceDate = "";
    
    if (w.hasCredit) {
        const today = new Date();
        const closing = w.closingDay;
        const currentDay = today.getDate();
        let targetMonth = today.getMonth();
        let targetYear = today.getFullYear();

        if (currentDay > closing) {
            targetMonth++;
            if (targetMonth > 11) { targetMonth = 0; targetYear++; }
        }
        currentInvoiceDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;

        // Soma apenas o que está ABERTO (!isPaidCredit) para a fatura do mês
        const invoiceTotal = transactions
            .filter(t => t.walletId === w.id && t.paymentMethod === 'credit' && t.invoiceDate === currentInvoiceDate && !t.isPaidCredit)
            .reduce((acc, t) => acc + t.amount, 0);
        
        currentInvoice = invoiceTotal;
    }

    // C. CÁLCULO DE LIMITE USADO (Soma tudo que é crédito e não está pago)
    let usedLimit = 0;
    if (w.hasCredit) {
        usedLimit = transactions
            .filter(t => t.walletId === w.id && t.paymentMethod === 'credit' && !t.isPaidCredit)
            .reduce((acc, t) => acc + t.amount, 0);
    }

    return { ...w, balance, currentInvoice, currentInvoiceDate, usedLimit };
  });

  const handleFormSubmit = async (formData) => {
    const { amount, categoryName, macro, type, isSubscription, isDebt, description, assetId, date, walletId, dueDay, personId, isFuture, paymentMethod, invoiceDate, installments, closingDay } = formData;
    const todayDay = new Date().getDate();

    if (editingData) {
      await updateTransaction(editingData.id, amount, categoryName, macro, type, isDebt, description, date, walletId, isFuture, paymentMethod, invoiceDate);
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
          
          // Passamos installments e closingDay
          await addTransaction(amount, categoryName, macro, type, isDebt, description, date, walletId, null, assetId, personId, isFuture, paymentMethod, invoiceDate, false, installments, closingDay);
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

  const handleConfirmReceipt = async (id) => {
      await confirmFutureReceipt(id);
      setNotification({ msg: "Recebimento confirmado! Saldo atualizado.", type: "success" });
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
        <Summary 
            transactions={filteredTransactions.filter(t => !t.isTransfer)} 
            assets={assets} 
            totalBalance={monthlyBalance} 
        />

        <WalletManager 
            wallets={wallets}
            walletBalances={walletBalances}
            overallBalance={overallBalance} 
            futureBalance={futureBalance} 
            transactions={transactions}
            onOpenFutureModal={() => setFutureModalOpen(true)}
            onAddWallet={addWallet}
            onSetDefault={setAsDefault}
            onDeleteWallet={deleteWallet}
            onTransfer={addTransfer}
            onAddTransaction={addTransaction}
            setNotification={setNotification}
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
                    <CategoryChart 
                        transactions={filteredTransactions.filter(t => 
                            t.type === chartType && 
                            !t.isFuture && 
                            !t.isInvoicePayment && 
                            !t.isTransfer
                        )} 
                        mode={chartMode} 
                        type={chartType} 
                    />
                </div>
            </div>
            
            <TransactionList 
                transactions={filteredTransactions.filter(t => !t.isFuture)} 
                wallets={wallets} 
                onEdit={setEditingData} 
                onDelete={(id) => setDeleteModal({ isOpen: true, id })} 
                onToggleDebt={toggleDebtStatus} 
                editingId={editingData?.id} 
            />
          </div>
        </div>
      </div>

      {futureModalOpen && (
        <div 
            onClick={() => setFutureModalOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
        >
           <div 
                onClick={(e) => e.stopPropagation()} 
                className="bg-gray-800 p-6 rounded-2xl w-full max-w-md border border-gray-700 animate-scale-up shadow-2xl"
           >
              <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                      <Clock className="text-blue-400" /> Recebimentos Futuros
                  </h3>
                  <button onClick={() => setFutureModalOpen(false)} className="text-gray-400 hover:text-white"><ChevronLeft/></button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
                  {futureTransactions.length === 0 ? (
                      <p className="text-gray-500 text-center">Nenhum recebimento agendado.</p>
                  ) : (
                      futureTransactions.map(t => (
                          <div key={t.id} className="bg-gray-700/50 p-4 rounded-xl border border-gray-600 flex justify-between items-center">
                              <div>
                                  <p className="font-bold text-white text-sm">{t.description || t.category}</p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                      <Calendar size={12}/> {new Date(t.date.seconds * 1000).toLocaleDateString('pt-BR')}
                                  </p>
                              </div>
                              <div className="text-right">
                                  <span className="block font-bold text-green-400 mb-2">R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                  <button 
                                    onClick={() => handleConfirmReceipt(t.id)}
                                    className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                  >
                                      <CheckCircle2 size={10} /> Confirmar Recebimento
                                  </button>
                              </div>
                          </div>
                      ))
                  )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total a receber:</span>
                  <span className="text-xl font-bold text-blue-400">R$ {futureBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}