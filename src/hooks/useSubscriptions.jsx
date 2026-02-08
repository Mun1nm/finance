import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, onSnapshot 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useSubscriptions() {
  const { currentUser, userProfile } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. LISTAR
  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setSubscriptions([]);
        setLoading(false);
        return;
    }
    const q = query(collection(db, "subscriptions"), where("uid", "==", currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubscriptions(data);
      setLoading(false);
    }, (error) => {
        console.log("Erro ao buscar assinaturas", error);
    });
    return unsubscribe;
  }, [currentUser, userProfile]);

  // 2. CRIAR
  const createSubscription = async (amount, category, macro, name, type, day, walletId, initialPaymentMade, paymentMethod = 'debit') => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const currentMonth = new Date().getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    await addDoc(collection(db, "subscriptions"), {
      uid: currentUser.uid,
      amount: parseFloat(amount),
      category,
      macro,
      name, 
      type, 
      day: parseInt(day),
      walletId: walletId || null,
      paymentMethod, // Salva se é crédito ou débito
      lastProcessedMonth: initialPaymentMade ? currentMonth : lastMonth,
      active: true
    });
  };

  // 3. ATUALIZAR
  const updateSubscription = async (id, newData) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "subscriptions", id);
    await updateDoc(docRef, newData);
  };

  // 4. TOGGLE
  const toggleSubscription = async (id, currentStatus) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "subscriptions", id);
    await updateDoc(docRef, { active: !currentStatus });
  };

  // 5. DELETAR
  const deleteSubscription = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "subscriptions", id));
  };

  // Helper para calcular data da fatura (Duplicado do useTransactions para evitar dep circular)
  const getInvoiceDate = (dateObj, closingDay) => {
      const day = dateObj.getDate();
      let month = dateObj.getMonth();
      let year = dateObj.getFullYear();

      if (day > closingDay) {
          month++;
          if (month > 11) {
              month = 0;
              year++;
          }
      }
      return `${year}-${String(month + 1).padStart(2, '0')}`;
  };

  // 6. PROCESSAR (RODA NA DASHBOARD)
  const processSubscriptions = async (addTransactionFn, wallets) => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    const q = query(collection(db, "subscriptions"), where("uid", "==", currentUser.uid), where("active", "==", true));
    const snapshot = await getDocs(q);

    // Itera usando for...of para garantir sincronia se necessário, embora forEach funcione com async/await soltos
    for (const subDoc of snapshot.docs) {
      const sub = subDoc.data();
      
      // Se ainda não processou este mês E hoje já é (ou passou do) dia de vencimento
      if (sub.lastProcessedMonth !== currentMonth && currentDay >= sub.day) {
        
        let invoiceDate = null;
        let paymentMethod = sub.paymentMethod || 'debit';

        // Se for crédito, calcula a fatura
        if (paymentMethod === 'credit' && sub.walletId && wallets) {
            const wallet = wallets.find(w => w.id === sub.walletId);
            if (wallet && wallet.hasCredit && wallet.closingDay) {
                // A data da transação será HOJE (dia do processamento)
                invoiceDate = getInvoiceDate(today, wallet.closingDay);
            } else {
                // Se a carteira não tem crédito ou não existe, fallback para débito
                paymentMethod = 'debit';
            }
        }

        // Chama a função de adicionar transação passada pelo Dashboard
        await addTransactionFn(
          sub.amount, 
          sub.category, 
          sub.macro,    
          sub.type || 'expense',
          false,        
          `Assinatura Mensal: ${sub.name}`,
          today.toLocaleDateString('en-CA'), // Data da transação = Hoje
          sub.walletId,
          subDoc.id, // subscriptionId
          paymentMethod, // Novo
          invoiceDate    // Novo
        );

        await updateDoc(doc(db, "subscriptions", subDoc.id), { lastProcessedMonth: currentMonth });
      }
    }
  };

  return { subscriptions, loading, createSubscription, updateSubscription, processSubscriptions, toggleSubscription, deleteSubscription };
}