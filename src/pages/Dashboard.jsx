import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions } from "../hooks/useTransactions";
import { useCategories } from "../hooks/useCategories";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useInvestments } from "../hooks/useInvestments"; 
import { useWallets } from "../hooks/useWallets"; 
import { Summary } from "../components/dashboard/Summary";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { InstallmentDeleteModal } from "../components/ui/InstallmentDeleteModal"; // <--- NOVO IMPORT
import { Notification } from "../components/ui/Notification";
import { TransactionForm } from "../components/transactions/TransactionForm";
import { TransactionList } from "../components/transactions/TransactionList";
import { WalletManager } from "../components/dashboard/WalletManager";
import { MonthNavigator } from "../components/dashboard/MonthNavigator";
import { AnalysisSection } from "../components/dashboard/AnalysisSection";
import { FutureTransactionsModal } from "../components/dashboard/FutureTransactionsModal";
import { BudgetModal } from "../components/dashboard/BudgetModal"; 

export default function Dashboard() {
  // Puxa nova função deleteInstallmentGroup
  const { transactions, addTransaction, deleteTransaction, deleteInstallmentGroup, updateTransaction, toggleDebtStatus, addTransfer, confirmFutureReceipt } = useTransactions();
  const { categories, budgets, saveBudget } = useCategories(); 
  const { assets, addContribution, removeContribution } = useInvestments();
  const { wallets, addWallet, setAsDefault, deleteWallet } = useWallets(); 
  const { createSubscription, processSubscriptions, updateSubscription } = useSubscriptions();

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [chartMode, setChartMode] = useState("macro");
  const [chartType, setChartType] = useState("expense"); 
  const [editingData, setEditingData] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Modais de Deleção
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  const [installmentDeleteModal, setInstallmentDeleteModal] = useState({ isOpen: false, id: null, groupId: null }); // <--- NOVO STATE

  const [futureModalOpen, setFutureModalOpen] = useState(false); 
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const hasProcessedSubscriptions = useRef(false);

  useEffect(() => {
    if (hasProcessedSubscriptions.current || wallets.length === 0) return; 
    hasProcessedSubscriptions.current = true;

    processSubscriptions(async (val, cat, mac, typ, isDebt, desc, date, walletId, subId, paymentMethod, invoiceDate) => {
      await addTransaction(val, cat, mac, typ, isDebt, desc, date, walletId, subId, null, null, false, paymentMethod, invoiceDate);
      setNotification({ msg: "Recorrências processadas!", type: "info" });
    }, wallets);
  }, [wallets]);

  // --- OTIMIZAÇÃO DE PERFORMANCE (useMemo) ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = new Date(t.date.seconds * 1000);
      return tDate.getMonth() === currentDate.getMonth() && 
             tDate.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const monthlyBalance = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.isFuture || t.isTransfer) return acc;
      if (t.type === 'income') {
        if (t.isDebt) return acc; // income+isDebt nunca afeta saldo
        return acc + t.amount;
      }
      if (t.type === 'expense') {
          if (t.isInvoicePayment || (t.isDebt && t.debtPaid)) return acc;
          return acc - t.amount;
      }
      if (t.type === 'investment') return acc - t.amount;
      return acc;
    }, 0);
  }, [filteredTransactions]);

  const overallBalance = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.isFuture || t.isTransfer) return acc;
      if (t.date && t.date.seconds * 1000 > new Date().getTime()) return acc;
      if (t.type === 'income') {
        if (t.isDebt) return acc; // income+isDebt nunca afeta saldo
        return acc + t.amount;
      }
      if (t.type === 'expense') {
        if (t.isDebt && t.debtPaid) return acc;
        if (t.paymentMethod === 'credit') return acc;
        return acc - t.amount;
      }
      if (t.type === 'investment') return acc - t.amount;
      return acc;
    }, 0);
  }, [transactions]);

  const { futureTransactions, futureBalance } = useMemo(() => {
    const ft = transactions.filter(t => t.isFuture && t.type === 'income');
    const fb = ft.reduce((acc, t) => acc + t.amount, 0);
    return { futureTransactions: ft, futureBalance: fb };
  }, [transactions]);

  const walletBalances = useMemo(() => {
    return wallets.map(w => {
      const balance = transactions
        .filter(t => t.walletId === w.id && !t.isFuture && t.date && t.date.seconds * 1000 <= new Date().getTime())
        .reduce((acc, t) => {
           if (t.type === 'income') {
               if (t.isDebt) return acc; // income+isDebt nunca afeta saldo
               return acc + t.amount;
           }
           if (t.type === 'expense' || t.type === 'investment') {
               if (t.paymentMethod === 'credit') return acc;
               return acc - t.amount;
           }
           return acc;
        }, 0);

      let currentInvoice = 0;
      let allUnpaidInvoices = 0; 
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

          currentInvoice = transactions
              .filter(t => t.walletId === w.id && t.paymentMethod === 'credit' && t.invoiceDate === currentInvoiceDate && !t.isPaidCredit)
              .reduce((acc, t) => acc + t.amount, 0);

          allUnpaidInvoices = transactions
              .filter(t => t.walletId === w.id && t.paymentMethod === 'credit' && !t.isPaidCredit)
              .reduce((acc, t) => acc + t.amount, 0);
      }

      const usedLimit = w.hasCredit ? transactions
          .filter(t => t.walletId === w.id && t.paymentMethod === 'credit' && !t.isPaidCredit)
          .reduce((acc, t) => acc + t.amount, 0) : 0;

      return { ...w, balance, currentInvoice, allUnpaidInvoices, currentInvoiceDate, usedLimit };
    });
  }, [wallets, transactions]);

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
          await addTransaction(amount, categoryName, macro, type, isDebt, description, date, walletId, null, assetId, personId, isFuture, paymentMethod, invoiceDate, false, installments, closingDay);
      }
      if (isSubscription) {
        await createSubscription(amount, categoryName, macro, categoryName, type, dueDay, walletId, shouldProcessNow, paymentMethod);
        setNotification({ msg: shouldProcessNow ? `Assinatura criada e debitada!` : `Agendado para dia ${dueDay}.`, type: "success" });
      } else {
        setNotification({ msg: "Salvo com sucesso!", type: "success" });
      }
    }
  };

  // --- NOVA LÓGICA DE CLICK NO LIXEIRO ---
  const handleOpenDelete = (id) => {
      const transaction = transactions.find(t => t.id === id);
      
      // Se for parcela, abre modal especial
      if (transaction && transaction.installmentGroupId) {
          setInstallmentDeleteModal({ isOpen: true, id: id, groupId: transaction.installmentGroupId });
      } else {
          // Se não, abre modal normal
          setDeleteModal({ isOpen: true, id });
      }
  };

  // Deletar UMA
  const handleDeleteSingle = async () => {
    const idToDelete = deleteModal.id || installmentDeleteModal.id;
    if (idToDelete) {
      const transactionToDelete = transactions.find(t => t.id === idToDelete);
      
      if (transactionToDelete && transactionToDelete.type === 'investment' && transactionToDelete.assetId) {
          try {
              await removeContribution(transactionToDelete.assetId, transactionToDelete.amount);
          } catch (error) {
              console.error("Erro ao abater investimento:", error);
          }
      }
      
      await deleteTransaction(idToDelete);
      
      setNotification({ msg: "Removido.", type: "success" });
      setDeleteModal({ isOpen: false, id: null });
      setInstallmentDeleteModal({ isOpen: false, id: null, groupId: null });

      if (editingData?.id === idToDelete) setEditingData(null);
    }
  };

  // Deletar TODAS (Parcelas)
  const handleDeleteAllInstallments = async () => {
      if (installmentDeleteModal.groupId) {
          await deleteInstallmentGroup(installmentDeleteModal.groupId);
          setNotification({ msg: "Todas as parcelas foram removidas.", type: "success" });
          setInstallmentDeleteModal({ isOpen: false, id: null, groupId: null });
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
      
      {/* Modal Normal */}
      <ConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, id: null })} onConfirm={handleDeleteSingle} title="Excluir Transação" message="Confirma a exclusão?" />

      {/* NOVO: Modal de Parcelas */}
      <InstallmentDeleteModal 
         isOpen={installmentDeleteModal.isOpen}
         onClose={() => setInstallmentDeleteModal({ isOpen: false, id: null, groupId: null })}
         onDeleteSingle={handleDeleteSingle}
         onDeleteAll={handleDeleteAllInstallments}
      />

      <MonthNavigator 
        currentDate={currentDate} 
        onPrev={prevMonth} 
        onNext={nextMonth} 
      />

      <div className="space-y-6">
        <Summary 
            transactions={filteredTransactions.filter(t => !t.isTransfer)} 
            assets={assets} 
            totalBalance={monthlyBalance}
            budgets={budgets}
            onOpenBudgetModal={() => setBudgetModalOpen(true)}
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
            <AnalysisSection 
                transactions={filteredTransactions.filter(t => 
                    t.type === chartType && 
                    !t.isFuture && 
                    !t.isInvoicePayment && 
                    !t.isTransfer
                )}
                chartType={chartType}
                setChartType={setChartType}
                chartMode={chartMode}
                setChartMode={setChartMode}
            />
            
            <TransactionList 
                transactions={filteredTransactions.filter(t => !t.isFuture)} 
                wallets={wallets} 
                onEdit={setEditingData} 
                onDelete={handleOpenDelete} // <--- Alterado para a nova função
                onToggleDebt={toggleDebtStatus} 
                editingId={editingData?.id} 
            />
          </div>
        </div>
      </div>

      <FutureTransactionsModal 
        isOpen={futureModalOpen}
        onClose={() => setFutureModalOpen(false)}
        transactions={futureTransactions}
        totalValue={futureBalance}
        onConfirmReceipt={handleConfirmReceipt}
      />

      <BudgetModal 
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        budgets={budgets}
        transactions={filteredTransactions}
        saveBudget={saveBudget}
      />
    </div>
  );
}