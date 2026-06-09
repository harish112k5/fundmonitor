import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineCube,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCog
} from 'react-icons/hi';

// Helper component for KPI metric cards
function MetricCard({
  icon: Icon,
  iconColor = '#7c3aed',
  label,
  value,
  subText,
  borderColorClass,
  navigateTo,
  loading,
  error
}) {
  const navigate = useNavigate();
  return (
    <div
      className={`redesign-card ${borderColorClass}`}
      onClick={() => navigate(navigateTo)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-header-row">
        <h3 className="card-label-text">{label}</h3>
        {Icon && (
          <div className="card-icon-container" style={{ color: iconColor }}>
            <Icon />
          </div>
        )}
      </div>
      {loading ? (
        <div className="skeleton-pulse" />
      ) : error ? (
        <div className="card-value-text">—</div>
      ) : (
        <div className="card-value-text">{value}</div>
      )}
      <div className={`card-sub-text ${error ? 'error-text' : ''}`}>
        {error ? 'Failed to load' : subText}
      </div>
      <div className="card-arrow-indicator">
        <HiOutlineArrowRight />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for metrics stats
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  // State for projects
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);

  // State for expenses
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState(false);

  // State for alerts count
  const [alertCount, setAlertCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(false);

  const fetchData = () => {
    // 1. Fetch dashboard stats
    setStatsLoading(true);
    setStatsError(false);
    API.get('/dashboard/stats')
      .then(res => {
        setStats(res.data);
      })
      .catch(err => {
        console.error('Error loading stats:', err);
        setStatsError(true);
      })
      .finally(() => setStatsLoading(false));

    // 2. Fetch projects
    setProjectsLoading(true);
    setProjectsError(false);
    API.get('/projects')
      .then(res => {
        setProjects(res.data);
      })
      .catch(err => {
        console.error('Error loading projects:', err);
        setProjectsError(true);
      })
      .finally(() => setProjectsLoading(false));

    // 3. Fetch expenses
    setExpensesLoading(true);
    setExpensesError(false);
    API.get('/expenses')
      .then(res => {
        setExpenses(res.data);
      })
      .catch(err => {
        console.error('Error loading expenses:', err);
        setExpensesError(true);
      })
      .finally(() => setExpensesLoading(false));

    // 4. Fetch alerts
    setAlertsLoading(true);
    setAlertsError(false);
    API.get('/dashboard/alerts')
      .then(res => {
        setAlertCount(res.data.totalAlerts || 0);
      })
      .catch(err => {
        console.error('Error loading alerts:', err);
        setAlertsError(true);
      })
      .finally(() => setAlertsLoading(false));
  };

  useEffect(() => {
    fetchData();

    // No hardcoded body background — theme CSS handles it
  }, []);

  const fmt = (n) => {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(n);
  };

  // Calculate Net Profit / Loss
  const netProfit = stats ? (stats.financial?.billed || 0) - (stats.costs?.total || 0) : 0;
  const isProfit = netProfit >= 0;

  // Sliced data for recent activities
  const recentProjects = projects.slice(0, 3);
  const recentExpenses = expenses.slice(0, 5);

  const isEngineer = user?.role_id === 3;
  const noAccess = isEngineer && stats?.projects?.total_projects === 0;

  return (
    <div className="animate-in">
      {noAccess ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Projects Assigned Yet</h3>
          <p>Your admin will assign you to a project shortly. Check back soon.</p>
          <button
            onClick={fetchData}
            className="refresh-btn"
            style={{ margin: '24px auto 0' }}
            title="Refresh Data"
          >
            <HiOutlineRefresh size={18} /> Refresh
          </button>
        </div>
      ) : (
        <>
      {/* Scope styles specifically for the redesigned dashboard */}
      <style>{`
        /* Container layouts */
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .dashboard-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 28px;
        }
        @media (max-width: 1024px) {
          .dashboard-grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .dashboard-grid-3 {
            grid-template-columns: 1fr;
          }
        }

        /* Solid styling for the redesigned cards */
        .redesign-card {
          background: var(--glass-bg) !important;
          border: var(--glass-border) !important;
          border-radius: 12px !important;
          padding: 20px 24px !important;
          transition: all 0.2s ease !important;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }

        .redesign-card:hover {
          background: var(--bg-card-hover) !important;
          border-color: var(--accent-start) !important;
          transform: translateY(-2px);
        }

        /* Left border accents */
        .border-accent-purple { border-left: 3px solid #7c3aed !important; }
        .border-accent-green  { border-left: 3px solid #10b981 !important; }
        .border-accent-blue   { border-left: 3px solid #3b82f6 !important; }
        .border-accent-orange { border-left: 3px solid #f59e0b !important; }
        .border-accent-red    { border-left: 3px solid #ef4444 !important; }
        .border-accent-violet { border-left: 3px solid #8b5cf6 !important; }

        /* Card sub-elements */
        .card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .card-label-text {
          font-size: 12px !important;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted) !important;
          margin: 0;
        }

        .card-icon-container {
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-value-text {
          font-size: 28px !important;
          font-weight: 700 !important;
          color: var(--text-primary) !important;
          margin: 4px 0 !important;
          line-height: 1.2;
        }

        .card-sub-text {
          font-size: 13px !important;
          color: var(--text-secondary) !important;
          margin-top: 4px;
        }

        .card-sub-text.error-text {
          color: #ef4444 !important;
        }

        .card-arrow-indicator {
          position: absolute;
          bottom: 12px;
          right: 16px;
          color: var(--text-muted);
          font-size: 14px;
          transition: transform 0.2s ease, color 0.2s ease;
          opacity: 0.7;
        }

        .redesign-card:hover .card-arrow-indicator {
          transform: translateX(3px);
          color: var(--accent-start);
          opacity: 1;
        }

        /* Pulse animation skeleton loader */
        .skeleton-pulse {
          width: 60%;
          height: 28px;
          background-color: var(--border-subtle);
          border-radius: 4px;
          animation: pulse 1.5s infinite ease-in-out;
          margin: 6px 0;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }

        /* Header layout rules */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .page-header-left h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.02em;
          margin: 0;
        }

        .page-header-left p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 4px;
          margin-bottom: 0;
        }

        .dashboard-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .refresh-btn {
          background: var(--glass-bg);
          border: var(--glass-border);
          color: var(--text-primary);
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent-start);
          color: var(--accent-start);
        }

        .alerts-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          height: 38px;
        }

        .alerts-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: #ef4444;
        }

        /* Recent Activity Columns styling */
        .recent-activity-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 768px) {
          .recent-activity-container {
            grid-template-columns: 1fr;
          }
        }

        .activity-card {
          background: var(--glass-bg) !important;
          border: var(--glass-border) !important;
          border-radius: 12px !important;
          padding: 24px !important;
          backdrop-filter: none !important;
          box-shadow: none !important;
        }

        .activity-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .activity-title {
          font-size: 16px !important;
          font-weight: 600 !important;
          color: var(--text-primary) !important;
          margin: 0 !important;
        }

        .activity-view-all-link {
          font-size: 13px;
          color: #7c3aed;
          font-weight: 500;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s ease;
        }

        .activity-view-all-link:hover {
          color: #8b5cf6;
        }

        .activity-rows-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .activity-row-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .activity-row-item:hover {
          background: var(--bg-card-hover);
          border-color: var(--accent-start);
          transform: translateY(-1px);
        }

        .activity-row-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .activity-row-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .activity-row-subtext {
          font-size: 12px;
          color: var(--text-secondary);
        }

        .activity-row-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .activity-row-amount {
          font-weight: 600;
          font-size: 14px;
          color: #ef4444;
        }

        .activity-row-budget {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }
      `}</style>

      {/* SECTION 1 — Header Row */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Welcome, {user?.name || 'User'} 👋</h1>
          <p>Overview of your construction projects</p>
        </div>
        <div className="dashboard-header-right">
          <button
            onClick={fetchData}
            className="refresh-btn"
            title="Refresh Data"
          >
            <HiOutlineRefresh size={18} />
          </button>
          {!alertsLoading && !alertsError && alertCount > 0 && (
            <Link to="/alerts" className="alerts-btn">
              <HiOutlineExclamationCircle size={18} /> {alertCount} Alert{alertCount !== 1 ? 's' : ''}
            </Link>
          )}
        </div>
      </div>

      {/* SECTION 2 — PRIMARY METRICS */}
      <div className="dashboard-grid">
        <MetricCard
          icon={HiOutlineOfficeBuilding}
          iconColor="#7c3aed"
          label="TOTAL PROJECTS"
          value={stats?.projects?.total_projects || 0}
          subText={`${stats?.projects?.ongoing || 0} ongoing · ${stats?.projects?.completed || 0} completed`}
          borderColorClass="border-accent-purple"
          navigateTo="/projects"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineUsers}
          iconColor="#10b981"
          label="ACTIVE WORKERS"
          value={stats?.workers?.active_workers || 0}
          subText={`of ${stats?.workers?.total_workers || 0} total workers`}
          borderColorClass="border-accent-green"
          navigateTo="/workers"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineTruck}
          iconColor="#3b82f6"
          label="MACHINES"
          value={stats?.machines?.total_machines || 0}
          subText={`${stats?.machines?.available || 0} available · ${stats?.machines?.in_use || 0} in use`}
          borderColorClass="border-accent-blue"
          navigateTo="/machines"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineCurrencyDollar}
          iconColor="#f59e0b"
          label="TOTAL BUDGET"
          value={fmt(stats?.projects?.total_budget)}
          subText="Across all projects"
          borderColorClass="border-accent-orange"
          navigateTo="/projects"
          loading={statsLoading}
          error={statsError}
        />
      </div>

      {/* SECTION 3 — FINANCIAL METRICS */}
      <div className="dashboard-grid">
        <MetricCard
          icon={HiOutlineChartBar}
          iconColor="#ef4444"
          label="ACTUAL COST"
          value={fmt(stats?.costs?.total)}
          subText="Total spending across all projects"
          borderColorClass="border-accent-red"
          navigateTo="/expenses"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineDocumentText}
          iconColor="#10b981"
          label="BILLED (REVENUE)"
          value={fmt(stats?.financial?.billed)}
          subText={`${fmt(stats?.financial?.paid)} paid · ${fmt((stats?.financial?.billed || 0) - (stats?.financial?.paid || 0))} pending`}
          borderColorClass="border-accent-green"
          navigateTo="/billing"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={isProfit ? HiOutlineTrendingUp : HiOutlineTrendingDown}
          iconColor={isProfit ? '#10b981' : '#ef4444'}
          label="NET PROFIT / LOSS"
          value={(isProfit ? '+' : '') + fmt(netProfit)}
          subText="Revenue − Actual Cost"
          borderColorClass={isProfit ? 'border-accent-green' : 'border-accent-red'}
          navigateTo="/billing"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineCash}
          iconColor="#8b5cf6"
          label="TOTAL INVESTMENTS"
          value={fmt(stats?.financial?.investments)}
          subText="From all investors"
          borderColorClass="border-accent-violet"
          navigateTo="/investments"
          loading={statsLoading}
          error={statsError}
        />
      </div>

      {/* SECTION 4 — RESOURCE COST BREAKDOWN */}
      <div className="dashboard-grid-3">
        <MetricCard
          icon={HiOutlineCube}
          iconColor="#7c3aed"
          label="MATERIAL COST"
          value={fmt(stats?.costs?.material)}
          subText="Raw materials used"
          borderColorClass="border-accent-purple"
          navigateTo="/materials"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineUsers}
          iconColor="#10b981"
          label="MANPOWER COST"
          value={fmt(stats?.costs?.manpower)}
          subText="Labour wages total"
          borderColorClass="border-accent-green"
          navigateTo="/workers"
          loading={statsLoading}
          error={statsError}
        />

        <MetricCard
          icon={HiOutlineCog}
          iconColor="#3b82f6"
          label="MACHINE COST"
          value={fmt(stats?.costs?.machine)}
          subText="Equipment usage cost"
          borderColorClass="border-accent-blue"
          navigateTo="/machines"
          loading={statsLoading}
          error={statsError}
        />
      </div>

      {/* SECTION 5 — RECENT ACTIVITY */}
      <div className="recent-activity-container">
        {/* Recent Projects */}
        <div className="activity-card card">
          <div className="activity-title-row">
            <h3 className="activity-title">Recent Projects</h3>
            <Link to="/projects" className="activity-view-all-link">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="activity-rows-list">
            {projectsLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="activity-row-item" style={{ cursor: 'default' }}>
                  <div className="skeleton-pulse" style={{ width: '40%', height: '16px' }} />
                  <div className="skeleton-pulse" style={{ width: '20%', height: '16px' }} />
                </div>
              ))
            ) : projectsError ? (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>Failed to load recent projects.</p>
            ) : recentProjects.length > 0 ? (
              recentProjects.map(p => (
                <div
                  key={p.project_id}
                  className="activity-row-item"
                  onClick={() => navigate('/projects')}
                >
                  <div className="activity-row-left">
                    <span className="activity-row-name">{p.project_name}</span>
                    <span className="activity-row-subtext">
                      {p.location || 'No Location'}
                    </span>
                  </div>
                  <div className="activity-row-right">
                    <span className={`badge badge-${p.status}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                    <span className="activity-row-budget">
                      {fmt(p.estimated_budget)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No recent projects</p>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="activity-card card">
          <div className="activity-title-row">
            <h3 className="activity-title">Recent Expenses</h3>
            <Link to="/expenses" className="activity-view-all-link">
              View All <HiOutlineArrowRight />
            </Link>
          </div>

          <div className="activity-rows-list">
            {expensesLoading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className="activity-row-item" style={{ cursor: 'default' }}>
                  <div className="skeleton-pulse" style={{ width: '50%', height: '16px' }} />
                  <div className="skeleton-pulse" style={{ width: '15%', height: '16px' }} />
                </div>
              ))
            ) : expensesError ? (
              <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: 0 }}>Failed to load recent expenses.</p>
            ) : recentExpenses.length > 0 ? (
              recentExpenses.map(e => (
                <div
                  key={e.expense_id}
                  className="activity-row-item"
                  onClick={() => navigate('/expenses')}
                >
                  <div className="activity-row-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-draft" style={{ margin: 0 }}>
                        {e.category_name}
                      </span>
                      <span className="activity-row-name" style={{ fontWeight: 500, fontSize: '13px' }}>
                        {e.description ? (e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description) : 'No description'}
                      </span>
                    </div>
                    <span className="activity-row-subtext">
                      Project: {e.project_name} · {e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="activity-row-right">
                    <span className="activity-row-amount">
                      {fmt(e.amount)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>No recent expenses</p>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

