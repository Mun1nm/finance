import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../services/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, // <--- MUDANÇA PRINCIPAL: Usar Popup
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
        
        // Garante persistência LOCAL
        await setPersistence(auth, browserLocalPersistence);
        
        // MUDANÇA AQUI: Popup é imune a bloqueios de redirect e 404 da Vercel
        await signInWithPopup(auth, provider);
        
        // O onAuthStateChanged vai capturar o sucesso automaticamente
    } catch (error) {
        console.error("Erro ao iniciar login:", error);
        alert("Erro ao logar: " + error.message); // Alerta visual para debug
    }
  };

  const logout = () => {
    setUserProfile(null);
    return signOut(auth);
  };

  useEffect(() => {
    // Escuta mudanças na autenticação
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                // Usuário logado
                setCurrentUser(user);
                await checkUserProfile(user); 
            } else {
                // Ninguém logado
                setCurrentUser(null);
                setUserProfile(null);
            }
        } catch (error) {
            console.error("Erro no listener de auth:", error);
        } finally {
            // Remove o loading independente do resultado
            setLoading(false);
        }
    });

    // Limpa o listener ao desmontar
    return () => unsubscribe();
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