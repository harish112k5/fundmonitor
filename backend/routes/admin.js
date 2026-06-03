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
        (1 - u.is_deleted) AS is_active,
        0 AS login_attempts,
        NULL AS last_login,
        u.created_at,
        r.role_name
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
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
      `UPDATE users SET is_deleted = 1 WHERE user_id = ?`,
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
      `UPDATE users SET is_deleted = 0 WHERE user_id = ?`,
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
    const [[{ total_users }]]   = await db.query(`SELECT COUNT(*) AS total_users FROM users`);
    const [[{ active_users }]]  = await db.query(`SELECT COUNT(*) AS active_users FROM users WHERE is_deleted = 0`);
    const [[{ blocked_users }]] = await db.query(`SELECT COUNT(*) AS blocked_users FROM users WHERE is_deleted = 1`);
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

module.exports = router;
