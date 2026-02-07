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

  const addTransaction = async (amount, category, macro, type = 'expense', isDebt = false, description = "", date = null, walletId = null, subscriptionId = null, assetId = null, personId = null) => {
    if (!userProfile?.isAuthorized) return;
    if (!amount) return;
    
    await addDoc(transactionRef, {
      uid: currentUser.uid,
      amount: parseFloat(amount),
      category,
      macro,
      type,
      description,
      isDebt,
      debtPaid: false,
      date: parseDate(date),
      walletId: walletId || null,
      subscriptionId: subscriptionId || null,
      assetId: assetId || null,
      personId: personId || null
    });
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
      debtPaid: false,
      date: transactionDate,
      walletId: fromWalletId
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
      debtPaid: false,
      date: transactionDate,
      walletId: toWalletId
    });

    await batch.commit();
  };

  const deleteTransaction = async (id) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
  };

  // --- CORREÇÃO AQUI ---
  const deleteTransactionsByAssetId = async (assetId) => {
    if (!userProfile?.isAuthorized) return;
    
    // Adicionado 'where("uid", "==", currentUser.uid)' para satisfazer as regras de segurança
    const q = query(
        transactionRef, 
        where("assetId", "==", assetId),
        where("uid", "==", currentUser.uid) 
    );
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
  };

  const updateTransaction = async (id, amount, category, macro, type, isDebt, description = "", date = null, walletId = null) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "transactions", id);
    
    const updateData = {
      amount: parseFloat(amount),
      category,
      macro,
      type,
      isDebt,
      description,
      walletId: walletId || null
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

  return { 
    transactions, 
    loading, 
    addTransaction, 
    addTransfer, 
    deleteTransaction, 
    deleteTransactionsByAssetId, 
    updateTransaction, 
    toggleDebtStatus 
  };
}