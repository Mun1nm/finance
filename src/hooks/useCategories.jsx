import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc,
  updateDoc, // Importar updateDoc
  doc
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function useCategories() {
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoriesRef = collection(db, "categories");

  useEffect(() => {
    if (!currentUser) return;

    const q = query(categoriesRef, where("uid", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  const addCategory = async (name, macro, type) => {
    await addDoc(categoriesRef, {
      uid: currentUser.uid,
      name,
      macro,
      type 
    });
  };

  // NOVA FUNÇÃO
  const updateCategory = async (id, name, macro, type) => {
    const docRef = doc(db, "categories", id);
    await updateDoc(docRef, {
      name,
      macro,
      type
    });
  };

  const deleteCategory = async (id) => {
    await deleteDoc(doc(db, "categories", id));
  };

  return { categories, loading, addCategory, deleteCategory, updateCategory };
}