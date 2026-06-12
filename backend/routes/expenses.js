const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

const expenseSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  category_id: Joi.number().integer().required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().allow('', null).optional(),
  expense_date: Joi.date().iso().required(),
  recorded_by: Joi.number().integer().optional()
});

// GET all expenses
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No projects accessible' });
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
  res.json({ success: true, data: rows, message: 'Expenses retrieved' });
}));

// GET by project
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await db.query(`
    SELECT e.*, ec.category_name, u.name AS recorded_by_name
    FROM expenses e
    JOIN expense_categories ec ON e.category_id = ec.category_id
    LEFT JOIN users u ON e.recorded_by = u.user_id
    WHERE e.project_id = ?
    ORDER BY e.expense_date DESC
  `, [req.params.projectId]);
  res.json({ success: true, data: rows, message: 'Expenses retrieved' });
}));

// GET single
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM expenses WHERE expense_id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Expense not found' });
  
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, data: rows[0], message: 'Expense retrieved' });
}));

// POST create
router.post('/', validate(expenseSchema), asyncHandler(async (req, res) => {
  const { project_id, category_id, amount, description, expense_date, recorded_by } = req.body;
  const [result] = await db.query(
    `INSERT INTO expenses (project_id, category_id, amount, description, expense_date, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [project_id, category_id, amount, description || null, expense_date, recorded_by || null]
  );
  res.status(201).json({ success: true, data: { expense_id: result.insertId }, message: 'Expense logged' });
}));

// PUT update
router.put('/:id', validate(expenseSchema), asyncHandler(async (req, res) => {
  const { project_id, category_id, amount, description, expense_date, recorded_by } = req.body;
  await db.query(
    `UPDATE expenses SET project_id = ?, category_id = ?, amount = ?,
     description = ?, expense_date = ?, recorded_by = ? WHERE expense_id = ?`,
    [project_id, category_id, amount, description || null, expense_date, recorded_by || null, req.params.id]
  );
  res.json({ success: true, data: null, message: 'Expense updated' });
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM expenses WHERE expense_id = ?', [req.params.id]);
  res.json({ success: true, data: null, message: 'Expense deleted' });
}));

module.exports = router;
