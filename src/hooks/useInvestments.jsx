import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  deleteDoc, // <--- Importar deleteDoc
  doc,
  serverTimestamp,
  arrayUnion 
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useInvestments() {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  const assetsRef = collection(db, "assets");

  useEffect(() => {
    if (!currentUser) return;

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
  }, [currentUser]);

  const addAsset = async (name, type, initialValue = 0) => {
    await addDoc(assetsRef, {
      uid: currentUser.uid,
      name,
      type,
      investedAmount: parseFloat(initialValue),
      currentValue: parseFloat(initialValue),
      history: [
        { date: new Date().toISOString(), value: parseFloat(initialValue), type: 'initial' }
      ],
      lastUpdate: serverTimestamp()
    });
  };

  const updateBalance = async (id, newValue) => {
    const assetRef = doc(db, "assets", id);
    await updateDoc(assetRef, {
      currentValue: parseFloat(newValue),
      lastUpdate: serverTimestamp(),
      history: arrayUnion({
        date: new Date().toISOString(),
        value: parseFloat(newValue),
        type: 'update'
      })
    });
  };

  const addContribution = async (id, amount) => {
    const asset = assets.find(a => a.id === id);
    if (!asset) return;

    const newInvested = asset.investedAmount + parseFloat(amount);
    const newCurrent = asset.currentValue + parseFloat(amount);

    const assetRef = doc(db, "assets", id);
    await updateDoc(assetRef, {
      investedAmount: newInvested,
      currentValue: newCurrent,
      lastUpdate: serverTimestamp(),
      history: arrayUnion({
        date: new Date().toISOString(),
        value: newCurrent,
        amountAdded: parseFloat(amount),
        type: 'contribution'
      })
    });
  };

  // --- NOVA FUNÇÃO ---
  const deleteAsset = async (id) => {
    const assetRef = doc(db, "assets", id);
    await deleteDoc(assetRef);
  };

  return { assets, loading, addAsset, updateBalance, addContribution, deleteAsset };
}