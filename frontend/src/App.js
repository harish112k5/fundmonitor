import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Pages
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Machines from './pages/Machines';
import Workers from './pages/Workers';
import MaterialUsage from './pages/MaterialUsage';
import ManpowerUsage from './pages/ManpowerUsage';
import MachineUsage from './pages/MachineUsage';
import Investors from './pages/Investors';
import Financiers from './pages/Financiers';
import Investments from './pages/Investments';
import Loans from './pages/Loans';
import InterestPayments from './pages/InterestPayments';
import Expenses from './pages/Expenses';
import Billing from './pages/Billing';
import ProjectProgress from './pages/ProjectProgress';
import ProjectTeam from './pages/ProjectTeam';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import AlertsPage from './pages/AlertsPage';
import BudgetComparison from './pages/BudgetComparison';
import ProjectDetail from './pages/ProjectDetail';
import RecycleBin from './pages/RecycleBin';
import ImportProject from './pages/ImportProject';
import AdminPanel from './pages/AdminPanel';
import FinancialDashboard from './pages/FinancialDashboard';
import Budgeting from './pages/Budgeting';
import FinancialStatements from './pages/FinancialStatements';
import FinancialRatios from './pages/FinancialRatios';
// Protected route wrapper
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Role-based access
  if (roles && !roles.includes(user?.role_name)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="loading-spinner"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public — Login */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
      } />

      {/* Protected — All app routes */}
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              {/* Everyone */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/project-progress" element={<ProjectProgress />} />

              {/* Admin + Manager */}
              <Route path="/project-team" element={
                <ProtectedRoute roles={['admin', 'manager']}><ProjectTeam /></ProtectedRoute>
              } />

              {/* Admin + Manager + Engineer */}
              <Route path="/materials" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><Materials /></ProtectedRoute>
              } />
              <Route path="/machines" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><Machines /></ProtectedRoute>
              } />
              <Route path="/workers" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><Workers /></ProtectedRoute>
              } />
              <Route path="/material-usage" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><MaterialUsage /></ProtectedRoute>
              } />
              <Route path="/manpower-usage" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><ManpowerUsage /></ProtectedRoute>
              } />
              <Route path="/machine-usage" element={
                <ProtectedRoute roles={['admin', 'manager', 'engineer']}><MachineUsage /></ProtectedRoute>
              } />

              {/* Admin + Manager only */}
              <Route path="/investors" element={
                <ProtectedRoute roles={['admin', 'manager']}><Investors /></ProtectedRoute>
              } />
              <Route path="/financiers" element={
                <ProtectedRoute roles={['admin', 'manager']}><Financiers /></ProtectedRoute>
              } />
              <Route path="/investments" element={
                <ProtectedRoute roles={['admin', 'manager']}><Investments /></ProtectedRoute>
              } />
              <Route path="/loans" element={
                <ProtectedRoute roles={['admin', 'manager']}><Loans /></ProtectedRoute>
              } />
              <Route path="/interest-payments" element={
                <ProtectedRoute roles={['admin', 'manager']}><InterestPayments /></ProtectedRoute>
              } />
              <Route path="/expenses" element={
                <ProtectedRoute roles={['admin', 'manager']}><Expenses /></ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute roles={['admin', 'manager']}><Billing /></ProtectedRoute>
              } />
              <Route path="/budget-comparison" element={
                <ProtectedRoute roles={['admin', 'manager']}><BudgetComparison /></ProtectedRoute>
              } />
              <Route path="/recycle-bin" element={
                <ProtectedRoute roles={['admin', 'manager']}><RecycleBin /></ProtectedRoute>
              } />
              <Route path="/import" element={
                <ProtectedRoute roles={['admin', 'manager']}><ImportProject /></ProtectedRoute>
              } />
              <Route path="/finance-dashboard" element={
                <ProtectedRoute roles={['admin', 'manager']}><FinancialDashboard /></ProtectedRoute>
              } />
              <Route path="/finance-budgeting" element={
                <ProtectedRoute roles={['admin', 'manager']}><Budgeting /></ProtectedRoute>
              } />
              <Route path="/finance-statements" element={
                <ProtectedRoute roles={['admin', 'manager']}><FinancialStatements /></ProtectedRoute>
              } />
              <Route path="/finance-ratios" element={
                <ProtectedRoute roles={['admin', 'manager']}><FinancialRatios /></ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/users" element={
                <ProtectedRoute roles={['admin']}><Users /></ProtectedRoute>
              } />
              <Route path="/audit-log" element={
                <ProtectedRoute roles={['admin']}><AuditLog /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1e2e',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;