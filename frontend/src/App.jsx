import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { TransactionProvider } from "./context/TransactionContext";
import { ThemeProvider } from "./context/ThemeContext";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Report from "./pages/Report";
import Profile from "./pages/Profile";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Transactions from "./pages/Transactions";
import NewTransaction from "./pages/NewTransaction";
import Settings from "./pages/Settings";
import Transfers from "./pages/Transfers";
import Investments from "./pages/Investments";
import InvestmentAssets from "./pages/InvestmentAssets";
import InvestmentTransactions from "./pages/InvestmentTransactions";
import InvestmentGoal from "./pages/InvestmentGoal";
import CreditCards from "./pages/CreditCards";
import CreditCardImport from "./pages/CreditCardImport";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <TransactionProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              
              <Route path="/transacoes" element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/nova-transacao" element={
                <ProtectedRoute>
                  <Layout>
                    <NewTransaction />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/report" element={
                <ProtectedRoute>
                  <Layout>
                    <Report />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/accounts" element={
                <ProtectedRoute>
                  <Layout>
                    <Accounts />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/categories" element={
                <ProtectedRoute>
                  <Layout>
                    <Categories />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/settings" element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/transfers" element={
                <ProtectedRoute>
                  <Layout>
                    <Transfers />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/investimentos" element={
                <ProtectedRoute>
                  <Layout>
                    <Investments />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/investimentos/ativos" element={
                <ProtectedRoute>
                  <Layout>
                    <InvestmentAssets />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/investimentos/movimentacoes" element={
                <ProtectedRoute>
                  <Layout>
                    <InvestmentTransactions />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/investimentos/meta" element={
                <ProtectedRoute>
                  <Layout>
                    <InvestmentGoal />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/cartoes" element={
                <ProtectedRoute>
                  <Layout>
                    <CreditCards />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/cartoes/:accountId/importar" element={
                <ProtectedRoute>
                  <Layout>
                    <CreditCardImport />
                  </Layout>
                </ProtectedRoute>
              } />

              <Route path="/contas/:accountId/importar" element={
                <ProtectedRoute>
                  <Layout>
                    <CreditCardImport />
                  </Layout>
                </ProtectedRoute>
              } />

            </Routes>
          </TransactionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
