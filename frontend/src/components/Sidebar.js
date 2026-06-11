import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  DashboardIcon, ProjectIcon, MaterialIcon, WorkerIcon, MachineIcon,
  FinanceIcon, InvestorIcon, LoanIcon, ExpenseIcon, BillingIcon,
  ProgressIcon, TeamIcon, ImportIcon, AlertIcon, AdminIcon, AuditIcon,
  RecycleIcon, UsersIcon, HelmetIcon
} from './CivilIcons';
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout
} from 'react-icons/hi';

// Map icon components to nav items
const iconMap = {
  '/': DashboardIcon,
  '/alerts': AlertIcon,
  '/recycle-bin': RecycleIcon,
  '/projects': ProjectIcon,
  '/project-progress': ProgressIcon,
  '/project-team': TeamIcon,
  '/import': ImportIcon,
  '/materials': MaterialIcon,
  '/machines': MachineIcon,
  '/workers': WorkerIcon,
  '/material-usage': MaterialIcon,
  '/manpower-usage': WorkerIcon,
  '/machine-usage': MachineIcon,
  '/investors': InvestorIcon,
  '/financiers': FinanceIcon,
  '/investments': FinanceIcon,
  '/loans': LoanIcon,
  '/interest-payments': FinanceIcon,
  '/finance/dashboard': ProgressIcon,
  '/finance/budgeting': ExpenseIcon,
  '/finance/forecast': ProgressIcon,
  '/finance/planning': BillingIcon,
  '/finance/ratios': ProgressIcon,
  '/finance/statements': BillingIcon,
  '/finance/tax': AdminIcon,
  '/investor/dashboard': InvestorIcon,
  '/investor/onboarding': UsersIcon,
  '/investor/fund-tracking': FinanceIcon,
  '/expenses': ExpenseIcon,
  '/billing': BillingIcon,
  '/budget-comparison': ProgressIcon,
  '/users': UsersIcon,
  '/audit-log': AuditIcon,
};

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  React.useEffect(() => {
    if (['admin', 'manager'].includes(user?.role_name)) {
      import('../api').then(API => {
        API.default.get('/recycle-bin')
          .then(res => setRecycleCount(res.data.length))
          .catch(err => console.error('Failed to load recycle bin count'));
      });
    }
  }, [user?.role_name, location.pathname]);

  const navSections = [
    {
      title: 'Overview',
      roles: ['admin', 'manager', 'engineer', 'viewer'],
      items: [
        { path: '/', label: 'Dashboard' },
        { path: '/alerts', label: 'Alerts' },
        { path: '/recycle-bin', label: 'Recycle Bin', roles: ['admin', 'manager'], badge: recycleCount }
      ]
    },
    {
      title: 'Projects',
      roles: ['admin', 'manager', 'engineer', 'viewer'],
      items: [
        { path: '/projects', label: 'Projects' },
        { path: '/project-progress', label: 'Progress' },
        { path: '/project-team', label: 'Team', roles: ['admin', 'manager'] },
        { path: '/import', label: 'Import Project', roles: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Resources (3M)',
      roles: ['admin', 'manager', 'engineer'],
      items: [
        { path: '/materials', label: 'Materials' },
        { path: '/machines', label: 'Machines' },
        { path: '/workers', label: 'Workers' },
      ]
    },
    {
      title: 'Usage Tracking',
      roles: ['admin', 'manager', 'engineer'],
      items: [
        { path: '/material-usage', label: 'Material Usage' },
        { path: '/manpower-usage', label: 'Manpower Usage' },
        { path: '/machine-usage', label: 'Machine Usage' },
      ]
    },
    {
      title: 'Finance (Core)',
      roles: ['admin', 'manager'],
      items: [
        { path: '/investors', label: 'Investors' },
        { path: '/financiers', label: 'Financiers' },
        { path: '/investments', label: 'Investments' },
        { path: '/loans', label: 'Loans' },
        { path: '/interest-payments', label: 'Interest Payments' },
      ]
    },
    {
      title: 'Financial Analytics',
      roles: ['admin', 'manager'],
      items: [
        { path: '/finance/dashboard', label: 'Financial Dashboard' },
        { path: '/finance/budgeting', label: 'Budgeting' },
        { path: '/finance/forecast', label: 'Financial Forecast' },
        { path: '/finance/planning', label: 'Financial Planning' },
        { path: '/finance/ratios', label: 'Financial Ratios' },
        { path: '/finance/statements', label: 'Statements' },
        { path: '/finance/tax', label: 'Tax Compliance' },
      ]
    },
    {
      title: 'Advanced Investors',
      roles: ['admin', 'manager'],
      items: [
        { path: '/investor/dashboard', label: 'Investor Dashboard' },
        { path: '/investor/onboarding', label: 'Investor Onboarding' },
        { path: '/investor/fund-tracking', label: 'Fund Tracking' },
      ]
    },
    {
      title: 'Billing & Expenses',
      roles: ['admin', 'manager'],
      items: [
        { path: '/expenses', label: 'Expenses' },
        { path: '/billing', label: 'Billing' },
        { path: '/budget-comparison', label: 'Budget Analysis' },
      ]
    },
    {
      title: 'System',
      roles: ['admin'],
      items: [
        { path: '/users', label: 'Users' },
        { path: '/audit-log', label: 'Audit Log' },
      ]
    }
  ];

  const filteredSections = navSections
    .filter(section => section.roles.includes(user?.role_name))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(user?.role_name))
    }));

  return (
    <>
      <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
        {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
      </button>

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <HelmetIcon size={32} />
          </div>
          <div>
            <h1>BUILDMANAGER</h1>
            <span>Construction ERP</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user" onClick={() => { if(user.role_name === 'admin') navigate('/admin'); }} style={{ cursor: user.role_name === 'admin' ? 'pointer' : 'default' }}>
            <div className="sidebar-user-avatar" style={{ position: 'relative' }}>
              {user.name?.charAt(0)?.toUpperCase()}
              {/* Online indicator */}
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 6, height: 6, borderRadius: '50%',
                background: '#16A34A', border: '1px solid #111111',
                animation: 'sitePulse 2s ease-in-out infinite'
              }} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">
                {user.role_name?.charAt(0).toUpperCase() + user.role_name?.slice(1)}
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {filteredSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                const IconComponent = iconMap[item.path] || DashboardIcon;
                
                return (
                  <div
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '0 12px', height: '40px', cursor: 'pointer',
                      borderLeft: isActive ? '3px solid #F59E0B' : '3px solid transparent',
                      background: isActive ? 'rgba(245,158,11,0.08)' : 'transparent',
                      color: isActive ? '#F5F5F4' : '#9CA3AF',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '13px',
                      transition: 'all 0.15s ease',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#D6D3CE';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#9CA3AF';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent size={16} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span style={{
                        backgroundColor: '#DC2626',
                        color: '#fff',
                        borderRadius: '4px',
                        padding: '1px 6px',
                        fontSize: '10px',
                        fontWeight: '700'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Theme Toggle */}
        <div style={{ padding: '8px' }}>
          <button
            onClick={toggleTheme}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: '6px',
              border: '1px solid #2D2D2D',
              background: 'transparent',
              cursor: 'pointer', color: '#9CA3AF',
              fontSize: '10px', fontWeight: '500',
              fontFamily: "'Inter', sans-serif",
              textTransform: 'uppercase', letterSpacing: '1px',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</span>
              {isDark ? 'Day Mode' : 'Dark Site'}
            </span>
            <span style={{
              width: 32, height: 16,
              borderRadius: 8,
              background: isDark ? '#F59E0B' : '#374151',
              position: 'relative',
              transition: 'background 0.3s',
              flexShrink: 0,
            }}>
              <span style={{
                position: 'absolute',
                top: 2, left: isDark ? 16 : 2,
                width: 12, height: 12,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.3s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </span>
          </button>
        </div>

        {/* Subtle crane illustration */}
        <div style={{ padding: '0 16px 4px', opacity: 0.08 }}>
          <svg width="180" height="40" viewBox="0 0 180 40" fill="none">
            <line x1="90" y1="5" x2="90" y2="38" stroke="#F59E0B" strokeWidth="1" />
            <line x1="50" y1="5" x2="160" y2="5" stroke="#F59E0B" strokeWidth="1" />
            <line x1="160" y1="5" x2="150" y2="30" stroke="#F59E0B" strokeWidth="0.5" />
            <rect x="20" y="25" width="40" height="15" stroke="#F59E0B" strokeWidth="0.5" fill="none" />
            <rect x="120" y="30" width="50" height="10" stroke="#F59E0B" strokeWidth="0.5" fill="none" />
          </svg>
        </div>

        {/* Logout */}
        <div className="sidebar-logout">
          <button className="sidebar-link" onClick={logout} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <span className="sidebar-link-icon"><HiOutlineLogout /></span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
