const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

// Verify JWT token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Re-check is_active on every request
    const [rows] = await db.query('SELECT is_active FROM users WHERE user_id = ?', [decoded.user_id]);
    if (!rows.length || rows[0].is_active === 0) {
      return res.status(403).json({ code: 'ACCOUNT_BLOCKED', error: 'Account suspended' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// Role-based access control (by role_name string — legacy)
function roleGuard(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role_name)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// Role-based access control (by role_id integer — preferred)
// Usage: requireRole(1, 2, 4) or requireRole([1, 2, 4])
function requireRole(...allowedRoleIds) {
  // Flatten in case an array is passed
  const ids = allowedRoleIds.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!ids.includes(req.user.role_id)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

// Project assignment check middleware
// Ensures user is assigned to the project they're accessing
// Admin (1) and Accountant (4) skip this check
async function requireProjectAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Admin and Accountant bypass project checks
  if ([1, 4].includes(req.user.role_id)) {
    return next();
  }

  // Extract project_id from params, query, or body
  const projectId = req.params.projectId || req.params.id || req.query.project_id || req.body?.project_id;
  
  if (!projectId) {
    // No specific project requested — let the route handler filter by assignment
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
    return res.status(403).json({ error: 'You are not assigned to this project.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to verify project access.' });
  }
}

// Read-only enforcement — blocks POST/PUT/DELETE for specified roles
function readOnlyForRoles(...roleIds) {
  const ids = roleIds.flat();
  return (req, res, next) => {
    if (!req.user) return next();
    if (ids.includes(req.user.role_id) && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Read-only access. You cannot modify data.' });
    }
    next();
  };
}

// Supervisor date restriction — only allows today's data
function supervisorDateRestriction(req, res, next) {
  if (!req.user || req.user.role_id !== 5) return next();
  
  // For GET requests, force date to today
  const today = new Date().toISOString().split('T')[0];
  if (req.query.date && req.query.date !== today) {
    return res.status(403).json({ error: 'Supervisors can only view today\'s data.' });
  }
  // Inject today's date if none provided
  if (!req.query.date) {
    req.query.date = today;
  }
  next();
}

module.exports = { 
  authMiddleware, roleGuard, requireRole, requireProjectAccess, 
  readOnlyForRoles, supervisorDateRestriction, JWT_SECRET 
};
