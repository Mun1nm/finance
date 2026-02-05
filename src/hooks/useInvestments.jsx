import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  deleteDoc, 
  doc,
  serverTimestamp,
  arrayUnion 
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
    }, (error) => {
      console.log("Aguardando permissão de leitura...");
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  const addAsset = async (name, type, initialValue = 0) => {
    if (!userProfile?.isAuthorized) return;
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
    if (!userProfile?.isAuthorized) return;
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
    if (!userProfile?.isAuthorized) return;
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

  const deleteAsset = async (id) => {
    if (!userProfile?.isAuthorized) return;
    const assetRef = doc(db, "assets", id);
    await deleteDoc(assetRef);
  };

  return { assets, loading, addAsset, updateBalance, addContribution, deleteAsset };
}