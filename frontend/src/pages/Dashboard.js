import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import AnimatedKPICard from '../components/AnimatedKPICard';
import { SkylineSVG } from '../components/CivilIcons';
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
import AccountantDashboard from './AccountantDashboard';
import SupervisorDashboard from './SupervisorDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role_id === 4) {
    return <AccountantDashboard />;
  }

  if (user?.role_id === 5) {
    return <SupervisorDashboard />;
  }

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [expensesError, setExpensesError] = useState(false);

  const [alertCount, setAlertCount] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsError, setAlertsError] = useState(false);

  const fetchData = () => {
    setStatsLoading(true); setStatsError(false);
    API.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));

    setProjectsLoading(true); setProjectsError(false);
    API.get('/projects')
      .then(res => setProjects(res.data))
      .catch(() => setProjectsError(true))
      .finally(() => setProjectsLoading(false));

    setExpensesLoading(true); setExpensesError(false);
    API.get('/expenses')
      .then(res => setExpenses(res.data))
      .catch(() => setExpensesError(true))
      .finally(() => setExpensesLoading(false));

    setAlertsLoading(true); setAlertsError(false);
    API.get('/dashboard/alerts')
      .then(res => setAlertCount(res.data.totalAlerts || 0))
      .catch(() => setAlertsError(true))
      .finally(() => setAlertsLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => {
    if (n == null || isNaN(n)) return 0;
    return Number(n);
  };

  const fmtCurrency = (n) => {
    if (n == null || isNaN(n)) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  };

  const netProfit = stats ? (stats.financial?.billed || 0) - (stats.costs?.total || 0) : 0;
  const isProfit = netProfit >= 0;

  const recentProjects = projects.slice(0, 3);
  const recentExpenses = expenses.slice(0, 5);

  const isEngineer = user?.role_id === 3;
  const isViewer = user?.role_id === 4;
  const noAccess = (isEngineer || isViewer) && stats?.projects?.total_projects === 0;

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PageWrapper>
      {noAccess ? (
        <AnimatedItem delay={0} style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>No Projects Assigned Yet</h3>
          <p>Your admin will assign you to a project shortly. Check back soon.</p>
          <button onClick={fetchData} className="btn-premium" style={{ margin: '24px auto 0' }}>
            <HiOutlineRefresh size={16} /> Refresh
          </button>
        </AnimatedItem>
      ) : (
        <>
          {/* HERO BANNER */}
          <AnimatedItem delay={0}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid #F59E0B',
              borderRadius: '8px',
              padding: '20px 24px',
              marginBottom: '28px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '80px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{ zIndex: 1 }}>
                <h1 style={{
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  margin: 0
                }}>
                  SITE COMMAND CENTER
                </h1>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginTop: '4px'
                }}>
                  {greeting}, {user?.name || 'User'} — {stats?.projects?.total_projects || 0} active projects
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
                <div style={{ 
                  fontFamily: "'Roboto Mono', monospace", 
                  fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' 
                }}>
                  {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  <br />
                  {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {!alertsLoading && !alertsError && alertCount > 0 && (
                  <Link to="/alerts" style={{ textDecoration: 'none' }}>
                    <button style={{
                      backgroundColor: 'rgba(220, 38, 38, 0.12)',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      color: '#DC2626', borderRadius: '6px',
                      padding: '8px 14px', cursor: 'pointer', fontSize: '12px',
                      fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                      fontFamily: "'Inter', sans-serif"
                    }}>
                      <HiOutlineExclamationCircle size={16} /> {alertCount} Alert{alertCount !== 1 ? 's' : ''}
                    </button>
                  </Link>
                )}
                <button
                  onClick={fetchData}
                  style={{
                    background: 'transparent', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', borderRadius: '6px',
                    width: '36px', height: '36px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                >
                  <HiOutlineRefresh size={16} />
                </button>
              </div>
              {/* Skyline illustration */}
              <div style={{ 
                position: 'absolute', bottom: 0, right: 0, 
                opacity: 0.15, pointerEvents: 'none'
              }}>
                <SkylineSVG width={400} height={70} />
              </div>
            </div>
          </AnimatedItem>

          {/* PRIMARY METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '18px 20px', minHeight: '100px' }}>
                  <div style={{ width: '60%', height: '10px', background: 'var(--border-subtle)', borderRadius: '2px', marginBottom: '12px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                  <div style={{ width: '40%', height: '24px', background: 'var(--border-subtle)', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                </div>
              ))
            ) : (
              <>
                <AnimatedKPICard index={0} icon={<HiOutlineOfficeBuilding size={24} />} color="#F59E0B" label="TOTAL PROJECTS" value={stats?.projects?.total_projects || 0} subtitle={`${stats?.projects?.ongoing || 0} ongoing · ${stats?.projects?.completed || 0} completed`} onClick={() => navigate('/projects')} />
                <AnimatedKPICard index={1} icon={<HiOutlineUsers size={24} />} color="var(--text-secondary)" label="ACTIVE WORKERS" value={stats?.workers?.active_workers || 0} subtitle={`of ${stats?.workers?.total_workers || 0} total workers`} onClick={() => navigate('/workers')} />
                <AnimatedKPICard index={2} icon={<HiOutlineTruck size={24} />} color="#0284C7" label="MACHINES" value={stats?.machines?.total_machines || 0} subtitle={`${stats?.machines?.available || 0} available · ${stats?.machines?.in_use || 0} in use`} onClick={() => navigate('/machines')} />
                <AnimatedKPICard index={3} icon={<HiOutlineCurrencyDollar size={24} />} color="#F59E0B" label="TOTAL BUDGET" value={fmt(stats?.projects?.total_budget)} isMoney={true} subtitle="Across all projects" onClick={() => navigate('/projects')} />
              </>
            )}
          </div>

          {/* FINANCIAL METRICS (Admin & Manager only) */}
          {(user?.role_id === 1 || user?.role_id === 2) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '18px 20px', minHeight: '100px' }}>
                    <div style={{ width: '60%', height: '10px', background: 'var(--border-subtle)', borderRadius: '2px', marginBottom: '12px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width: '40%', height: '24px', background: 'var(--border-subtle)', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                  </div>
                ))
              ) : (
                <>
                  <AnimatedKPICard index={4} icon={<HiOutlineChartBar size={24} />} color="#DC2626" label="ACTUAL COST" value={fmt(stats?.costs?.total)} isMoney={true} subtitle="Total spending" onClick={() => navigate('/expenses')} />
                  <AnimatedKPICard index={5} icon={<HiOutlineDocumentText size={24} />} color="#16A34A" label="BILLED (REVENUE)" value={fmt(stats?.financial?.billed)} isMoney={true} subtitle={`${fmtCurrency(stats?.financial?.paid)} paid`} onClick={() => navigate('/billing')} />
                  <AnimatedKPICard index={6} icon={isProfit ? <HiOutlineTrendingUp size={24} /> : <HiOutlineTrendingDown size={24} />} color={isProfit ? '#16A34A' : '#DC2626'} label="NET PROFIT / LOSS" value={Math.abs(netProfit)} isMoney={true} prefix={isProfit ? '+' : '-'} subtitle="Revenue − Actual Cost" onClick={() => navigate('/billing')} />
                  <AnimatedKPICard index={7} icon={<HiOutlineCash size={24} />} color="#F59E0B" label="TOTAL INVESTMENTS" value={fmt(stats?.financial?.investments)} isMoney={true} subtitle="From all investors" onClick={() => navigate('/investments')} />
                </>
              )}
            </div>
          )}

          {/* RESOURCE COST BREAKDOWN (Admin, Manager, Engineer only) */}
          {(user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '28px' }}>
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '18px 20px', minHeight: '100px' }}>
                    <div style={{ width: '60%', height: '10px', background: 'var(--border-subtle)', borderRadius: '2px', marginBottom: '12px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                    <div style={{ width: '40%', height: '24px', background: 'var(--border-subtle)', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                  </div>
                ))
              ) : (
                <>
                  <AnimatedKPICard index={8} icon={<HiOutlineCube size={24} />} color="#F59E0B" label="MATERIAL COST" value={fmt(stats?.costs?.material)} isMoney={true} subtitle="Raw materials used" onClick={() => navigate('/materials')} />
                  <AnimatedKPICard index={9} icon={<HiOutlineUsers size={24} />} color="var(--text-secondary)" label="MANPOWER COST" value={fmt(stats?.costs?.manpower)} isMoney={true} subtitle="Labour wages total" onClick={() => navigate('/workers')} />
                  <AnimatedKPICard index={10} icon={<HiOutlineCog size={24} />} color="#0284C7" label="MACHINE COST" value={fmt(stats?.costs?.machine)} isMoney={true} subtitle="Equipment usage cost" onClick={() => navigate('/machines')} />
                </>
              )}
            </div>
          )}

          {/* RECENT ACTIVITY */}
          <AnimatedItem delay={0.2}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Recent Projects */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '3px', height: '16px', background: '#F59E0B', borderRadius: '1px', display: 'inline-block' }} />
                    RECENT SITES
                  </h3>
                  <Link to="/projects" style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <HiOutlineArrowRight />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {projectsLoading ? (
                    [1,2,3].map(i => (
                      <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                        <div style={{ width: '40%', height: '14px', background: 'var(--border-subtle)', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                      </div>
                    ))
                  ) : projectsError ? (
                    <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>Failed to load</p>
                  ) : recentProjects.length > 0 ? (
                    recentProjects.map((p, i) => (
                      <div
                        key={p.project_id}
                        onClick={() => navigate('/projects')}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid transparent',
                          borderRadius: '6px', cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          animation: `pageEnter 0.3s ease ${i * 0.08}s both`
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.05)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{p.project_name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.location || 'No Location'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className={`badge badge-${p.status}`}>{p.status?.replace('_', ' ')}</span>
                          <span style={{ fontFamily: "'Roboto Mono', monospace", fontWeight: '500', fontSize: '13px', color: 'var(--text-primary)' }}>
                            {fmtCurrency(p.estimated_budget)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No recent projects</p>
                  )}
                </div>
              </div>

              {/* Recent Expenses */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: "'Oswald', sans-serif", fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '3px', height: '16px', background: '#F59E0B', borderRadius: '1px', display: 'inline-block' }} />
                    RECENT EXPENDITURE
                  </h3>
                  <Link to="/expenses" style={{ fontSize: '13px', color: '#F59E0B', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View All <HiOutlineArrowRight />
                  </Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {expensesLoading ? (
                    [1,2,3,4,5].map(i => (
                      <div key={i} style={{ padding: '12px 14px', background: 'var(--bg-card)', borderRadius: '6px' }}>
                        <div style={{ width: '50%', height: '14px', background: 'var(--border-subtle)', borderRadius: '2px', animation: 'sitePulse 1.5s ease-in-out infinite' }} />
                      </div>
                    ))
                  ) : expensesError ? (
                    <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>Failed to load</p>
                  ) : recentExpenses.length > 0 ? (
                    recentExpenses.map((e, i) => (
                      <div
                        key={e.expense_id}
                        onClick={() => navigate('/expenses')}
                        style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid transparent',
                          borderRadius: '6px', cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          animation: `pageEnter 0.3s ease ${i * 0.08}s both`
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.05)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'transparent'; }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="badge badge-pending" style={{ margin: 0 }}>{e.category_name || 'Expense'}</span>
                            <span style={{ fontWeight: '500', fontSize: '13px', color: '#D6D3CE' }}>
                              {e.description ? (e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description) : 'No description'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Project: {e.project_name} · {e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </div>
                        </div>
                        <span style={{ fontFamily: "'Roboto Mono', monospace", fontWeight: '500', fontSize: '13px', color: '#DC2626' }}>
                          {fmtCurrency(e.amount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No recent expenses</p>
                  )}
                </div>
              </div>
            </div>
          </AnimatedItem>

          <style>{`
            @media (max-width: 768px) {
              .recent-activity-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </>
      )}
    </PageWrapper>
  );
}
