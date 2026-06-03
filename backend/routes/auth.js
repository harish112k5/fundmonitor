const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role_id } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email already exists
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Default role_id = 4 (viewer) if not provided
    const userRoleId = role_id || 4;

    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, userRoleId]
    );

    // Generate token
    const [userRows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ?
    `, [result.insertId]);

    const user = userRows[0];
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name }
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
      SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, r.role_name, u.is_active
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ? AND u.is_deleted = 0
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check blocked BEFORE password
    if (user.is_active === 0) {
      return res.status(403).json({ code: 'ACCOUNT_BLOCKED', error: 'Account suspended' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { user_id: user.user_id, name: user.name, email: user.email, role_id: user.role_id, role_name: user.role_name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    try {
      // Log session
      await db.query(
        'INSERT INTO session_log (session_id, user_id, ip_address, login_time, status) VALUES (UUID(), ?, ?, NOW(), ?)',
        [user.user_id, req.ip, 'active']
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
      SELECT u.user_id, u.name, u.email, u.role_id, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.is_deleted = 0
    `, [decoded.user_id]);

    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
