import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  LogOut, Settings, TrendingUp, RefreshCw, LayoutDashboard, Users 
} from "lucide-react";

export function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Função para destacar a aba ativa
  const isActive = (path) => location.pathname === path 
    ? "text-blue-400 bg-gray-700/50 shadow-inner" 
    : "text-gray-400 hover:text-white hover:bg-gray-700/30";

  return (
    <header className="px-4 py-3 flex justify-between items-center bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-md">
      {/* Logo / Home */}
      <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
        <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
            <LayoutDashboard size={18} className="text-white" />
        </div>
        <h1 className="font-bold text-lg text-white tracking-tight hidden sm:block">Finance</h1>
      </button>

      {/* Navegação Central */}
      <nav className="flex gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-700/50 overflow-x-auto">
        <button 
            onClick={() => navigate("/")} 
            className={`p-2 rounded-lg transition-all ${isActive("/")}`} 
            title="Dashboard"
        >
            <LayoutDashboard size={20} />
        </button>
        
        <button 
            onClick={() => navigate("/subscriptions")} 
            className={`p-2 rounded-lg transition-all ${isActive("/subscriptions")}`} 
            title="Assinaturas"
        >
            <RefreshCw size={20} />
        </button>

        <button 
            onClick={() => navigate("/investments")} 
            className={`p-2 rounded-lg transition-all ${isActive("/investments")}`} 
            title="Investimentos"
        >
            <TrendingUp size={20} />
        </button>

        {/* NOVO BOTÃO DE PESSOAS */}
        <button 
            onClick={() => navigate("/people")} 
            className={`p-2 rounded-lg transition-all ${isActive("/people")}`} 
            title="Pessoas & Dívidas"
        >
            <Users size={20} />
        </button>

        <button 
            onClick={() => navigate("/categories")} 
            className={`p-2 rounded-lg transition-all ${isActive("/categories")}`} 
            title="Categorias"
        >
            <Settings size={20} />
        </button>
      </nav>

      {/* Logout */}
      <button 
        onClick={logout} 
        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        title="Sair"
      >
        <LogOut size={20} />
      </button>
    </header>
  );
}