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
    // Update token state quando muda
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const isPublicRoute = location.pathname === '/login' || location.pathname === '/register';
  const isAuthenticated = !!token;

  return (
    <>
      {isPublicRoute && !isAuthenticated && <Navbar />}
      {!isPublicRoute && isAuthenticated && <Sidebar />}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </BrowserRouter>
  );
}

export default App;