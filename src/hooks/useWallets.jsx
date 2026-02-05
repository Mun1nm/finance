import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, writeBatch, getDocs } from "firebase/firestore"; // Adicionei writeBatch e getDocs
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

    // Ordenar para garantir consistência visual? Pode ser no front.
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

  const addWallet = async (name) => {
    if (!userProfile?.isAuthorized) return;
    await addDoc(walletsRef, {
      uid: currentUser.uid,
      name,
      isDefault: false, // Padrão false
      createdAt: new Date()
    });
  };

  const deleteWallet = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "wallets", id));
  };

  // NOVA FUNÇÃO: Define a carteira principal
  const setAsDefault = async (walletId) => {
    if (!userProfile?.isAuthorized) return;
    
    const batch = writeBatch(db);
    
    // 1. Busca todas as carteiras do usuário
    const q = query(walletsRef, where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    // 2. Varre todas: Se for a escolhida, põe true. Se não, põe false.
    snapshot.forEach(docSnap => {
        const isTarget = docSnap.id === walletId;
        // Só gasta operação de escrita se o valor for mudar
        if (docSnap.data().isDefault !== isTarget) {
            batch.update(doc(db, "wallets", docSnap.id), { isDefault: isTarget });
        }
    });

    await batch.commit();
  };

  return { wallets, loading, addWallet, deleteWallet, setAsDefault };
}