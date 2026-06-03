const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // BLOCK: No self-registration as admin (role_id = 1)
    const userRoleId = parseInt(role_id) || 4;
    if (userRoleId === 1) {
      return res.status(403).json({ error: 'Admin accounts cannot be self-registered' });
    }

    // BLOCK: Only valid roles allowed (2=manager, 3=engineer, 4=viewer)
    const allowedRoles = [2, 3, 4, 5];
    if (!allowedRoles.includes(userRoleId)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // is_approved = 0 by default — admin must approve before user can login
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id, is_active, is_approved) VALUES (?, ?, ?, ?, 1, 0)',
      [name, email, password_hash, userRoleId]
    );

    res.status(201).json({
      message: 'Account created. Awaiting admin approval.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, r.role_name, u.is_active, u.is_approved
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ? AND u.is_deleted = 0
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check blocked BEFORE password
    if (user.is_active === 0 || !user.is_active) {
      return res.status(403).json({ code: 'ACCOUNT_BLOCKED', error: 'Account suspended' });
    }

    // No is_approved gate here — users are gated at DATA level (project assignment)

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
      message: 'Login successful',
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — get current user from token
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, u.is_active, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.is_deleted = 0
    `, [decoded.user_id]);

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    // Reject token if user has been blocked since it was issued
    if (!users[0].is_active) {
      return res.status(403).json({ error: 'Account is blocked.' });
    }

    res.json(users[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/logout — mark session as ended
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // Mark the specific session as logged_out
        if (decoded.session_id) {
          await db.query(
            `UPDATE session_log SET status = 'logged_out', logout_time = NOW()
             WHERE session_id = ?`,
            [decoded.session_id]
          );
        } else {
          // Fallback: mark the most recent active session for this user
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
    res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
