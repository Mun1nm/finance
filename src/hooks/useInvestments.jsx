import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, getDoc, increment 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useInvestments() {
  const { currentUser, userProfile } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const assetsRef = collection(db, "assets");

  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setAssets([]);
        setLoading(false);
        return;
    }

    const q = query(assetsRef, where("uid", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAssets(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  // ATUALIZADO: Agora retorna o resultado do addDoc (que contém o ID)
  const addAsset = async (name, type, initialAmount) => {
    if (!userProfile?.isAuthorized) return;
    return await addDoc(assetsRef, {
      uid: currentUser.uid,
      name,
      type,
      investedAmount: parseFloat(initialAmount),
      currentValue: parseFloat(initialAmount),
      createdAt: new Date()
    });
  };

  const updateBalance = async (id, newBalance) => {
    if (!userProfile?.isAuthorized) return;
    const assetRef = doc(db, "assets", id);
    await updateDoc(assetRef, {
      currentValue: parseFloat(newBalance)
    });
  };

  const addContribution = async (id, amount) => {
    if (!userProfile?.isAuthorized) return;
    const assetRef = doc(db, "assets", id);
    await updateDoc(assetRef, {
      investedAmount: increment(parseFloat(amount)),
      currentValue: increment(parseFloat(amount))
    });
  };

  const removeContribution = async (id, amount) => {
    if (!userProfile?.isAuthorized) return;
    const assetRef = doc(db, "assets", id);
    const assetSnap = await getDoc(assetRef);
    
    if (assetSnap.exists()) {
        const data = assetSnap.data();
        const newInvested = (data.investedAmount || 0) - parseFloat(amount);
        const newCurrent = (data.currentValue || 0) - parseFloat(amount);

        if (newCurrent <= 0.01) { 
            await deleteDoc(assetRef);
        } else {
            await updateDoc(assetRef, {
                investedAmount: newInvested > 0 ? newInvested : 0,
                currentValue: newCurrent
            });
        }
    }
  };

  const processWithdrawal = async (id, grossAmount, isFullWithdrawal) => {
    if (!userProfile?.isAuthorized) return;
    const assetRef = doc(db, "assets", id);

    if (isFullWithdrawal) {
        await deleteDoc(assetRef);
    } else {
        await updateDoc(assetRef, {
            currentValue: increment(-parseFloat(grossAmount))
        });
    }
  };

  const deleteAsset = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "assets", id));
  };

  return { 
    assets, 
    loading, 
    addAsset, 
    updateBalance, 
    addContribution, 
    removeContribution, 
    processWithdrawal,
    deleteAsset 
  };
}