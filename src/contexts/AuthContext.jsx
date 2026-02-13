import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult, // Importante para debugar
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

  // ... (Mantenha sua função checkUserProfile igualzinha estava) ...
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
        // Define persistência LOCAL para garantir que o PWA lembre do usuário
        await setPersistence(auth, browserLocalPersistence);
        
        // VOLTAMOS PARA REDIRECT (Correto para PWA)
        await signInWithRedirect(auth, provider);
    } catch (error) {
        console.error("Erro ao iniciar login:", error);
        alert("Erro ao iniciar login: " + error.message);
    }
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    // 1. Verifica se estamos voltando de um redirecionamento (Login com sucesso)
    getRedirectResult(auth).then(async (result) => {
        if (result && result.user) {
            console.log("Voltou do Redirect com sucesso:", result.user);
            await checkUserProfile(result.user);
        }
    }).catch((error) => {
        console.error("Erro no retorno do Redirect:", error);
    });

    // 2. Monitora o estado normal
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            setCurrentUser(user);
            if (!userProfile) await checkUserProfile(user);
        } else {
            setCurrentUser(null);
            setUserProfile(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Array vazio, roda só na montagem

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