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
    });
    return unsubscribe;
  }, [currentUser, userProfile]);

  // 2. CRIAR (CORRIGIDO)
  const createSubscription = async (amount, category, macro, name, type, day, walletId, initialPaymentMade) => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const currentMonth = new Date().getMonth();
    // Se pagou agora, marca o mês atual como processado. Se não, marca o anterior.
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

  // 4. TOGGLE (Pausar/Ativar)
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

  // 6. PROCESSAR (RODA NA DASHBOARD)
  const processSubscriptions = async (addTransactionFn) => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    const q = query(collection(db, "subscriptions"), where("uid", "==", currentUser.uid), where("active", "==", true));
    const snapshot = await getDocs(q);

    snapshot.forEach(async (subDoc) => {
      const sub = subDoc.data();
      
      // Lógica: Se ainda não processou este mês E hoje já é (ou passou do) dia de vencimento
      if (sub.lastProcessedMonth !== currentMonth && currentDay >= sub.day) {
        
        await addTransactionFn(
          sub.amount, 
          sub.category, 
          sub.macro,    
          sub.type || 'expense',
          false,        
          `Assinatura Mensal: ${sub.name}`,
          new Date().toLocaleDateString('en-CA'),
          sub.walletId,
          subDoc.id // Envia ID da assinatura
        );

        await updateDoc(doc(db, "subscriptions", subDoc.id), { lastProcessedMonth: currentMonth });
      }
    });
  };

  return { subscriptions, loading, createSubscription, updateSubscription, processSubscriptions, toggleSubscription, deleteSubscription };
}