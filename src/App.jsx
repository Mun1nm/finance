import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CategoriesPage from "./pages/CategoriesPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage"; // Não esqueça de importar
import PeoplePage from "./pages/PeoplePage";
import Unauthorized from "./pages/Unauthorized";
import { Layout } from "./components/Layout"; // <--- Importe o Layout

function PrivateRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Carregando...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (userProfile && userProfile.isAuthorized !== true) {
    return <Unauthorized />;
  }

  // AQUI ESTÁ A MÁGICA:
  // Se passou por todas as verificações, renderiza o Layout com o conteúdo dentro
  return (
    <Layout>
      {children}
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Todas estas rotas agora terão Navbar automaticamente */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
          <Route path="/investments" element={<PrivateRoute><InvestmentsPage /></PrivateRoute>} />
          <Route path="/subscriptions" element={<PrivateRoute><SubscriptionsPage /></PrivateRoute>} />
          <Route path="/people" element={<PrivateRoute><PeoplePage /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}