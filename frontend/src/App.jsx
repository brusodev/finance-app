import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {!isAuthenticated && <Navbar />}
      {isAuthenticated && <Sidebar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/report" element={<ProtectedRoute element={<Report />} />} />
        <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
        <Route path="/accounts" element={<ProtectedRoute element={<Accounts />} />} />
        <Route path="/categories" element={<ProtectedRoute element={<Categories />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<Settings />} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;