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
    // Processa retorno do signInWithRedirect (PWA standalone)
    getRedirectResult(auth).catch((err) => {
      console.error("Erro no redirect login:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se o login() já processou este usuário, não duplica
        if (currentUser?.uid === user.uid && userProfile) {
          setLoading(false);
          return;
        }
        await user.getIdToken(true);
        setCurrentUser(user);
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