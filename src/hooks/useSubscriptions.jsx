import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useSubscriptions() {
  const { currentUser, userProfile } = useAuth();
  
  const createSubscription = async (amount, category, macro, name, type) => {
    if (!currentUser || !userProfile?.isAuthorized) return;
    
    await addDoc(collection(db, "subscriptions"), {
      uid: currentUser.uid,
      amount: parseFloat(amount),
      category,
      macro,
      name, 
      type, 
      day: new Date().getDate(),
      lastProcessedMonth: new Date().getMonth(),
      active: true
    });
  };

  const processSubscriptions = async (addTransactionFn) => {
    if (!currentUser || !userProfile?.isAuthorized) return;

    const currentMonth = new Date().getMonth();
    
    const q = query(
      collection(db, "subscriptions"), 
      where("uid", "==", currentUser.uid),
      where("active", "==", true)
    );

    const snapshot = await getDocs(q);

    snapshot.forEach(async (subDoc) => {
      const sub = subDoc.data();
      
      if (sub.lastProcessedMonth !== currentMonth) {
        
        await addTransactionFn(
          sub.amount, 
          sub.category,
          sub.macro,
          sub.type || 'expense' 
        );

        await updateDoc(doc(db, "subscriptions", subDoc.id), {
          lastProcessedMonth: currentMonth
        });
      }
    });
  };

  return { createSubscription, processSubscriptions };
}