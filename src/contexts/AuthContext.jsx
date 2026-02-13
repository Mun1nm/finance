import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithRedirect, 
  getRedirectResult, // <--- O CARA QUE RESOLVE O RETORNO
  GoogleAuthProvider, 
  signOut,
  setPersistence, 
  browserLocalPersistence // <--- OBRIGA O IPHONE A SALVAR
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
        // 1. Força persistência LOCAL (crucial para PWA no iOS)
        await setPersistence(auth, browserLocalPersistence);
        // 2. Redireciona
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
    let unsubscribe;

    const initAuth = async () => {
        // A: Tenta capturar o usuário que acabou de voltar do Google
        try {
            const redirectResult = await getRedirectResult(auth);
            if (redirectResult && redirectResult.user) {
                // Se pegou o usuário no redirecionamento, já salva
                setCurrentUser(redirectResult.user);
                await checkUserProfile(redirectResult.user);
            }
        } catch (error) {
            console.error("Erro no retorno do login:", error);
        }

        // B: Ouve mudanças de estado normais (ex: refresh de página, token expirado)
        unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                // Só busca o perfil se ele ainda não estiver carregado (pra evitar chamadas duplas)
                await checkUserProfile(user); 
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });
    };

    initAuth();

    return () => {
        if (unsubscribe) unsubscribe();
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