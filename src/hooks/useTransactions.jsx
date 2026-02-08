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
  getDocs 
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
      console.log("Aguardando permissão de leitura...");
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  const parseDate = (dateString) => {
    if (!dateString) return serverTimestamp();
    const now = new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes());
  };

  // HELPERS PARA DATA
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

      // Se comprou depois do fechamento, joga para o próximo mês
      if (day > closingDay) {
          month++;
          if (month > 11) {
              month = 0;
              year++;
          }
      }
      // Retorna YYYY-MM
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  // ATUALIZADO: Suporte a Parcelas
  const addTransaction = async (amount, category, macro, type = 'expense', isDebt = false, description = "", date = null, walletId = null, subscriptionId = null, assetId = null, personId = null, isFuture = false, paymentMethod = 'debit', invoiceDate = null, isInvoicePayment = false, installments = 1, closingDay = null) => {
    if (!userProfile?.isAuthorized) return;
    if (!amount) return;

    const batch = writeBatch(db);
    const groupId = installments > 1 ? crypto.randomUUID() : null; // ID para agrupar parcelas
    const baseAmount = parseFloat(amount);
    const installmentValue = installments > 1 ? baseAmount / installments : baseAmount;
    
    // Data base da compra
    const [y, m, d] = date.split('-').map(Number);
    const baseDateObj = new Date(y, m - 1, d);

    for (let i = 0; i < installments; i++) {
        const docRef = doc(collection(db, "transactions"));
        
        // Calcula data da parcela (Mês + i)
        const currentInstallmentDateObj = addMonths(baseDateObj, i);
        const currentInstallmentDateString = currentInstallmentDateObj.toISOString().split('T')[0];
        
        // Se for crédito, calcula a invoiceDate de CADA parcela individualmente
        let currentInvoiceDate = invoiceDate;
        if (paymentMethod === 'credit' && closingDay) {
            currentInvoiceDate = getInvoiceDateForTransaction(currentInstallmentDateObj, closingDay);
        }

        // Descrição da parcela
        let finalDesc = description;
        if (installments > 1) {
            finalDesc = `${description} (${i + 1}/${installments})`;
        }

        batch.set(docRef, {
            uid: currentUser.uid,
            amount: installmentValue,
            category,
            macro,
            type,
            description: finalDesc,
            isDebt,
            debtPaid: false,
            isFuture: isFuture || false,
            date: parseDate(currentInstallmentDateString),
            walletId: walletId || null,
            subscriptionId: subscriptionId || null,
            assetId: assetId || null,
            personId: personId || null,
            paymentMethod,
            invoiceDate: currentInvoiceDate,
            isInvoicePayment,
            isPaidCredit: false, // Nova flag: Crédito pago/liberado
            installmentGroupId: groupId, // Para identificar o grupo depois se precisar apagar tudo
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
    await deleteDoc(docRef);
  };

  const updateTransaction = async (id, amount, category, macro, type, isDebt, description = "", date = null, walletId = null, isFuture = false, paymentMethod = 'debit', invoiceDate = null) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    
    const updateData = {
      amount: parseFloat(amount),
      category,
      macro,
      type,
      isDebt,
      isFuture,
      description,
      walletId: walletId || null,
      paymentMethod,
      invoiceDate
    };

    if (date) {
      updateData.date = parseDate(date);
    }

    await updateDoc(docRef, updateData);
  };

  const toggleDebtStatus = async (id, currentStatus) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, {
      debtPaid: !currentStatus
    });
  };

  const confirmFutureReceipt = async (id) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, {
      isFuture: false,
      date: new Date()
    });
  };

  // NOVA FUNÇÃO: Pagar Fatura (Baixa as transações de crédito)
  const payInvoice = async (walletId, amount, invoiceDate, transactionIds) => {
      if (!userProfile?.isAuthorized) return;
      const batch = writeBatch(db);
      
      // 1. Cria a transação de saída (Pagamento)
      const payRef = doc(collection(db, "transactions"));
      batch.set(payRef, {
          uid: currentUser.uid,
          amount: parseFloat(amount),
          category: "Pagamento de Fatura",
          macro: "Transferências", // Ou Finanças
          type: "expense",
          description: `Fatura ${invoiceDate}`,
          isDebt: false,
          debtPaid: false,
          isFuture: false,
          date: serverTimestamp(),
          walletId: walletId,
          paymentMethod: 'debit',
          isInvoicePayment: true, // Importante para não duplicar no gráfico
          invoiceDate: invoiceDate
      });

      // 2. Marca todas as compras da fatura como "PAGAS" (libera limite)
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
    updateTransaction, 
    toggleDebtStatus,
    confirmFutureReceipt,
    payInvoice // Exportando nova função
  };
}