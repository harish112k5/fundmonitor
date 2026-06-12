const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, message: 'Access denied. No token provided.', error: null });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Re-check is_active on every request
    const [rows] = await db.query('SELECT is_active FROM users WHERE user_id = ?', [decoded.user_id]);
    if (!rows.length || rows[0].is_active === 0) {
      return res.status(403).json({ success: false, data: null, message: 'Account suspended', error: 'ACCOUNT_BLOCKED' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    let message = 'Invalid token.';
    if (err.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please log in again.';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid authentication token.';
    }
    return res.status(401).json({ success: false, data: null, message: message, error: err.name });
  }
}

// Role-based access control (by role_name string — legacy)
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, data: null, message: 'Not authenticated', error: null });
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ success: false, data: null, message: 'Access denied. Insufficient permissions.', error: null });
    }
    next();
  };
}

// Role-based access control (by role_id integer — preferred)
function requireRole(...allowedRoleIds) {
  const ids = allowedRoleIds.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, data: null, message: 'Not authenticated', error: null });
    }
    if (!ids.includes(req.user.role_id)) {
      return res.status(403).json({ success: false, data: null, message: 'Access denied. Insufficient permissions.', error: null });
    }
    next();
  };
}

// Project assignment check middleware
async function requireProjectAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, data: null, message: 'Not authenticated', error: null });
  }

  if ([1, 4].includes(req.user.role_id)) {
    return next();
  }

  const projectId = req.params.projectId || req.params.id || req.query.project_id || req.body?.project_id;
  
  if (!projectId) {
    return next();
  }

  try {
    const [rows] = await db.query(
      'SELECT id FROM project_team WHERE user_id = ? AND project_id = ?',
      [req.user.user_id, projectId]
    );
    if (rows.length > 0) {
      return next();
    }
    return res.status(403).json({ success: false, data: null, message: 'You are not assigned to this project.', error: null });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: 'Failed to verify project access.', error: err.message });
  }
}

// Read-only enforcement
function readOnlyForRoles(...roleIds) {
  const ids = roleIds.flat();
  return (req, res, next) => {
    if (!req.user) return next();
    if (ids.includes(req.user.role_id) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ success: false, data: null, message: 'Read-only access. You cannot modify data.', error: null });
    }
    next();
  };
}

// Supervisor date restriction
function supervisorDateRestriction(req, res, next) {
  if (!req.user || req.user.role_id !== 5) return next();
  
  const today = new Date().toISOString().split('T')[0];
  if (req.query.date && req.query.date !== today) {
    return res.status(403).json({ success: false, data: null, message: 'Supervisors can only view today\'s data.', error: null });
  }
  if (!req.query.date) {
    req.query.date = today;
  }
  next();
}

// Attach user's project-specific permissions to req.user
// Requires permissions.js — imported lazily to avoid circular dependency
async function attachPermissions(req, res, next) {
  if (!req.user) return next();
  const project_id = req.params.projectId || req.params.id || req.query.project_id;
  if (project_id) {
    try {
      const { getUserProjectPermissions } = require('./permissions');
      req.user.projectPermissions = await getUserProjectPermissions(req.user.user_id, project_id);
    } catch (_) {
      req.user.projectPermissions = [];
    }
  }
  next();
}

module.exports = { 
  authMiddleware, roleGuard, requireRole, requireProjectAccess, 
  readOnlyForRoles, supervisorDateRestriction, attachPermissions, JWT_SECRET 
};
