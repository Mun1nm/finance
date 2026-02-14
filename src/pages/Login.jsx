import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { handleGoogleCredential, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const buttonRef = useRef(null);

  // Redireciona se já estiver autenticado
  useEffect(() => {
    if (currentUser && userProfile) {
      navigate("/");
    }
  }, [currentUser, userProfile, navigate]);

  // Inicializa o botão do Google Identity Services
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setError("");
            await handleGoogleCredential(response);
          } catch (err) {
            setError("Falha no login: " + err.message);
          }
        }
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "filled_black",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: 320
      });
    };

    // O script GIS pode ainda não ter carregado
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Espera o script carregar
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [handleGoogleCredential]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Finance
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Acesso restrito ao proprietário.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <div ref={buttonRef}></div>
        </div>
      </div>
    </div>
  );
}
