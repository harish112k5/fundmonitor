const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// GET all users (with role name)
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, r.role_name, 
             u.is_deleted, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.is_deleted = 0
      ORDER BY u.user_id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single user
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role_id, r.role_name,
             u.is_deleted, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = ? AND u.is_deleted = 0
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const { name, email, password_hash, role_id } = req.body;
    let finalHash = 'temp_hash';
    if (password_hash) {
      const salt = await bcrypt.genSalt(10);
      finalHash = await bcrypt.hash(password_hash, salt);
    }
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, finalHash, role_id]
    );
    res.status(201).json({ user_id: result.insertId, name, email, role_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role_id } = req.body;
    await db.query(
      'UPDATE users SET name = ?, email = ?, role_id = ? WHERE user_id = ?',
      [name, email, role_id, req.params.id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    await db.query(
      'UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE user_id = ?',
      [req.params.id]
    );
    res.json({ message: 'User soft-deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
