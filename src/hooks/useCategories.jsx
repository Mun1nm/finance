import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  updateDoc, 
  doc
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useCategories() {
  const { currentUser, userProfile } = useAuth();
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoriesRef = collection(db, "categories");
  const budgetsRef = collection(db, "budgets");

  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setCategories([]);
        setBudgets([]);
        setLoading(false);
        return;
    }

    const qCat = query(categoriesRef, where("uid", "==", currentUser.uid));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
    });

    const qBud = query(budgetsRef, where("uid", "==", currentUser.uid));
    const unsubBud = onSnapshot(qBud, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBudgets(data);
      setLoading(false);
    });

    return () => {
      unsubCat();
      unsubBud();
    };
  }, [currentUser, userProfile]);

  const addCategory = async (name, macro, type) => {
    if (!userProfile?.isAuthorized) return;
    await addDoc(categoriesRef, { uid: currentUser.uid, name, macro, type });
  };

  const updateCategory = async (id, name, macro, type) => {
    if (!userProfile?.isAuthorized) return;
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, { name, macro, type });
  };

  const deleteCategory = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "categories", id));
  };

  const saveBudget = async (macro, limit) => {
    if (!userProfile?.isAuthorized) return;
    const existingBudget = budgets.find(b => b.macro === macro);
    const floatLimit = parseFloat(limit);

    if (existingBudget) {
      const docRef = doc(db, "budgets", existingBudget.id);
      if (floatLimit <= 0) {
        await deleteDoc(docRef);
      } else {
        await updateDoc(docRef, { limit: floatLimit });
      }
    } else if (floatLimit > 0) {
      await addDoc(budgetsRef, { uid: currentUser.uid, macro, limit: floatLimit });
    }
  };

  return { categories, budgets, loading, addCategory, deleteCategory, updateCategory, saveBudget };
}