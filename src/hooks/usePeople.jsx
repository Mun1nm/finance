import { useState, useEffect } from "react";
import { db } from "../services/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
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

    const q = query(peopleRef, where("uid", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      data.sort((a, b) => {
        const aOrder = a.sortOrder ?? Infinity;
        const bOrder = b.sortOrder ?? Infinity;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name, 'pt-BR');
      });

      setPeople(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser, userProfile]);

  // Migração lazy: adiciona sortOrder às pessoas que não têm
  useEffect(() => {
    if (!userProfile?.isAuthorized || people.length === 0) return;

    const needsMigration = people.some(p => p.sortOrder === undefined);
    if (!needsMigration) return;

    const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const batch = writeBatch(db);
    sorted.forEach((p, index) => {
      batch.update(doc(db, "people", p.id), { sortOrder: index });
    });
    batch.commit().catch(err => console.error("Erro na migração sortOrder:", err));
  }, [people, userProfile]);

  const addPerson = async (name) => {
    if (!userProfile?.isAuthorized) return;
    const maxOrder = people.length > 0
      ? Math.max(...people.map(p => p.sortOrder ?? 0))
      : -1;
    await addDoc(peopleRef, {
      uid: currentUser.uid,
      name,
      sortOrder: maxOrder + 1,
      createdAt: new Date()
    });
  };

  const deletePerson = async (id) => {
    if (!userProfile?.isAuthorized) return;
    await deleteDoc(doc(db, "people", id));
  };

  const updatePerson = async (id, data) => {
    if (!userProfile?.isAuthorized) return;
    await updateDoc(doc(db, "people", id), data);
  };

  const reorderPeople = async (reorderedArray) => {
    if (!userProfile?.isAuthorized) return;
    const batch = writeBatch(db);
    reorderedArray.forEach((p, index) => {
      batch.update(doc(db, "people", p.id), { sortOrder: index });
    });
    await batch.commit();
  };

  const sortPeopleAlphabetically = async () => {
    if (!userProfile?.isAuthorized) return;
    const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const batch = writeBatch(db);
    sorted.forEach((p, index) => {
      batch.update(doc(db, "people", p.id), { sortOrder: index });
    });
    await batch.commit();
  };

  return { people, loading, addPerson, deletePerson, updatePerson, reorderPeople, sortPeopleAlphabetically };
}
