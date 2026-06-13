import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import AnimatedKPICard from '../components/AnimatedKPICard';
import SkeletonCard, { SkeletonKPI } from '../components/SkeletonCard';
import { SkylineSVG } from '../components/CivilIcons';
import { motion } from 'framer-motion';
import {
  HiOutlineOfficeBuilding,
  HiOutlineUsers,
  HiOutlineTruck,
  HiOutlineCurrencyDollar,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineArrowRight,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCog,
  HiOutlineCube
} from 'react-icons/hi';
import AccountantDashboard from './AccountantDashboard';
import SupervisorDashboard from './SupervisorDashboard';

function DashboardContent() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      .then(res => setStats(res.data || res))
      .catch(() => setStatsError(true))
      .finally(() => setStatsLoading(false));

    setProjectsLoading(true); setProjectsError(false);
    API.get('/projects')
      .then(res => setProjects(res.data || res || []))
      .catch(() => setProjectsError(true))
      .finally(() => setProjectsLoading(false));

    setExpensesLoading(true); setExpensesError(false);
    API.get('/expenses')
      .then(res => setExpenses(res.data || res || []))
      .catch(() => setExpensesError(true))
      .finally(() => setExpensesLoading(false));

    setAlertsLoading(true); setAlertsError(false);
    API.get('/dashboard/alerts')
      .then(res => setAlertCount((res.data || res).totalAlerts || 0))
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

  const netProfit = useMemo(() => stats ? (stats.financial?.billed || 0) - (stats.costs?.total || 0) : 0, [stats]);
  const isProfit = useMemo(() => netProfit >= 0, [netProfit]);

  const recentProjects = useMemo(() => projects.slice ? projects.slice(0, 3) : [], [projects]);
  const recentExpenses = useMemo(() => expenses.slice ? expenses.slice(0, 5) : [], [expenses]);

  const isEngineer = useMemo(() => user?.role_id === 3, [user]);
  const isViewer = useMemo(() => user?.role_id === 4, [user]);
  const noAccess = useMemo(() => (isEngineer || isViewer) && stats?.projects?.total_projects === 0, [isEngineer, isViewer, stats]);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <PageWrapper>
      {noAccess ? (
        <AnimatedItem delayIndex={0}>
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }} className="animate-float">🏗️</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              No Projects Assigned Yet
            </h3>
            <p>Your admin will assign you to a project shortly. Check back soon.</p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData} 
              className="btn-premium" 
              style={{ margin: '24px auto 0' }}
            >
              <HiOutlineRefresh size={16} /> Refresh
            </motion.button>
          </div>
        </AnimatedItem>
      ) : (
        <>
          {/* HERO BANNER */}
          <AnimatedItem delayIndex={0}>
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--accent)',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '88px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ zIndex: 1 }}>
                <h1 className="text-gradient" style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '28px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  margin: 0
                }}>
                  SITE COMMAND CENTER
                </h1>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginTop: '6px',
                  letterSpacing: '0.5px'
                }}>
                  {greeting}, <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.name || 'User'}</span> — {stats?.projects?.total_projects || 0} active projects
                </p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
                <div style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '12px', color: 'var(--text-muted)', textAlign: 'right' 
                }}>
                  {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  <br />
                  <span style={{ color: 'var(--accent)' }}>
                    {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {!alertsLoading && !alertsError && alertCount > 0 && (
                  <Link to="/alerts" style={{ textDecoration: 'none' }}>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="animate-pulse-glow"
                      style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444', 
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 16px', cursor: 'pointer', fontSize: '12px',
                        fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      <HiOutlineExclamationCircle size={16} /> {alertCount} Alert{alertCount !== 1 ? 's' : ''}
                    </motion.button>
                  </Link>
                )}
                <motion.button
                  whileHover={{ rotate: 180, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={fetchData}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)',
                    width: '36px', height: '36px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <HiOutlineRefresh size={16} />
                </motion.button>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
            {statsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
            ) : (
              <>
                <AnimatedKPICard index={0} icon={HiOutlineOfficeBuilding} accentColor="#F59E0B" label="TOTAL PROJECTS" value={stats?.projects?.total_projects || 0} subtitle={`${stats?.projects?.ongoing || 0} ongoing · ${stats?.projects?.completed || 0} completed`} onClick={() => navigate('/projects')} />
                <AnimatedKPICard index={1} icon={HiOutlineUsers} accentColor="#9CA3AF" label="ACTIVE WORKERS" value={stats?.workers?.active_workers || 0} subtitle={`of ${stats?.workers?.total_workers || 0} total workers`} onClick={() => navigate('/workers')} />
                <AnimatedKPICard index={2} icon={HiOutlineTruck} accentColor="#3B82F6" label="MACHINES" value={stats?.machines?.total_machines || 0} subtitle={`${stats?.machines?.available || 0} available · ${stats?.machines?.in_use || 0} in use`} onClick={() => navigate('/machines')} />
                <AnimatedKPICard index={3} icon={HiOutlineCurrencyDollar} accentColor="#F59E0B" label="TOTAL BUDGET" value={fmt(stats?.projects?.total_budget)} isMoney={true} subtitle="Across all projects" onClick={() => navigate('/projects')} />
              </>
            )}
          </div>

          {/* FINANCIAL METRICS (Admin & Manager only) */}
          {(user?.role_id === 1 || user?.role_id === 2) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {statsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonKPI key={i} />)
              ) : (
                <>
                  <AnimatedKPICard index={4} icon={HiOutlineChartBar} accentColor="#EF4444" label="ACTUAL COST" value={fmt(stats?.costs?.total)} isMoney={true} subtitle="Total spending" onClick={() => navigate('/expenses')} />
                  <AnimatedKPICard index={5} icon={HiOutlineDocumentText} accentColor="#10B981" label="BILLED (REVENUE)" value={fmt(stats?.financial?.billed)} isMoney={true} subtitle={`${fmtCurrency(stats?.financial?.paid)} paid`} onClick={() => navigate('/billing')} />
                  <AnimatedKPICard index={6} icon={isProfit ? HiOutlineTrendingUp : HiOutlineTrendingDown} accentColor={isProfit ? '#10B981' : '#EF4444'} label="NET PROFIT / LOSS" value={Math.abs(netProfit)} isMoney={true} subtitle="Revenue − Actual Cost" onClick={() => navigate('/billing')} />
                  <AnimatedKPICard index={7} icon={HiOutlineCash} accentColor="#F59E0B" label="TOTAL INVESTMENTS" value={fmt(stats?.financial?.investments)} isMoney={true} subtitle="From all investors" onClick={() => navigate('/investments')} />
                </>
              )}
            </div>
          )}

          {/* RESOURCE COST BREAKDOWN (Admin, Manager, Engineer only) */}
          {(user?.role_id === 1 || user?.role_id === 2 || user?.role_id === 3) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {statsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonKPI key={i} />)
              ) : (
                <>
                  <AnimatedKPICard index={8} icon={HiOutlineCube} accentColor="#F59E0B" label="MATERIAL COST" value={fmt(stats?.costs?.material)} isMoney={true} subtitle="Raw materials used" onClick={() => navigate('/materials')} />
                  <AnimatedKPICard index={9} icon={HiOutlineUsers} accentColor="#9CA3AF" label="MANPOWER COST" value={fmt(stats?.costs?.manpower)} isMoney={true} subtitle="Labour wages total" onClick={() => navigate('/workers')} />
                  <AnimatedKPICard index={10} icon={HiOutlineCog} accentColor="#3B82F6" label="MACHINE COST" value={fmt(stats?.costs?.machine)} isMoney={true} subtitle="Equipment usage cost" onClick={() => navigate('/machines')} />
                </>
              )}
            </div>
          )}

          {/* RECENT ACTIVITY */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Recent Projects */}
            <AnimatedItem delayIndex={3} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '4px', height: '18px', background: 'var(--accent)', borderRadius: '2px', display: 'inline-block' }} />
                  RECENT SITES
                </h3>
                <Link to="/projects" style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <HiOutlineArrowRight />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {projectsLoading ? (
                  [1,2,3].map(i => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                      <div className="animate-shimmer" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
                    </div>
                  ))
                ) : projectsError ? (
                  <p style={{ color: '#EF4444', fontSize: '13px', margin: 0, fontFamily: 'var(--font-body)' }}>Failed to load projects</p>
                ) : recentProjects.length > 0 ? (
                  recentProjects.map((p, i) => (
                    <motion.div
                      key={p.project_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(245,158,11,0.08)', x: 4 }}
                      onClick={() => navigate('/projects')}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>{p.project_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>{p.location || 'No Location'}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          backgroundColor: p.status === 'Ongoing' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                          color: p.status === 'Ongoing' ? '#3B82F6' : '#10B981',
                          border: `1px solid ${p.status === 'Ongoing' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)'}`,
                          padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase'
                        }}>
                          {p.status?.replace('_', ' ')}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '500', fontSize: '14px', color: 'var(--text-primary)' }}>
                          {fmtCurrency(p.estimated_budget)}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No recent projects</p>
                )}
              </div>
            </AnimatedItem>

            {/* Recent Expenses */}
            <AnimatedItem delayIndex={4} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '4px', height: '18px', background: 'var(--accent)', borderRadius: '2px', display: 'inline-block' }} />
                  RECENT EXPENDITURE
                </h3>
                <Link to="/expenses" style={{ fontFamily: 'var(--font-heading)', fontSize: '13px', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  View All <HiOutlineArrowRight />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {expensesLoading ? (
                  [1,2,3,4].map(i => (
                    <div key={i} style={{ padding: '16px', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)' }}>
                      <div className="animate-shimmer" style={{ width: '50%', height: '14px', borderRadius: '4px' }} />
                    </div>
                  ))
                ) : expensesError ? (
                  <p style={{ color: '#EF4444', fontSize: '13px', margin: 0, fontFamily: 'var(--font-body)' }}>Failed to load expenses</p>
                ) : recentExpenses.length > 0 ? (
                  recentExpenses.map((e, i) => (
                    <motion.div
                      key={e.expense_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(245,158,11,0.08)', x: 4 }}
                      onClick={() => navigate('/expenses')}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '16px', background: 'var(--bg-page)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ 
                            backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.2)',
                            padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', fontFamily: 'var(--font-heading)'
                          }}>
                            {e.category_name || 'Expense'}
                          </span>
                          <span style={{ fontWeight: '500', fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                            {e.description ? (e.description.length > 30 ? e.description.substring(0, 30) + '...' : e.description) : 'No description'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-body)' }}>
                          {e.project_name} <span style={{ opacity: 0.5 }}>|</span> {e.expense_date ? new Date(e.expense_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '600', fontSize: '14px', color: '#EF4444' }}>
                        {fmtCurrency(e.amount)}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>No recent expenses</p>
                )}
              </div>
            </AnimatedItem>
          </div>
        </>
      )}
    </PageWrapper>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role_id === 4) return <AccountantDashboard />;
  if (user?.role_id === 5) return <SupervisorDashboard />;
  return <DashboardContent />;
}
