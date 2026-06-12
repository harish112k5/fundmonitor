const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');

const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { success: false, data: null, message: 'Too many login attempts from this IP, please try again after 15 minutes', error: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = Joi.object({
  name: Joi.string().required(),
  // tlds: false — allow internal/local emails like admin@company.local
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(6).required(),
  role_id: Joi.number().integer().optional()
});

const loginSchema = Joi.object({
  // tlds: false — allow internal/local emails like admin@company.local
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required()
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password, role_id } = req.body;

  // BLOCK: No self-registration as admin (role_id = 1)
  const userRoleId = parseInt(role_id) || 6;
  if (userRoleId === 1) {
    return res.status(403).json({ success: false, data: null, message: 'Admin accounts cannot be self-registered', error: 'FORBIDDEN' });
  }

  // BLOCK: Only valid non-admin roles allowed
  const allowedRoles = [2, 3, 4, 5, 6];
  if (!allowedRoles.includes(userRoleId)) {
    return res.status(400).json({ success: false, data: null, message: 'Invalid role', error: 'INVALID_INPUT' });
  }

  // Check if email already exists
  const [existing] = await db.query('SELECT user_id FROM users WHERE email = ? AND is_deleted = 0', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ success: false, data: null, message: 'Email already registered', error: 'CONFLICT' });
  }

  // Hash password with salt rounds = 12
  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // is_approved = 0 by default — admin must approve before user can login
  await db.query(
    'INSERT INTO users (name, email, password_hash, role_id, is_active, is_approved) VALUES (?, ?, ?, ?, 1, 0)',
    [name, email, password_hash, userRoleId]
  );

  res.status(201).json({
    success: true,
    data: null,
    message: 'Account created. Awaiting admin approval.',
    error: null
  });
}));

// POST /api/auth/login
router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const [users] = await db.query(`
    SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, r.role_name, u.is_active, u.is_approved
    FROM users u JOIN roles r ON u.role_id = r.role_id
    WHERE u.email = ? AND u.is_deleted = 0
  `, [email]);

  if (users.length === 0) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid email or password', error: 'UNAUTHORIZED' });
  }

  const user = users[0];

  // Check blocked BEFORE password
  if (user.is_active === 0 || !user.is_active) {
    return res.status(403).json({ success: false, data: null, message: 'Account suspended. Contact your administrator.', error: 'ACCOUNT_BLOCKED' });
  }

  // Check pending approval
  if (!user.is_approved) {
    return res.status(403).json({ success: false, data: null, message: 'Account awaiting admin approval.', error: 'PENDING_APPROVAL' });
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid email or password', error: 'UNAUTHORIZED' });
  }

  // Generate token
  const sessionId = uuidv4();
  const token = jwt.sign(
    { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name, session_id: sessionId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  try {
    // Update last_login and record session
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || 'unknown';
    const ua = req.headers['user-agent'] || null;
    await db.query(`UPDATE users SET last_login = NOW() WHERE user_id = ?`, [user.user_id]);

    // Mark any old active sessions for this user as expired
    await db.query(
      `UPDATE session_log SET status = 'expired', logout_time = NOW()
       WHERE user_id = ? AND status = 'active' AND login_time < DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      [user.user_id]
    );

    await db.query(
      `INSERT INTO session_log (session_id, user_id, login_time, ip_address, user_agent, status)
       VALUES (?, ?, NOW(), ?, ?, 'active')`,
      [sessionId, user.user_id, ip, ua]
    );
  } catch (e) {
    console.error('Session log error:', e);
  }

  res.json({
    success: true,
    data: {
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name }
    },
    message: 'Login successful',
    error: null
  });
}));

// GET /api/auth/me — get current user from token
router.get('/me', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, data: null, message: 'No token', error: 'UNAUTHORIZED' });
  }
  const token = authHeader.split(' ')[1];
  
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ success: false, data: null, message: 'Invalid token', error: 'UNAUTHORIZED' });
  }

  const [users] = await db.query(`
    SELECT u.user_id, u.name, u.email, u.role_id, u.is_active, r.role_name
    FROM users u JOIN roles r ON u.role_id = r.role_id
    WHERE u.user_id = ? AND u.is_deleted = 0
  `, [decoded.user_id]);

  if (users.length === 0) return res.status(404).json({ success: false, data: null, message: 'User not found', error: 'NOT_FOUND' });

  // Reject token if user has been blocked since it was issued
  if (!users[0].is_active) {
    return res.status(403).json({ success: false, data: null, message: 'Account is blocked.', error: 'ACCOUNT_BLOCKED' });
  }

  res.json({
    success: true,
    data: users[0],
    message: 'Current user fetched',
    error: null
  });
}));

// POST /api/auth/logout — mark session as ended
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.session_id) {
        await db.query(
          `UPDATE session_log SET status = 'logged_out', logout_time = NOW()
           WHERE session_id = ?`,
          [decoded.session_id]
        );
      } else {
        await db.query(
          `UPDATE session_log SET status = 'logged_out', logout_time = NOW()
           WHERE user_id = ? AND status = 'active'
           ORDER BY login_time DESC LIMIT 1`,
          [decoded.user_id]
        );
      }
    } catch (_) {
      // Token invalid/expired — still OK to logout
    }
  }
  res.json({ success: true, data: null, message: 'Logged out', error: null });
}));

// ── GET /api/auth/me/permissions ──────────────────────────────────────
// Returns all per-project permissions for the currently logged-in user
router.get('/me/permissions', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
  } catch (_) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  const { user_id, role_id } = decoded;
  const { getUserProjectPermissions } = require('../middleware/permissions');
  const { getAllowedProjectIds } = require('../utils/projectAccess');

  // Admin: return all permissions on all non-deleted projects
  if (role_id === 1) {
    const [projects] = await db.query('SELECT project_id FROM projects WHERE is_deleted = 0');
    const [allPerms] = await db.query('SELECT permission_code FROM permission_definitions');
    const permList = allPerms.map(p => p.permission_code);

    return res.json({
      success: true,
      data: {
        user_id,
        role_id,
        is_admin: true,
        projects: projects.map(p => ({ project_id: p.project_id, permissions: permList }))
      }
    });
  }

  // Non-admin: fetch accessible project list then get permissions for each
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  const projects = [];
  for (const pid of projectIds) {
    const perms = await getUserProjectPermissions(user_id, pid);
    projects.push({ project_id: pid, permissions: perms });
  }

  res.json({
    success: true,
    data: { user_id, role_id, is_admin: false, projects }
  });
}));

module.exports = router;
