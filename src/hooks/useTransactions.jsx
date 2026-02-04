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
  Timestamp // Importar Timestamp
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useTransactions() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const transactionRef = collection(db, "transactions");

  useEffect(() => {
    if (!currentUser) {
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
      console.error("Erro ao buscar transações:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Função auxiliar para tratar a data
  const parseDate = (dateString) => {
    if (!dateString) return serverTimestamp();
    
    // Cria a data baseada na string YYYY-MM-DD
    // Adiciona "T12:00:00" para evitar problemas de fuso horário (UTC vs Local)
    // Ou melhor: Vamos pegar a data escolhida e colocar o horário atual
    const now = new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Cria data local: Ano, Mês (0-index), Dia, Hora Atual, Minuto Atual
    return new Date(year, month - 1, day, now.getHours(), now.getMinutes());
  };

  // ATUALIZADO: Aceita date (string YYYY-MM-DD)
  const addTransaction = async (amount, category, macro, type = 'expense', isDebt = false, description = "", date = null) => {
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
      date: parseDate(date) // Usa a data customizada ou servidor
    });
  };

  const deleteTransaction = async (id) => {
    const docRef = doc(db, "transactions", id);
    await deleteDoc(docRef);
  };

  // ATUALIZADO: Aceita date
  const updateTransaction = async (id, amount, category, macro, type, isDebt, description = "", date = null) => {
    const docRef = doc(db, "transactions", id);
    
    const updateData = {
      amount: parseFloat(amount),
      category,
      macro,
      type,
      isDebt,
      description
    };

    // Só atualiza a data se o usuário passou uma nova, senão mantém a original
    if (date) {
      updateData.date = parseDate(date);
    }

    await updateDoc(docRef, updateData);
  };

  const toggleDebtStatus = async (id, currentStatus) => {
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, {
      debtPaid: !currentStatus
    });
  };

  return { 
    transactions, 
    loading, 
    addTransaction, 
    deleteTransaction, 
    updateTransaction,
    toggleDebtStatus 
  };
}