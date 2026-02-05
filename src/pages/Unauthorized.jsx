import { useAuth } from "../contexts/AuthContext";
import { Lock, LogOut } from "lucide-react";

export default function Unauthorized() {
  const { logout, currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-red-500/30 max-w-md w-full text-center">
        <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={40} className="text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Acesso Pendente</h1>
        <p className="text-gray-400 mb-6">
          Olá, <span className="text-white font-bold">{currentUser?.displayName}</span>. 
          Seu cadastro foi realizado, mas você precisa de autorização do administrador para acessar o sistema.
        </p>

        <div className="bg-gray-900/50 p-4 rounded-lg mb-6 text-sm text-gray-500">
          Seu ID: <span className="font-mono text-xs">{currentUser?.uid}</span>
        </div>

        <button 
          onClick={logout} 
          className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  );
}