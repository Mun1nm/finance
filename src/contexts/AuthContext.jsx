import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult, // <--- IMPORTANTE: Função para capturar o retorno do login
  GoogleAuthProvider, 
  signOut,
  setPersistence, // <--- Para forçar persistência local
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

  const checkUserProfile = async (user) => {
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
    const provider = new GoogleAuthProvider();
    // Força a persistência LOCAL antes de redirecionar
    // Isso ajuda o PWA a não "esquecer" a sessão no meio do caminho
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, provider);
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    // 1. Tenta capturar o resultado do redirecionamento assim que o app monta
    getRedirectResult(auth)
      .then(async (result) => {
        if (result && result.user) {
          // Se voltou do Google com sucesso, já carrega o perfil
          await checkUserProfile(result.user);
        }
      })
      .catch((error) => {
        console.error("Erro no redirecionamento PWA:", error);
      });

    // 2. Ouve mudanças de estado (para logins normais ou recarregamentos)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Só busca o perfil se ainda não tivermos (evita duplicidade com o getRedirectResult)
        // Mas por segurança, chamar aqui garante que funcione sempre
        await checkUserProfile(user); 
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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