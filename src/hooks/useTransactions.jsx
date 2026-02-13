import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
  writeBatch,
  getDocs,
  getDoc 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useTransactions() {
  const { currentUser, userProfile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const transactionRef = collection(db, "transactions");

  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setTransactions([]);
        setLoading(false);
        return;
    }

    const q = query(
      transactionRef,
      where("uid", "==", currentUser.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(data);
      setLoading(false);
    }, (error) => {
      console.error("Erro leitura transações:", error);
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  const parseDate = (dateString) => {
    if (!dateString) return serverTimestamp();
    const now = new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  };

  const addMonths = (date, months) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      return d;
  };

  const getInvoiceDateForTransaction = (transactionDate, closingDay) => {
      const date = new Date(transactionDate);
      const day = date.getDate();
      let month = date.getMonth();
      let year = date.getFullYear();

      if (day >= closingDay) { 
          month++;
          if (month > 11) {
              month = 0;
              year++;
          }
      }
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  const addTransaction = async (amount, category, macro, type = 'expense', isDebt = false, description = "", date = null, walletId = null, subscriptionId = null, assetId = null, personId = null, isFuture = false, paymentMethod = 'debit', invoiceDate = null, isInvoicePayment = false, installments = 1, closingDay = null) => {
    if (!userProfile?.isAuthorized) return;
    if (!amount) return;

    const batch = writeBatch(db);
    const groupId = installments > 1 ? crypto.randomUUID() : null; 
    
    const totalCents = Math.round(parseFloat(amount) * 100);
    const baseInstallmentCents = Math.floor(totalCents / installments);
    const remainderCents = totalCents % installments;

    let baseDateObj;
    if (date) {
        const [y, m, d] = date.split('-').map(Number);
        baseDateObj = new Date(y, m - 1, d);
    } else {
        baseDateObj = new Date();
    }

    for (let i = 0; i < installments; i++) {
        const docRef = doc(collection(db, "transactions"));
        
        let currentInstallmentCents = baseInstallmentCents;
        if (i === installments - 1) {
            currentInstallmentCents += remainderCents;
        }

        const finalAmount = currentInstallmentCents / 100;
        
        const currentInstallmentDateObj = addMonths(baseDateObj, i);
        const currentInstallmentDateString = currentInstallmentDateObj.toISOString().split('T')[0];
        
        let currentInvoiceDate = invoiceDate;
        if (paymentMethod === 'credit' && closingDay) {
            currentInvoiceDate = getInvoiceDateForTransaction(currentInstallmentDateObj, closingDay);
        }

        let finalDesc = description;
        if (installments > 1) {
            finalDesc = `${description} (${i + 1}/${installments})`;
        }

        batch.set(docRef, {
            uid: currentUser.uid,
            amount: finalAmount,
            category,
            macro,
            type,
            description: finalDesc,
            isDebt: !!isDebt,
            debtPaid: false,
            isFuture: !!isFuture,
            date: parseDate(currentInstallmentDateString),
            walletId: walletId || null,
            subscriptionId: subscriptionId || null,
            assetId: assetId || null,
            personId: personId || null,
            paymentMethod,
            invoiceDate: currentInvoiceDate,
            isInvoicePayment: !!isInvoicePayment,
            isPaidCredit: false,
            installmentGroupId: groupId, 
            installmentIndex: i + 1,
            totalInstallments: installments
        });
    }

    await batch.commit();
  };

  const addTransfer = async (amount, fromWalletId, toWalletId, date = null, fromName, toName) => {
    if (!userProfile?.isAuthorized) return;
    
    const batch = writeBatch(db);
    const parsedAmount = parseFloat(amount);
    const transactionDate = parseDate(date);

    const docRef1 = doc(collection(db, "transactions"));
    batch.set(docRef1, {
      uid: currentUser.uid,
      amount: parsedAmount,
      category: "Transferência",
      macro: "Transferências",
      type: "expense",
      description: `Para: ${toName}`,
      isDebt: false,
      isFuture: false,
      debtPaid: false,
      isTransfer: true,
      date: transactionDate,
      walletId: fromWalletId,
      paymentMethod: 'debit'
    });

    const docRef2 = doc(collection(db, "transactions"));
    batch.set(docRef2, {
      uid: currentUser.uid,
      amount: parsedAmount,
      category: "Transferência",
      macro: "Transferências",
      type: "income",
      description: `De: ${fromName}`,
      isDebt: false,
      isFuture: false,
      debtPaid: false,
      isTransfer: true,
      date: transactionDate,
      walletId: toWalletId,
      paymentMethod: 'debit'
    });

    await batch.commit();
  };

  const deleteTransaction = async (id) => {
    if (!userProfile?.isAuthorized) return;
    
    const docRef = doc(db, "transactions", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const batch = writeBatch(db);

    if (data.isInvoicePayment && data.relatedTransactionIds && data.relatedTransactionIds.length > 0) {
        data.relatedTransactionIds.forEach(originalTxId => {
            const originalRef = doc(db, "transactions", originalTxId);
            batch.update(originalRef, { isPaidCredit: false });
        });
    }

    if (data.reimbursementId) {
        const reimbursementRef = doc(db, "transactions", data.reimbursementId);
        batch.delete(reimbursementRef);
    }
    
    if (data.relatedDebtId) {
        const debtRef = doc(db, "transactions", data.relatedDebtId);
        batch.update(debtRef, { debtPaid: false, reimbursementId: null });
    }

    batch.delete(docRef);
    await batch.commit();
  };

  const deleteInstallmentGroup = async (groupId) => {
    if (!userProfile?.isAuthorized || !groupId) return;
    const q = query(transactionRef, where("installmentGroupId", "==", groupId), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  };

  const deleteTransactionsByAssetId = async (assetId) => {
    if (!userProfile?.isAuthorized) return;
    const q = query(transactionRef, where("assetId", "==", assetId), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  };

  const updateTransaction = async (id, amount, category, macro, type, isDebt, description = "", date = null, walletId = null, isFuture = false, paymentMethod = 'debit', invoiceDate = null) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    const updateData = {
      amount: parseFloat(amount), category, macro, type, isDebt: !!isDebt, isFuture: !!isFuture,
      description, walletId: walletId || null, paymentMethod, invoiceDate
    };
    if (date) updateData.date = parseDate(date);
    await updateDoc(docRef, updateData);
  };

  // --- LÓGICA CORRIGIDA E INVERTIDA ---
  const toggleDebtStatus = async (id, currentStatus) => {
    if (!userProfile?.isAuthorized) return;
    
    const debtRef = doc(db, "transactions", id);
    const debtSnap = await getDoc(debtRef);

    if (!debtSnap.exists()) return;
    const debtData = debtSnap.data();

    // Cenário 1: Marcar como PAGO
    if (!currentStatus) {
        const batch = writeBatch(db);
        const reimbursementRef = doc(collection(db, "transactions"));
        
        // Verifica se a dívida original era uma SAÍDA (Eu emprestei) ou ENTRADA (Eu peguei)
        const isLending = debtData.type === 'expense'; // Eu emprestei
        
        const reimbursementData = {
            uid: currentUser.uid,
            amount: debtData.amount,
            
            // SE EU EMPRESTEI (Expense) -> Gero REEMBOLSO (Income/Receita)
            // SE EU PEGUEI (Income) -> Gero PAGAMENTO (Expense/Despesa)
            category: isLending ? "Reembolso" : "Pagamento de Dívida",
            macro: isLending ? "Receitas" : "Despesas",
            type: isLending ? "income" : "expense", 
            
            description: `${isLending ? 'Reembolso' : 'Pagamento'}: ${debtData.description || 'Dívida'}`,
            isDebt: false,
            debtPaid: false,
            isFuture: false,
            date: serverTimestamp(), // Data de hoje (quando acertei)
            walletId: debtData.walletId, 
            paymentMethod: 'debit', 
            relatedDebtId: id 
        };

        batch.set(reimbursementRef, reimbursementData);
        batch.update(debtRef, { 
            debtPaid: true, 
            reimbursementId: reimbursementRef.id 
        });

        await batch.commit();
    } 
    // Cenário 2: Desmarcar (Apagar o acerto de contas)
    else {
        const batch = writeBatch(db);
        if (debtData.reimbursementId) {
            const reimbursementRef = doc(db, "transactions", debtData.reimbursementId);
            batch.delete(reimbursementRef);
        }
        batch.update(debtRef, { 
            debtPaid: false, 
            reimbursementId: null 
        });
        await batch.commit();
    }
  };

  const confirmFutureReceipt = async (id) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, { isFuture: false, date: new Date() });
  };

  const payInvoice = async (walletId, amount, invoiceDate, transactionIds) => {
      if (!userProfile?.isAuthorized) return;
      const batch = writeBatch(db);
      
      const payRef = doc(collection(db, "transactions"));
      batch.set(payRef, {
          uid: currentUser.uid,
          amount: parseFloat(amount),
          category: "Pagamento de Fatura",
          macro: "Transferências", 
          type: "expense",
          description: `Fatura ${invoiceDate}`,
          isDebt: false,
          debtPaid: false,
          isFuture: false,
          date: serverTimestamp(),
          walletId: walletId,
          paymentMethod: 'debit',
          isInvoicePayment: true, 
          invoiceDate: invoiceDate,
          relatedTransactionIds: transactionIds 
      });

      transactionIds.forEach(id => {
          const tRef = doc(db, "transactions", id);
          batch.update(tRef, { isPaidCredit: true });
      });

      await batch.commit();
  };

  return { 
    transactions, 
    loading, 
    addTransaction, 
    addTransfer, 
    deleteTransaction,
    deleteInstallmentGroup,
    deleteTransactionsByAssetId,
    updateTransaction, 
    toggleDebtStatus,
    confirmFutureReceipt,
    payInvoice 
  };
}