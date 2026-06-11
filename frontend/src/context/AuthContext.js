import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api';

const AuthContext = createContext(null);

// Role ID constants
export const ROLES = {
  ADMIN: 1,
  MANAGER: 2,
  ENGINEER: 3,
  ACCOUNTANT: 4,
  SUPERVISOR: 5,
  VIEWER: 6,
};

// Role-based home routes
const ROLE_HOME = {
  1: '/',              // Admin → main dashboard
  2: '/',              // Manager → main dashboard (sees only assigned projects)
  3: '/',              // Engineer → main dashboard
  4: '/billing',       // Accountant → billing
  5: '/',              // Supervisor → main dashboard (daily report)
  6: '/',              // Viewer → main dashboard
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete API.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role_id) => {
    const res = await API.post('/auth/register', { name, email, password, role_id });
    // Don't auto-login — account needs admin approval first
    return res.data;
  };

  const logout = async () => {
    // Tell backend to mark session as ended
    try {
      await API.post('/auth/logout');
    } catch (_) {
      // Ignore errors — always log out locally
    }
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Role checks by role_id
  const roleId = user?.role_id;
  const isAdmin      = roleId === ROLES.ADMIN;
  const isManager    = roleId === ROLES.MANAGER;
  const isEngineer   = roleId === ROLES.ENGINEER;
  const isAccountant = roleId === ROLES.ACCOUNTANT;
  const isSupervisor = roleId === ROLES.SUPERVISOR;
  const isViewer     = roleId === ROLES.VIEWER;

  // Check if user has any of the specified roles (by role_id)
  const hasRoleId = (...ids) => ids.flat().includes(roleId);
  // Legacy: check by role_name string
  const hasRole = (...roles) => roles.includes(user?.role_name);

  // Can user edit? (not supervisor or viewer)
  const canEdit = hasRoleId(1, 2, 3, 4);
  // Can user delete resources? (admin + manager only)
  const canDeleteResources = hasRoleId(1, 2);

  // Get home route for current user
  const getHomeRoute = () => ROLE_HOME[roleId] || '/';

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout,
      isAdmin, isManager, isEngineer, isAccountant, isSupervisor, isViewer,
      hasRole, hasRoleId, canEdit, canDeleteResources, getHomeRoute,
      isAuthenticated: !!user,
      ROLES
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
