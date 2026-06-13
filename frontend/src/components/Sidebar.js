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
  '/profile': UsersIcon,
};

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRoleId } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const roleId = user?.role_id;

  React.useEffect(() => {
    if (hasRoleId(1, 2)) {
      import('../api').then(API => {
        API.default.get('/recycle-bin')
          .then(res => setRecycleCount(res.data.length))
          .catch(() => { });
      });
    }
  }, [roleId, location.pathname, hasRoleId]);

  // Navigation sections defined by role_id arrays
  // role_ids: 1=Admin, 2=Manager, 3=Engineer, 4=Accountant, 5=Supervisor, 6=Viewer
  const navSections = [
    {
      title: 'Overview',
      roles: [1, 2, 3, 5, 6],
      items: [
        { path: '/', label: 'Dashboard' },
        { path: '/alerts', label: 'Alerts', roles: [1, 2, 3] },
        { path: '/recycle-bin', label: 'Recycle Bin', roles: [1, 2], badge: recycleCount },
      ]
    },
    {
      title: 'Projects',
      roles: [1, 2, 3, 5, 6],
      items: [
        { path: '/projects', label: 'Projects' },
        { path: '/project-progress', label: 'Progress', roles: [1, 2, 3] },
        { path: '/project-team', label: 'Team', roles: [1, 2] },
        { path: '/import', label: 'Import Project', roles: [1, 2] },
      ]
    },
    {
      title: 'Resources (3M)',
      roles: [1, 2, 3],
      items: [
        { path: '/materials', label: 'Materials' },
        { path: '/machines', label: 'Machines' },
        { path: '/workers', label: 'Workers' },
      ]
    },
    {
      title: 'Usage Tracking',
      roles: [1, 2, 3, 5, 6],
      items: [
        { path: '/material-usage', label: 'Material Usage' },
        { path: '/manpower-usage', label: 'Manpower Usage' },
        { path: '/machine-usage', label: 'Machine Usage' },
      ]
    },
    {
      title: 'Finance (Core)',
      roles: [1, 2],
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
      roles: [1, 2],
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
      roles: [1],
      items: [
        { path: '/investor/dashboard', label: 'Investor Dashboard' },
        { path: '/investor/onboarding', label: 'Investor Onboarding' },
        { path: '/investor/fund-tracking', label: 'Fund Tracking' },
      ]
    },
    {
      title: 'Billing & Expenses',
      roles: [1, 4],
      items: [
        { path: '/expenses', label: 'Expenses' },
        { path: '/billing', label: 'Billing' },
        { path: '/budget-comparison', label: 'Budget Analysis' },
      ]
    },
    {
      title: 'System',
      roles: [1],
      items: [
        { path: '/users', label: 'Users' },
        { path: '/audit-log', label: 'Audit Log' },
      ]
    }
  ];

  const filteredSections = navSections
    .filter(section => section.roles.includes(roleId))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(roleId))
    }));

  const handleProfileClick = () => {
    if (roleId === 1) {
      navigate('/admin');
    } else {
      navigate('/profile');
    }
  };

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
            <h1>BillX</h1>
            <span>Financial Infrastructure</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <div className="sidebar-user-avatar" style={{ position: 'relative' }}>
              {user.name?.charAt(0)?.toUpperCase()}
              {/* Online indicator */}
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 6, height: 6, borderRadius: '50%',
                background: '#16A34A', border: '1px solid var(--bg-secondary)',
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
                      borderLeft: isActive ? '3px solid var(--text-accent)' : '3px solid transparent',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '13px',
                      transition: 'all 0.15s ease',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
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
                        color: 'var(--text-primary)',
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
              border: '1px solid var(--border-medium)',
              background: 'transparent',
              cursor: 'pointer', color: 'var(--text-muted)',
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
              background: isDark ? 'var(--text-accent)' : 'var(--border-medium)',
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
