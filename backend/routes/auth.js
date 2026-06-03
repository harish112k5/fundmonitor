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
      SELECT u.user_id, u.name, u.email, u.password_hash, u.role_id, u.is_active, r.role_name
      FROM users u JOIN roles r ON u.role_id = r.role_id
      WHERE u.email = ? AND u.is_deleted = 0
    `, [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user is blocked
    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact the administrator.' });
    }

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

    // Update last_login and record session
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    const ua = req.headers['user-agent'] || null;
    await db.query(`UPDATE users SET last_login = NOW() WHERE user_id = ?`, [user.user_id]);
    await db.query(
      `INSERT INTO session_log (session_id, user_id, login_time, ip_address, user_agent, status)
       VALUES (?, ?, NOW(), ?, ?, 'active')`,
      [sessionId, user.user_id, ip, ua]
    );

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

module.exports = router;
