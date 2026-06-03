import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineViewGrid,
  HiOutlineOfficeBuilding,
  HiOutlineCube,
  HiOutlineCog,
  HiOutlineUsers,
  HiOutlineUserGroup,
  HiOutlineTruck,
  HiOutlineClipboardList,
  HiOutlineCurrencyDollar,
  HiOutlineDocumentText,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineCash,
  HiOutlineLibrary,
  HiOutlineCreditCard,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineLogout,
  HiOutlineExclamationCircle,
  HiOutlineTrash
} from 'react-icons/hi';

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recycleCount, setRecycleCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  React.useEffect(() => {
    if (['admin', 'manager'].includes(user?.role_name)) {
      import('../api').then(API => {
        API.default.get('/recycle-bin')
          .then(res => setRecycleCount(res.data.length))
          .catch(err => console.error('Failed to load recycle bin count'));
      });
    }
  }, [user?.role_name, location.pathname]); // Refresh count when navigation happens

  // Role-based navigation
  const navSections = [
    {
      title: 'Overview',
      roles: ['admin', 'manager', 'engineer', 'viewer'],
      items: [
        { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
        { path: '/alerts', label: 'Alerts', icon: HiOutlineExclamationCircle },
        { path: '/recycle-bin', label: 'Recycle Bin', icon: HiOutlineTrash, roles: ['admin', 'manager'], badge: recycleCount }
      ]
    },
    {
      title: 'Projects',
      roles: ['admin', 'manager', 'engineer', 'viewer'],
      items: [
        { path: '/projects', label: 'Projects', icon: HiOutlineOfficeBuilding },
        { path: '/project-progress', label: 'Progress', icon: HiOutlineChartBar },
        { path: '/project-team', label: 'Team', icon: HiOutlineUserGroup, roles: ['admin', 'manager'] },
        { path: '/import', label: 'Import Project', icon: HiOutlineDocumentText, roles: ['admin', 'manager'] },
      ]
    },
    {
      title: 'Resources (3M)',
      roles: ['admin', 'manager', 'engineer'],
      items: [
        { path: '/materials', label: 'Materials', icon: HiOutlineCube },
        { path: '/machines', label: 'Machines', icon: HiOutlineTruck },
        { path: '/workers', label: 'Workers', icon: HiOutlineUsers },
      ]
    },
    {
      title: 'Usage Tracking',
      roles: ['admin', 'manager', 'engineer'],
      items: [
        { path: '/material-usage', label: 'Material Usage', icon: HiOutlineClipboardList },
        { path: '/manpower-usage', label: 'Manpower Usage', icon: HiOutlineUserGroup },
        { path: '/machine-usage', label: 'Machine Usage', icon: HiOutlineCog },
      ]
    },
    {
      title: 'Finance',
      roles: ['admin', 'manager'],
      items: [
        { path: '/investors', label: 'Investors', icon: HiOutlineCurrencyDollar },
        { path: '/financiers', label: 'Financiers', icon: HiOutlineLibrary },
        { path: '/investments', label: 'Investments', icon: HiOutlineCash },
        { path: '/loans', label: 'Loans', icon: HiOutlineCreditCard },
        { path: '/interest-payments', label: 'Interest Payments', icon: HiOutlineCurrencyDollar },
      ]
    },
    {
      title: 'Financial Analytics',
      roles: ['admin', 'manager'],
      items: [
        { path: '/finance-dashboard', label: 'Dashboard', icon: HiOutlineChartBar },
        { path: '/finance-budgeting', label: 'Budgeting', icon: HiOutlineCash },
        { path: '/finance-statements', label: 'Statements', icon: HiOutlineDocumentText },
        { path: '/finance-ratios', label: 'Financial Ratios', icon: HiOutlineChartBar },
      ]
    },
    {
      title: 'Billing & Expenses',
      roles: ['admin', 'manager'],
      items: [
        { path: '/expenses', label: 'Expenses', icon: HiOutlineDocumentText },
        { path: '/billing', label: 'Billing', icon: HiOutlineDocumentText },
        { path: '/budget-comparison', label: 'Budget Analysis', icon: HiOutlineChartBar },
      ]
    },
    {
      title: 'System',
      roles: ['admin'],
      items: [
        { path: '/users', label: 'Users', icon: HiOutlineUsers },
        { path: '/audit-log', label: 'Audit Log', icon: HiOutlineShieldCheck },
      ]
    }
  ];

  // Filter sections based on user role
  const filteredSections = navSections
    .filter(section => section.roles.includes(user?.role_name))
    .map(section => ({
      ...section,
      items: section.items.filter(item => !item.roles || item.roles.includes(user?.role_name))
    }));

  const roleBadgeColors = {
    admin: '#ef4444',
    manager: '#f59e0b',
    engineer: '#3b82f6',
    viewer: '#6366f1'
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
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🏗</div>
          <div>
            <h1>BuildManager</h1>
            <span>Construction ERP</span>
          </div>
        </div>

        {/* User info */}
        {user && (
          <div className="sidebar-user" onClick={() => { if(user.role_name === 'admin') navigate('/admin'); }} style={{ cursor: user.role_name === 'admin' ? 'pointer' : 'default' }}>
            <div className="sidebar-user-avatar" style={user.role_name === 'admin' ? { position: 'relative' } : {}}>
              {user.name?.charAt(0)?.toUpperCase()}
              {user.role_name === 'admin' && (
                <span style={{
                  position: 'absolute', bottom: -2, right: -2,
                  background: '#ef4444', borderRadius: '50%',
                  width: 12, height: 12, border: '1px solid #0f0f1a'
                }}></span>
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role" style={{ color: roleBadgeColors[user.role_name] }}>
                {user.role_name?.charAt(0).toUpperCase() + user.role_name?.slice(1)}
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {filteredSections.map((section) => (
            <div key={section.title} className="sidebar-section">
              <div className="sidebar-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive && location.pathname === item.path ? 'active' : ''}`
                  }
                  end={item.path === '/'}
                  onClick={() => setMobileOpen(false)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="sidebar-link-icon"><item.icon /></span>
                    {item.label}
                  </div>
                  {item.badge > 0 && (
                    <span style={{
                      background: '#ef4444',
                      color: 'white',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

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
