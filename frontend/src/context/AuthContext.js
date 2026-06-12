import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  // permissions: { [projectId]: ['can_view_project', 'can_add_expenses', ...] }
  const [permissions, setPermissions] = useState({});

  // Fetch permissions from backend and build projectId → permissionCode[] map
  const fetchPermissions = useCallback(async () => {
    try {
      const res = await API.get('/auth/me/permissions');
      if (res.data?.success) {
        const permMap = {};
        (res.data.data.projects || []).forEach(p => {
          permMap[String(p.project_id)] = p.permissions || [];
        });
        setPermissions(permMap);
      }
    } catch (_) {
      // Non-critical — silently ignore if endpoint not available
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      API.get('/auth/me')
        .then(res => {
          setUser(res.data);
          fetchPermissions(); // load permissions after verifying session
        })
        .catch(() => {
          localStorage.removeItem('token');
          delete API.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchPermissions]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('token', token);
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    await fetchPermissions(); // load dynamic permissions right after login
    return userData;
  };

  const register = async (name, email, password, role_id) => {
    const res = await API.post('/auth/register', { name, email, password, role_id });
    // Don't auto-login — account needs admin approval first
    return res.data;
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (_) {
      // Ignore errors — always log out locally
    }
    localStorage.removeItem('token');
    delete API.defaults.headers.common['Authorization'];
    setUser(null);
    setPermissions({});
  };

  /**
   * Check if the current user has a specific permission on a specific project.
   * Admin (role_id=1) always returns true regardless of permissions state.
   *
   * @param {number|string} projectId
   * @param {string} permissionCode  e.g. 'can_add_expenses'
   */
  const hasPermission = useCallback((projectId, permissionCode) => {
    if (!user) return false;
    if (user.role_id === ROLES.ADMIN) return true; // Admin bypass
    const key = String(projectId);
    return (permissions[key] || []).includes(permissionCode);
  }, [user, permissions]);

  /**
   * Check if user has ANY of the listed permissions on a project.
   * Useful for routes that allow multiple permission codes.
   */
  const hasAnyPermission = useCallback((projectId, ...codes) => {
    return codes.some(code => hasPermission(projectId, code));
  }, [hasPermission]);

  // Role checks by role_id
  const roleId       = user?.role_id;
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
      // Dynamic permission system
      permissions,
      hasPermission,
      hasAnyPermission,
      fetchPermissions,
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
