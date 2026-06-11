const express = require('express');
const router  = express.Router();
const db      = require('../db');
const jwt     = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

// Middleware: only allow role_id = 1
const adminOnly = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role_id !== 1) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── GET /api/admin/users ──────────────────────────────────────────
// All users with role name and last login
router.get('/users', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.user_id,
        u.name,
        u.email,
        u.is_active,
        u.is_approved,
        u.role_id,
        u.login_attempts,
        u.last_login,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.is_deleted = 0
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/block ─────────────────────────────
router.patch('/users/:id/block', adminOnly, async (req, res) => {
  try {
    await db.query(
      `UPDATE users SET is_active = 0 WHERE user_id = ?`,
      [req.params.id]
    );
    // log this admin action
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'BLOCK_USER', 'users', ?, ?)`,
      [req.user.user_id, req.params.id, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );
    res.json({ success: true, message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/unblock ───────────────────────────
router.patch('/users/:id/unblock', adminOnly, async (req, res) => {
  try {
    await db.query(
      `UPDATE users SET is_active = 1, login_attempts = 0 WHERE user_id = ?`,
      [req.params.id]
    );
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'UNBLOCK_USER', 'users', ?, ?)`,
      [req.user.user_id, req.params.id, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );
    res.json({ success: true, message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/sessions ───────────────────────────────────────
// Login session history — all users
router.get('/sessions', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sl.session_id,
        sl.login_time,
        sl.logout_time,
        sl.ip_address,
        sl.user_agent,
        sl.status,
        u.name   AS user_name,
        u.email  AS user_email,
        r.role_name,
        TIMESTAMPDIFF(MINUTE, sl.login_time,
          COALESCE(sl.logout_time, NOW())) AS session_duration_mins
      FROM session_log sl
      JOIN users u ON sl.user_id = u.user_id
      JOIN roles r ON u.role_id  = r.role_id
      ORDER BY sl.login_time DESC
      LIMIT 200
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/activity ───────────────────────────────────────
// Recent activity log
router.get('/activity', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        al.log_id,
        al.action,
        al.table_name,
        al.record_id,
        al.ip_address,
        al.created_at,
        u.name AS performed_by
      FROM activity_log al
      LEFT JOIN users u ON al.user_id = u.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────
// Admin panel summary numbers
router.get('/stats', adminOnly, async (req, res) => {
  try {
    const [[{ total_users }]]   = await db.query(`SELECT COUNT(*) AS total_users FROM users WHERE is_deleted = 0`);
    const [[{ active_users }]]  = await db.query(`SELECT COUNT(*) AS active_users FROM users WHERE is_active = 1 AND is_deleted = 0`);
    const [[{ blocked_users }]] = await db.query(`SELECT COUNT(*) AS blocked_users FROM users WHERE is_active = 0 AND is_deleted = 0`);
    const [[{ active_sessions }]] = await db.query(
      `SELECT COUNT(*) AS active_sessions FROM session_log WHERE status = 'active'`
    );
    const [[{ total_logins_today }]] = await db.query(
      `SELECT COUNT(*) AS total_logins_today FROM session_log WHERE DATE(login_time) = CURDATE()`
    );
    const [[{ total_actions_today }]] = await db.query(
      `SELECT COUNT(*) AS total_actions_today FROM activity_log WHERE DATE(created_at) = CURDATE()`
    );

    res.json({
      success: true,
      data: {
        total_users,
        active_users,
        blocked_users,
        active_sessions,
        total_logins_today,
        total_actions_today,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/approve ─────────────────────────────
router.patch('/users/:id/approve', adminOnly, async (req, res) => {
  try {
    await db.query(
      `UPDATE users SET is_approved = 1 WHERE user_id = ?`,
      [req.params.id]
    );
    // log this admin action
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'APPROVE_USER', 'users', ?, ?)`,
      [req.user.user_id, req.params.id, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );
    res.json({ success: true, message: 'User approved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/admin/users/:id/reject ─────────────────────────────
router.patch('/users/:id/reject', adminOnly, async (req, res) => {
  try {
    await db.query(
      `DELETE FROM users WHERE user_id = ? AND is_approved = 0`,
      [req.params.id]
    );
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'REJECT_USER', 'users', ?, ?)`,
      [req.user.user_id, req.params.id, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );
    res.json({ success: true, message: 'User rejected and removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/create-admin ──────────────────────────────────
// Only existing admins can create new admin accounts (no hard cap — admins can always add more)
const bcrypt = require('bcryptjs');
router.post('/create-admin', adminOnly, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check for duplicate email
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id, is_active, is_approved) VALUES (?, ?, ?, 1, 1, 1)',
      [name, email, hash]
    );

    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'CREATE_ADMIN', 'users', ?, ?)`,
      [req.user.user_id, email, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );

    res.status(201).json({ success: true, message: 'Admin account created', user_id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/unassigned-users ───────────────────────────────
// Engineers/managers with no project assignment
router.get('/unassigned-users', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.created_at, u.role_id, r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.role_id IN (2, 3, 5, 6)
        AND u.is_active = 1
        AND u.is_deleted = 0
        AND u.user_id NOT IN (SELECT DISTINCT user_id FROM project_team)
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/assigned-users ─────────────────────────────────
// Engineers/managers already assigned to projects
router.get('/assigned-users', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, r.role_name,
             p.project_name, p.project_id, pt.role AS team_role
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      JOIN project_team pt ON pt.user_id = u.user_id
      JOIN projects p ON p.project_id = pt.project_id
      WHERE u.role_id IN (2, 3, 4, 5, 6) AND u.is_active = 1 AND u.is_deleted = 0
      ORDER BY u.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/assign-project ────────────────────────────────
// Assign a user to a project
router.post('/assign-project', adminOnly, async (req, res) => {
  try {
    const { user_id, project_id, team_role } = req.body;
    if (!user_id || !project_id) {
      return res.status(400).json({ success: false, message: 'user_id and project_id required' });
    }

    // Check if already assigned
    const [existing] = await db.query(
      'SELECT id FROM project_team WHERE user_id = ? AND project_id = ?',
      [user_id, project_id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'User already assigned to this project' });
    }

    await db.query(
      'INSERT INTO project_team (project_id, user_id, role) VALUES (?, ?, ?)',
      [project_id, user_id, team_role || 'engineer']
    );

    // Log the action
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'ASSIGN_PROJECT', 'project_team', ?, ?)`,
      [req.user.user_id, `${user_id}→${project_id}`, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );

    res.json({ success: true, message: 'Project assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/admin/unassign ────────────────────────────────────
// Remove a user's project assignment
router.delete('/unassign', adminOnly, async (req, res) => {
  try {
    const { user_id, project_id } = req.body;
    await db.query(
      'DELETE FROM project_team WHERE user_id = ? AND project_id = ?',
      [user_id, project_id]
    );

    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'UNASSIGN_PROJECT', 'project_team', ?, ?)`,
      [req.user.user_id, `${user_id}←${project_id}`, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );

    res.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
