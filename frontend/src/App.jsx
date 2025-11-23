import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Settings from "./pages/Settings";
import { TransactionProvider } from "./context/TransactionContext";

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  const token = localStorage.getItem('token');
  return token ? element : <Navigate to="/login" />;
};

// Layout Component que renderiza Navbar/Sidebar baseado na autenticação
function AppLayout({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const location = useLocation();

  useEffect(() => {
    // Listener para mudanças no localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'token' || !e.key) {
        setToken(localStorage.getItem('token'));
      }
    };
    
    // Listener para quando o token é definido no mesmo tab
    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar periodicamente
    const interval = setInterval(() => {
      setToken(localStorage.getItem('token'));
    }, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';
  const isAuthenticated = !!token;

  return (
    <>
      {!isPublicRoute && isAuthenticated && <Sidebar />}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TransactionProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/report" element={<ProtectedRoute element={<Report />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
            <Route path="/accounts" element={<ProtectedRoute element={<Accounts />} />} />
            <Route path="/categories" element={<ProtectedRoute element={<Categories />} />} />
            <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
          </Routes>
        </AppLayout>
      </TransactionProvider>
    </BrowserRouter>
  );
}

export default App;