const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

// GET all billing
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    const projectIds = await getAllowedProjectIds(user_id, role_id);
    if (projectIds.length === 0) return res.json([]);
    const placeholders = projectIds.map(() => '?').join(',');

    const [rows] = await db.query(`
      SELECT b.*, p.project_name, u.name AS created_by_name
      FROM billing b
      JOIN projects p ON b.project_id = p.project_id AND p.is_deleted = 0
      LEFT JOIN users u ON b.created_by = u.user_id
      WHERE b.project_id IN (${placeholders})
      ORDER BY b.billing_date DESC
    `, projectIds);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by project
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const [rows] = await db.query(`
      SELECT b.*, u.name AS created_by_name
      FROM billing b
      LEFT JOIN users u ON b.created_by = u.user_id
      WHERE b.project_id = ?
      ORDER BY b.billing_date DESC
    `, [req.params.projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM billing WHERE billing_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Bill not found' });
    
    const { user_id, role_id } = req.user;
    const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { project_id, invoice_number, amount, status, billing_date, due_date, created_by } = req.body;
    const [result] = await db.query(
      `INSERT INTO billing (project_id, invoice_number, amount, status, billing_date, due_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project_id, invoice_number, amount, status || 'draft', billing_date, due_date || null, created_by || null]
    );
    res.status(201).json({ billing_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { project_id, invoice_number, amount, status, billing_date, due_date } = req.body;
    await db.query(
      `UPDATE billing SET project_id = ?, invoice_number = ?, amount = ?,
       status = ?, billing_date = ?, due_date = ? WHERE billing_id = ?`,
      [project_id, invoice_number, amount, status, billing_date, due_date || null, req.params.id]
    );
    res.json({ message: 'Billing updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM billing WHERE billing_id = ?', [req.params.id]);
    res.json({ message: 'Billing deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
