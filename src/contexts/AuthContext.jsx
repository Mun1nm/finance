import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  GoogleAuthProvider, 
  signOut,
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função auxiliar para buscar/criar perfil no banco
  const checkUserProfile = async (user) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      } else {
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAuthorized: false,
          createdAt: serverTimestamp()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  };

  const login = async () => {
    try {
        const provider = new GoogleAuthProvider();
        // Força a persistência LOCAL antes de redirecionar
        // Isso é CRUCIAL para o iPhone não "esquecer" o login na volta
        await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Erro ao iniciar login:", error);
    }
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    // Definimos a persistência também no carregamento inicial por segurança
    const initAuth = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
        } catch (e) {
            console.error("Erro ao definir persistência:", e);
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Usuário detectado (mesmo voltando do redirect)
                setCurrentUser(user);
                await checkUserProfile(user); 
            } else {
                // Ninguém logado
                setCurrentUser(null);
                setUserProfile(null);
            }
            // Só libera o app depois de checar tudo
            setLoading(false);
        });

        return unsubscribe;
    };

    // Executa e guarda a função de limpeza
    let unsubscribeFunc;
    initAuth().then(unsub => {
        unsubscribeFunc = unsub;
    });

    return () => {
        if (unsubscribeFunc) unsubscribeFunc();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}