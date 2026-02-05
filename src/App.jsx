import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CategoriesPage from "./pages/CategoriesPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import Unauthorized from "./pages/Unauthorized";
import SubscriptionsPage from "./pages/SubscriptionsPage";

function PrivateRoute({ children }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Carregando...</div>;

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Verifica se o perfil carregou e se está autorizado
  if (userProfile && userProfile.isAuthorized !== true) {
    return <Unauthorized />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
          <Route path="/investments" element={<PrivateRoute><InvestmentsPage /></PrivateRoute>} />
          <Route path="/subscriptions" element={<PrivateRoute><SubscriptionsPage /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}