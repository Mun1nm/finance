import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Guarda dados do banco (isAuthorized)
  const [loading, setLoading] = useState(true);

  // Verifica ou cria o perfil no Firestore
  const checkUserProfile = async (user) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      } else {
        // Primeiro acesso: Cria registro BLOQUEADO
        const newProfile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAuthorized: false, // Começa como false
          createdAt: serverTimestamp()
        };
        
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (error) {
      console.error("Erro ao verificar perfil:", error);
    }
  };

  // Detecta se está rodando como PWA standalone (iOS Safari "Adicionar ao Menu Inicial")
  const isStandalone = () => {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
  };

  const login = () => {
    const provider = new GoogleAuthProvider();

    // PWA standalone no iOS não suporta popups — usa redirect
    if (isStandalone()) {
      return signInWithRedirect(auth, provider);
    }

    // Navegador normal — usa popup com espera completa
    return new Promise((resolve, reject) => {
      const unsubscribeTemp = onAuthStateChanged(auth, async (user) => {
        if (user) {
          unsubscribeTemp();
          try {
            await user.getIdToken(true);
            setCurrentUser(user);
            await checkUserProfile(user);
            setLoading(false);
            resolve();
          } catch (err) {
            reject(err);
          }
        }
      });

      signInWithPopup(auth, provider).catch((err) => {
        unsubscribeTemp();
        reject(err);
      });
    });
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const init = async () => {
      try {
        // 1. Processa redirect PRIMEIRO (se voltando do Google OAuth)
        const result = await getRedirectResult(auth);
        if (result?.user && isMounted) {
          await result.user.getIdToken(true);
          setCurrentUser(result.user);
          await checkUserProfile(result.user);
          setLoading(false);
          return; // Redirect processado, onAuthStateChanged vai cuidar do resto
        }
      } catch (err) {
        console.error("Erro no redirect login:", err);
      }

      // 2. Se não veio de redirect, escuta auth state normalmente
      if (!isMounted) return;

      unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        if (user) {
          await user.getIdToken(true);
          setCurrentUser(user);
          await checkUserProfile(user);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
    };

    init();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile, // Exposto para o app checar userProfile.isAuthorized
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