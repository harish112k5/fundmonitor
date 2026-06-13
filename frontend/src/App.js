import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';

// Lazy loaded Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Projects = React.lazy(() => import('./pages/Projects'));
const Materials = React.lazy(() => import('./pages/Materials'));
const Machines = React.lazy(() => import('./pages/Machines'));
const Workers = React.lazy(() => import('./pages/Workers'));
const MaterialUsage = React.lazy(() => import('./pages/MaterialUsage'));
const ManpowerUsage = React.lazy(() => import('./pages/ManpowerUsage'));
const MachineUsage = React.lazy(() => import('./pages/MachineUsage'));
const Investors = React.lazy(() => import('./pages/Investors'));
const Financiers = React.lazy(() => import('./pages/Financiers'));
const Investments = React.lazy(() => import('./pages/Investments'));
const Loans = React.lazy(() => import('./pages/Loans'));
const InterestPayments = React.lazy(() => import('./pages/InterestPayments'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Billing = React.lazy(() => import('./pages/Billing'));
const ProjectProgress = React.lazy(() => import('./pages/ProjectProgress'));
const ProjectTeam = React.lazy(() => import('./pages/ProjectTeam'));
const Users = React.lazy(() => import('./pages/Users'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const AlertsPage = React.lazy(() => import('./pages/AlertsPage'));
const BudgetComparison = React.lazy(() => import('./pages/BudgetComparison'));
const ProjectDetail = React.lazy(() => import('./pages/ProjectDetail'));
const RecycleBin = React.lazy(() => import('./pages/RecycleBin'));
const ImportProject = React.lazy(() => import('./pages/ImportProject'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const ProjectFinanceDetail = React.lazy(() => import('./pages/ProjectFinanceDetail'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const MyProfile = React.lazy(() => import('./pages/MyProfile'));

// Finance & Investor Pages
const Budgeting = React.lazy(() => import('./pages/Budgeting'));
const FinancialDashboard = React.lazy(() => import('./pages/FinancialDashboard'));
const FinancialForecast = React.lazy(() => import('./pages/FinancialForecast'));
const FinancialPlanning = React.lazy(() => import('./pages/FinancialPlanning'));
const FinancialRatios = React.lazy(() => import('./pages/FinancialRatios'));
const FinancialStatements = React.lazy(() => import('./pages/FinancialStatements'));
const FundTracking = React.lazy(() => import('./pages/FundTracking'));
const InvestorDashboard = React.lazy(() => import('./pages/InvestorDashboard'));
const InvestorOnboarding = React.lazy(() => import('./pages/InvestorOnboarding'));
const TaxCompliance = React.lazy(() => import('./pages/TaxCompliance'));

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

const SuspenseLoader = () => (
  <div className="loading-spinner" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="spinner" />
  </div>
);

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

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
            <Suspense fallback={<SuspenseLoader />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
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

                  {/* Accounting: Admin(1), Manager(2), Engineer(3), Accountant(4), Viewer(6) */}
                  <Route path="/expenses" element={
                    <ProtectedRoute roles={[1, 2, 3, 4, 6]}><Expenses /></ProtectedRoute>
                  } />
                  <Route path="/billing" element={
                    <ProtectedRoute roles={[1, 2, 4]}><Billing /></ProtectedRoute>
                  } />
                  <Route path="/budget-comparison" element={
                    <ProtectedRoute roles={[1, 2, 4]}><BudgetComparison /></ProtectedRoute>
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
              </AnimatePresence>
            </Suspense>
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