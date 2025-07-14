import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4 text-white flex justify-between">
      <span>FinanceApp</span>
      <div>
        <Link to="/" className="mx-2">Dashboard</Link>
        <Link to="/report" className="mx-2">Relatórios</Link>
        <Link to="/login" className="mx-2">Login</Link>
        <Link to="/register" className="mx-2">Registrar</Link>
      </div>
    </nav>
  );
}