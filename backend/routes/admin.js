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
      WHERE u.role_id IN (2, 3, 4, 5, 6)
        AND u.is_active = 1
        AND u.is_approved = 1
        AND u.is_deleted = 0
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
      WHERE u.role_id IN (2, 3, 4, 5, 6) AND u.is_active = 1 AND u.is_approved = 1 AND u.is_deleted = 0
      ORDER BY u.name
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/assign-project ────────────────────────────────
// Assign a user to a project AND auto-grant default permissions
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

    // Auto-grant default permissions based on the user's role
    const { autoGrantDefaultPermissions } = require('../middleware/permissions');
    await autoGrantDefaultPermissions(user_id, project_id, req.user.user_id);

    // Log the action
    await db.query(
      `INSERT INTO activity_log (user_id, action, table_name, record_id, ip_address)
       VALUES (?, 'ASSIGN_PROJECT', 'project_team', ?, ?)`,
      [req.user.user_id, `${user_id}→${project_id}`, req.ip || req.headers['x-forwarded-for'] || 'unknown']
    );

    res.json({ success: true, message: 'Project assigned and default permissions granted' });
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

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC PERMISSION MANAGEMENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

// ── GET /api/admin/permissions/definitions ──────────────────────────
// All available permission types
router.get('/permissions/definitions', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM permission_definitions ORDER BY permission_category, permission_name'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/permissions/user/:userId ─────────────────────────
// All active permissions for a specific user (across all projects)
router.get('/permissions/user/:userId', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        upp.id, upp.user_id, upp.project_id, upp.permission_code,
        upp.granted_at, upp.is_active,
        p.project_name,
        pd.permission_name, pd.permission_category,
        g.name AS granted_by_name
      FROM user_project_permissions upp
      JOIN projects p ON upp.project_id = p.project_id
      JOIN permission_definitions pd ON upp.permission_code = pd.permission_code
      LEFT JOIN users g ON upp.granted_by = g.user_id
      WHERE upp.user_id = ? AND upp.is_active = 1 AND upp.revoked_at IS NULL
      ORDER BY p.project_name, pd.permission_category
    `, [req.params.userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/permissions/project/:projectId ───────────────────
// All active permissions for all users on a specific project
router.get('/permissions/project/:projectId', adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        upp.id, upp.user_id, upp.project_id, upp.permission_code,
        upp.granted_at, upp.is_active,
        u.name AS user_name, u.email,
        r.role_name,
        pd.permission_name, pd.permission_category,
        g.name AS granted_by_name
      FROM user_project_permissions upp
      JOIN users u ON upp.user_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      JOIN permission_definitions pd ON upp.permission_code = pd.permission_code
      LEFT JOIN users g ON upp.granted_by = g.user_id
      WHERE upp.project_id = ? AND upp.is_active = 1 AND upp.revoked_at IS NULL
      ORDER BY u.name, pd.permission_category
    `, [req.params.projectId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/admin/permissions/matrix/:projectId ────────────────────
// Permission matrix: all team members for a project with all permissions
router.get('/permissions/matrix/:projectId', adminOnly, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Get team members for this project
    const [teamMembers] = await db.query(`
      SELECT u.user_id, u.name, u.email, r.role_name, r.role_id
      FROM project_team pt
      JOIN users u ON pt.user_id = u.user_id
      JOIN roles r ON u.role_id = r.role_id
      WHERE pt.project_id = ? AND u.is_deleted = 0
      ORDER BY u.name
    `, [projectId]);

    // Get all permission definitions
    const [defs] = await db.query(
      'SELECT * FROM permission_definitions ORDER BY permission_category, permission_code'
    );

    // Get all active permissions for this project
    const [activePerms] = await db.query(
      `SELECT user_id, permission_code FROM user_project_permissions 
       WHERE project_id = ? AND is_active = 1 AND revoked_at IS NULL`,
      [projectId]
    );

    // Build a set for fast lookup: "userId:permCode"
    const activeSet = new Set(activePerms.map(p => `${p.user_id}:${p.permission_code}`));

    // Attach permission state to each team member
    const matrix = teamMembers.map(member => ({
      ...member,
      permissions: defs.map(def => ({
        permission_code: def.permission_code,
        permission_name: def.permission_name,
        permission_category: def.permission_category,
        is_granted: activeSet.has(`${member.user_id}:${def.permission_code}`)
      }))
    }));

    res.json({ success: true, data: { team: matrix, definitions: defs } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/admin/permissions/grant ──────────────────────────────
// Grant one or more permissions to a user on a project
router.post('/permissions/grant', adminOnly, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { user_id, project_id, permission_codes, reason } = req.body;

    if (!user_id || !project_id || !Array.isArray(permission_codes) || permission_codes.length === 0) {
      return res.status(400).json({ success: false, message: 'user_id, project_id, and permission_codes[] required' });
    }

    for (const code of permission_codes) {
      // Upsert — grant or reactivate
      await connection.query(
        `INSERT INTO user_project_permissions 
         (user_id, project_id, permission_code, granted_by, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE 
         is_active = 1, 
         revoked_at = NULL,
         granted_by = VALUES(granted_by),
         granted_at = CURRENT_TIMESTAMP`,
        [user_id, project_id, code, req.user.user_id]
      );

      // Audit log
      await connection.query(
        `INSERT INTO permission_audit_log 
         (action, user_id, project_id, permission_code, performed_by, reason, ip_address)
         VALUES ('GRANT', ?, ?, ?, ?, ?, ?)`,
        [user_id, project_id, code, req.user.user_id, reason || null, req.ip]
      );
    }

    await connection.commit();
    res.json({ success: true, message: `Granted ${permission_codes.length} permission(s) successfully` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// ── POST /api/admin/permissions/revoke ─────────────────────────────
// Revoke one or more permissions from a user on a project
router.post('/permissions/revoke', adminOnly, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { user_id, project_id, permission_codes, reason } = req.body;

    if (!user_id || !project_id || !Array.isArray(permission_codes) || permission_codes.length === 0) {
      return res.status(400).json({ success: false, message: 'user_id, project_id, and permission_codes[] required' });
    }

    for (const code of permission_codes) {
      await connection.query(
        `UPDATE user_project_permissions 
         SET is_active = 0, revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND project_id = ? AND permission_code = ? AND is_active = 1`,
        [user_id, project_id, code]
      );

      await connection.query(
        `INSERT INTO permission_audit_log 
         (action, user_id, project_id, permission_code, performed_by, reason, ip_address)
         VALUES ('REVOKE', ?, ?, ?, ?, ?, ?)`,
        [user_id, project_id, code, req.user.user_id, reason || null, req.ip]
      );
    }

    await connection.commit();
    res.json({ success: true, message: `Revoked ${permission_codes.length} permission(s) successfully` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// ── POST /api/admin/permissions/toggle ─────────────────────────────
// Toggle a single permission (grant if off, revoke if on)
router.post('/permissions/toggle', adminOnly, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { user_id, project_id, permission_code } = req.body;

    if (!user_id || !project_id || !permission_code) {
      return res.status(400).json({ success: false, message: 'user_id, project_id, permission_code required' });
    }

    // Check current state
    const [existing] = await connection.query(
      `SELECT id, is_active FROM user_project_permissions 
       WHERE user_id = ? AND project_id = ? AND permission_code = ? AND revoked_at IS NULL`,
      [user_id, project_id, permission_code]
    );

    let newState, action;
    if (existing.length > 0 && existing[0].is_active) {
      // Currently ON → revoke it
      await connection.query(
        `UPDATE user_project_permissions SET is_active = 0, revoked_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND project_id = ? AND permission_code = ? AND is_active = 1`,
        [user_id, project_id, permission_code]
      );
      newState = false;
      action = 'REVOKE';
    } else {
      // Currently OFF or doesn't exist → grant it
      await connection.query(
        `INSERT INTO user_project_permissions 
         (user_id, project_id, permission_code, granted_by, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1, revoked_at = NULL, granted_by = VALUES(granted_by), granted_at = CURRENT_TIMESTAMP`,
        [user_id, project_id, permission_code, req.user.user_id]
      );
      newState = true;
      action = 'GRANT';
    }

    await connection.query(
      `INSERT INTO permission_audit_log 
       (action, user_id, project_id, permission_code, performed_by, reason, ip_address)
       VALUES (?, ?, ?, ?, ?, 'Toggled via admin panel', ?)`,
      [action, user_id, project_id, permission_code, req.user.user_id, req.ip]
    );

    await connection.commit();
    res.json({ success: true, is_granted: newState, message: `Permission ${action.toLowerCase()}d` });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// ── POST /api/admin/permissions/grant-viewer-full-access ────────────
// Quick action: grant viewer user full read-only workflow access
router.post('/permissions/grant-viewer-full-access', adminOnly, async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { user_id, project_id, reason } = req.body;
    const perms = ['can_view_project', 'can_view_full_workflow'];

    for (const code of perms) {
      await connection.query(
        `INSERT INTO user_project_permissions 
         (user_id, project_id, permission_code, granted_by, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1, revoked_at = NULL`,
        [user_id, project_id, code, req.user.user_id]
      );
    }

    await connection.query(
      `INSERT INTO permission_audit_log 
       (action, user_id, project_id, permission_code, performed_by, reason, ip_address)
       VALUES ('GRANT', ?, ?, 'can_view_full_workflow', ?, ?, ?)`,
      [user_id, project_id, req.user.user_id, reason || 'Viewer full workflow access', req.ip]
    );

    await connection.commit();
    res.json({ success: true, message: 'Viewer granted full read-only project access' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// ── GET /api/admin/permissions/audit-log ───────────────────────────
// Audit trail for all permission changes
router.get('/permissions/audit-log', adminOnly, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const [rows] = await db.query(`
      SELECT 
        pal.*,
        u.name AS user_name,
        pb.name AS performed_by_name,
        p.project_name
      FROM permission_audit_log pal
      LEFT JOIN users u ON pal.user_id = u.user_id
      LEFT JOIN users pb ON pal.performed_by = pb.user_id
      LEFT JOIN projects p ON pal.project_id = p.project_id
      ORDER BY pal.performed_at DESC
      LIMIT ?
    `, [limit]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

