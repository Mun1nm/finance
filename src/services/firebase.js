import { initializeApp } from "firebase/app";
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check"; 

const firebaseConfig = {
  // ... suas configs normais
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

if (typeof window !== 'undefined') {
  // SEGURANÇA: Só ativa o Debug se estiver em localhost
  if (window.location.hostname === "localhost") {
    // Busca o token do arquivo .env.local (que não vai para o GitHub)
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
    isTokenAutoRefreshEnabled: true
  });
}

// IndexedDB persistence funciona melhor em PWA standalone (iOS)
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence]
});
export const db = getFirestore(app);

export default app;