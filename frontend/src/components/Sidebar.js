import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" style={{ color: 'var(--accent)' }}>
            <HelmetIcon size={32} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, fontSize: '20px' }}>BillX</h1>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Financial Infrastructure</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <motion.div 
            whileHover={{ backgroundColor: 'rgba(245,158,11,0.05)' }}
            className="sidebar-user" 
            onClick={handleProfileClick} 
            style={{ cursor: 'pointer', borderRadius: 'var(--radius-sm)', transition: 'background-color 0.2s' }}
          >
            <div className="sidebar-user-avatar" style={{ position: 'relative', border: '1px solid var(--accent)' }}>
              {user.name?.charAt(0)?.toUpperCase()}
              {/* Online indicator */}
              <span style={{
                position: 'absolute', bottom: -1, right: -1,
                width: 8, height: 8, borderRadius: '50%',
                background: '#10B981', border: '2px solid var(--bg-secondary)',
                animation: 'pulse-glow 2s ease-in-out infinite'
              }} />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.5px' }}>{user.name}</div>
              <div className="sidebar-user-role" style={{ color: 'var(--accent)' }}>
                {user.role_name?.charAt(0).toUpperCase() + user.role_name?.slice(1)}
              </div>
            </div>
          </motion.div>
        )}

        <nav className="sidebar-nav" style={{ flex: 1 }}>
          {filteredSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '1px' }}>{section.title}</div>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                const IconComponent = iconMap[item.path] || DashboardIcon;

                return (
                  <motion.div
                    key={item.path}
                    whileHover={{ x: 4, backgroundColor: isActive ? 'var(--accent-glow)' : 'rgba(255,255,255,0.02)' }}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '0 12px', height: '40px', cursor: 'pointer',
                      borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                      background: isActive ? 'var(--accent-glow)' : 'transparent',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '13px',
                      transition: 'color 0.2s ease, background-color 0.2s ease, border-left-color 0.2s ease',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComponent size={16} />
                      <span style={{ color: isActive ? 'var(--text-primary)' : 'inherit' }}>{item.label}</span>
                    </div>
                    {item.badge > 0 && (
                      <span style={{
                        backgroundColor: '#EF4444',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        fontFamily: 'var(--font-mono)'
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          {/* Theme Toggle */}
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={toggleTheme}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer', color: 'var(--text-muted)',
                fontSize: '11px', fontWeight: '600',
                fontFamily: 'var(--font-heading)',
                textTransform: 'uppercase', letterSpacing: '1px',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</span>
                {isDark ? 'Day Mode' : 'Dark Mode'}
              </span>
              <span style={{
                width: 32, height: 16,
                borderRadius: 8,
                background: isDark ? 'var(--accent)' : 'var(--border-medium)',
                position: 'relative',
                transition: 'background 0.3s',
                flexShrink: 0,
              }}>
                <span style={{
                  position: 'absolute',
                  top: 2, left: isDark ? 16 : 2,
                  width: 12, height: 12,
                  borderRadius: '50%',
                  background: '#0A0A0F',
                  transition: 'left 0.3s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </span>
            </button>
          </div>

          {/* Logout */}
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
            whileTap={{ scale: 0.98 }}
            onClick={logout} 
            style={{ 
              width: '100%', 
              border: '1px solid var(--border)', 
              background: 'transparent', 
              cursor: 'pointer', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              transition: 'all 0.2s'
            }}
          >
            <HiOutlineLogout size={16} />
            Sign Out
          </motion.button>
        </div>
      </aside>
    </>
  );
}
