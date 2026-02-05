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
  const { currentUser, userProfile } = useAuth(); // Pega o perfil
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const categoriesRef = collection(db, "categories");

  useEffect(() => {
    // Só busca se estiver logado E autorizado
    if (!currentUser || !userProfile?.isAuthorized) {
        setCategories([]);
        setLoading(false);
        return;
    }

    const q = query(categoriesRef, where("uid", "==", currentUser.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(data.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      console.log("Aguardando permissão de leitura...");
    });

    return unsubscribe;
  }, [currentUser, userProfile]); // Adiciona userProfile na dependência

  const addCategory = async (name, macro, type) => {
    if (!userProfile?.isAuthorized) return;
    await addDoc(categoriesRef, {
      uid: currentUser.uid,
      name,
      macro,
      type 
    });
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

  return { categories, loading, addCategory, deleteCategory, updateCategory };
}