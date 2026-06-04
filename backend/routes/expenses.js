const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

// GET all expenses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    const projectIds = await getAllowedProjectIds(user_id, role_id);
    if (projectIds.length === 0) return res.json([]);
    const placeholders = projectIds.map(() => '?').join(',');

    const [rows] = await db.query(`
      SELECT e.*, p.project_name, ec.category_name, u.name AS recorded_by_name
      FROM expenses e
      JOIN projects p ON e.project_id = p.project_id AND p.is_deleted = 0
      JOIN expense_categories ec ON e.category_id = ec.category_id
      LEFT JOIN users u ON e.recorded_by = u.user_id
      WHERE e.project_id IN (${placeholders})
      ORDER BY e.expense_date DESC
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
      SELECT e.*, ec.category_name, u.name AS recorded_by_name
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.category_id
      LEFT JOIN users u ON e.recorded_by = u.user_id
      WHERE e.project_id = ?
      ORDER BY e.expense_date DESC
    `, [req.params.projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM expenses WHERE expense_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    
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
    const { project_id, category_id, amount, description, expense_date, recorded_by } = req.body;
    const [result] = await db.query(
      `INSERT INTO expenses (project_id, category_id, amount, description, expense_date, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project_id, category_id, amount, description || null, expense_date, recorded_by || null]
    );
    res.status(201).json({ expense_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { project_id, category_id, amount, description, expense_date, recorded_by } = req.body;
    await db.query(
      `UPDATE expenses SET project_id = ?, category_id = ?, amount = ?,
       description = ?, expense_date = ?, recorded_by = ? WHERE expense_id = ?`,
      [project_id, category_id, amount, description || null, expense_date, recorded_by || null, req.params.id]
    );
    res.json({ message: 'Expense updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE expense_id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
