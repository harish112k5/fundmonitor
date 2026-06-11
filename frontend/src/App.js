import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import ProjectFinanceDetail from './pages/ProjectFinanceDetail';
import Unauthorized from './pages/Unauthorized';
import MyProfile from './pages/MyProfile';

// Finance & Investor Pages
import Budgeting from './pages/Budgeting';
import FinancialDashboard from './pages/FinancialDashboard';
import FinancialForecast from './pages/FinancialForecast';
import FinancialPlanning from './pages/FinancialPlanning';
import FinancialRatios from './pages/FinancialRatios';
import FinancialStatements from './pages/FinancialStatements';
import FundTracking from './pages/FundTracking';
import InvestorDashboard from './pages/InvestorDashboard';
import InvestorOnboarding from './pages/InvestorOnboarding';
import TaxCompliance from './pages/TaxCompliance';

// Protected route wrapper — uses role_id integers
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

  // Role-based access by role_id
  if (roles && !roles.includes(user?.role_id)) {
    return <Navigate to="/unauthorized" replace />;
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
              {/* Everyone (all authenticated) */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/profile" element={<MyProfile />} />

              {/* Projects: Admin(1), Manager(2), Engineer(3), Supervisor(5), Viewer(6) */}
              <Route path="/projects" element={
                <ProtectedRoute roles={[1,2,3,5,6]}><Projects /></ProtectedRoute>
              } />
              <Route path="/projects/:id" element={
                <ProtectedRoute roles={[1,2,3,5,6]}><ProjectDetail /></ProtectedRoute>
              } />
              <Route path="/projects/:id/finance" element={
                <ProtectedRoute roles={[1,2,3]}><ProjectFinanceDetail /></ProtectedRoute>
              } />
              <Route path="/project-progress" element={
                <ProtectedRoute roles={[1,2,3]}><ProjectProgress /></ProtectedRoute>
              } />
              <Route path="/alerts" element={
                <ProtectedRoute roles={[1,2,3]}><AlertsPage /></ProtectedRoute>
              } />

              {/* Admin + Manager */}
              <Route path="/project-team" element={
                <ProtectedRoute roles={[1, 2]}><ProjectTeam /></ProtectedRoute>
              } />
              <Route path="/import" element={
                <ProtectedRoute roles={[1, 2]}><ImportProject /></ProtectedRoute>
              } />
              <Route path="/recycle-bin" element={
                <ProtectedRoute roles={[1, 2]}><RecycleBin /></ProtectedRoute>
              } />

              {/* Resources: Admin(1), Manager(2), Engineer(3) — master data */}
              <Route path="/materials" element={
                <ProtectedRoute roles={[1, 2, 3]}><Materials /></ProtectedRoute>
              } />
              <Route path="/machines" element={
                <ProtectedRoute roles={[1, 2, 3]}><Machines /></ProtectedRoute>
              } />
              <Route path="/workers" element={
                <ProtectedRoute roles={[1, 2, 3]}><Workers /></ProtectedRoute>
              } />

              {/* Usage: Admin(1), Manager(2), Engineer(3), Supervisor(5), Viewer(6) */}
              <Route path="/material-usage" element={
                <ProtectedRoute roles={[1,2,3,5,6]}><MaterialUsage /></ProtectedRoute>
              } />
              <Route path="/manpower-usage" element={
                <ProtectedRoute roles={[1,2,3,5,6]}><ManpowerUsage /></ProtectedRoute>
              } />
              <Route path="/machine-usage" element={
                <ProtectedRoute roles={[1,2,3,5,6]}><MachineUsage /></ProtectedRoute>
              } />

              {/* Finance: Admin(1), Manager(2) */}
              <Route path="/investors" element={
                <ProtectedRoute roles={[1, 2]}><Investors /></ProtectedRoute>
              } />
              <Route path="/financiers" element={
                <ProtectedRoute roles={[1, 2]}><Financiers /></ProtectedRoute>
              } />
              <Route path="/investments" element={
                <ProtectedRoute roles={[1, 2]}><Investments /></ProtectedRoute>
              } />
              <Route path="/loans" element={
                <ProtectedRoute roles={[1, 2]}><Loans /></ProtectedRoute>
              } />
              <Route path="/interest-payments" element={
                <ProtectedRoute roles={[1, 2]}><InterestPayments /></ProtectedRoute>
              } />

              {/* Accounting: Admin(1) + Accountant(4) */}
              <Route path="/expenses" element={
                <ProtectedRoute roles={[1, 4]}><Expenses /></ProtectedRoute>
              } />
              <Route path="/billing" element={
                <ProtectedRoute roles={[1, 4]}><Billing /></ProtectedRoute>
              } />
              <Route path="/budget-comparison" element={
                <ProtectedRoute roles={[1, 4]}><BudgetComparison /></ProtectedRoute>
              } />

              {/* Finance Module Pages: Admin(1), Manager(2) */}
              <Route path="/finance/budgeting" element={
                <ProtectedRoute roles={[1, 2]}><Budgeting /></ProtectedRoute>
              } />
              <Route path="/finance/dashboard" element={
                <ProtectedRoute roles={[1, 2]}><FinancialDashboard /></ProtectedRoute>
              } />
              <Route path="/finance/forecast" element={
                <ProtectedRoute roles={[1, 2]}><FinancialForecast /></ProtectedRoute>
              } />
              <Route path="/finance/planning" element={
                <ProtectedRoute roles={[1, 2]}><FinancialPlanning /></ProtectedRoute>
              } />
              <Route path="/finance/ratios" element={
                <ProtectedRoute roles={[1, 2]}><FinancialRatios /></ProtectedRoute>
              } />
              <Route path="/finance/statements" element={
                <ProtectedRoute roles={[1, 2]}><FinancialStatements /></ProtectedRoute>
              } />
              <Route path="/finance/tax" element={
                <ProtectedRoute roles={[1, 2]}><TaxCompliance /></ProtectedRoute>
              } />
              
              {/* Investor Module: Admin(1) only */}
              <Route path="/investor/dashboard" element={
                <ProtectedRoute roles={[1]}><InvestorDashboard /></ProtectedRoute>
              } />
              <Route path="/investor/onboarding" element={
                <ProtectedRoute roles={[1]}><InvestorOnboarding /></ProtectedRoute>
              } />
              <Route path="/investor/fund-tracking" element={
                <ProtectedRoute roles={[1]}><FundTracking /></ProtectedRoute>
              } />

              {/* Admin only */}
              <Route path="/users" element={
                <ProtectedRoute roles={[1]}><Users /></ProtectedRoute>
              } />
              <Route path="/audit-log" element={
                <ProtectedRoute roles={[1]}><AuditLog /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={[1]}><AdminPanel /></ProtectedRoute>
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
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif'
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;