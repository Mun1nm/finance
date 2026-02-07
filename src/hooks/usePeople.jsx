import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";

export function usePeople() {
  const { currentUser, userProfile } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const peopleRef = collection(db, "people");

  useEffect(() => {
    if (!currentUser || !userProfile?.isAuthorized) {
        setPeople([]);
        setLoading(false);
        return;
    }

    const q = query(peopleRef, where("uid", "==", currentUser.uid), orderBy("name"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPeople(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  const addPerson = async (name) => {
    if (!userProfile?.isAuthorized) return;
    await addDoc(peopleRef, {
      uid: currentUser.uid,
      name,
      createdAt: new Date()
    });
  };

  const deletePerson = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "people", id));
  };

  return { people, loading, addPerson, deletePerson };
}