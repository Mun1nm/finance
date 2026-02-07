import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, writeBatch, getDocs, updateDoc } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useWallets() {
  const { currentUser, userProfile } = useAuth();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const walletsRef = collection(db, "wallets");

  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setWallets([]);
        setLoading(false);
        return;
    }

    const q = query(walletsRef, where("uid", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Ordena: Primeiro a Default, depois por nome
      setWallets(data.sort((a, b) => (b.isDefault === true) - (a.isDefault === true) || a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  // ATUALIZADO: Aceita creditLimit
  const addWallet = async (name, hasCredit = false, closingDay = null, dueDay = null, creditLimit = 0) => {
    if (!userProfile?.isAuthorized) return;
    await addDoc(walletsRef, {
      uid: currentUser.uid,
      name,
      isDefault: false,
      hasCredit, 
      closingDay: hasCredit ? parseInt(closingDay) : null,
      dueDay: hasCredit ? parseInt(dueDay) : null,
      creditLimit: hasCredit ? parseFloat(creditLimit) : 0, // Novo Campo
      createdAt: new Date()
    });
  };

  const deleteWallet = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "wallets", id));
  };

  // NOVA FUNÇÃO: Atualizar dados da carteira (ex: limite)
  const updateWallet = async (id, data) => {
    if (!userProfile?.isAuthorized) return;
    const walletRef = doc(db, "wallets", id);
    await updateDoc(walletRef, data);
  };

  const setAsDefault = async (walletId) => {
    if (!userProfile?.isAuthorized) return;
    
    const batch = writeBatch(db);
    const q = query(walletsRef, where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    snapshot.forEach(docSnap => {
        const isTarget = docSnap.id === walletId;
        if (docSnap.data().isDefault !== isTarget) {
            batch.update(doc(db, "wallets", docSnap.id), { isDefault: isTarget });
        }
    });

    await batch.commit();
  };

  return { wallets, loading, addWallet, deleteWallet, updateWallet, setAsDefault };
}