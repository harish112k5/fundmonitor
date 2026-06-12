const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

const billingSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  invoice_no: Joi.string().optional(),
  invoice_number: Joi.string().optional(),
  invoice_date: Joi.date().iso().optional(),
  billing_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().allow(null, '').optional(),
  billable_amount: Joi.number().positive().optional(),
  amount: Joi.number().positive().optional(),
  submitted_amount: Joi.number().min(0).optional(),
  certified_amount: Joi.number().min(0).optional(),
  payment_received: Joi.number().min(0).optional(),
  billing_stage: Joi.string().optional(),
  mb_reference: Joi.string().allow(null, '').optional(),
  rejection_amount: Joi.number().min(0).optional(),
  rejection_reason: Joi.string().allow(null, '').optional(),
  certified_date: Joi.date().iso().allow(null, '').optional(),
  payment_date: Joi.date().iso().allow(null, '').optional(),
  notes: Joi.string().allow(null, '').optional(),
  status: Joi.string().optional()
}).or('invoice_no', 'invoice_number').or('billable_amount', 'amount');

// GET all billing
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { project_id } = req.query;
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No accessible projects' });
  const placeholders = projectIds.map(() => '?').join(',');

  let query = `
    SELECT 
      b.billing_id,
      b.project_id,
      b.invoice_number,
      b.amount,
      b.status,
      b.billing_date,
      b.due_date,
      b.created_by,
      b.created_at,
      b.updated_at,
      p.project_name,
      p.estimated_budget AS tender_amount,
      u.name AS created_by_name
    FROM billing b
    JOIN projects p ON b.project_id = p.project_id AND p.is_deleted = 0
    LEFT JOIN users u ON b.created_by = u.user_id
    WHERE b.project_id IN (${placeholders})
  `;
  const params = [...projectIds];

  if (project_id) {
    query += ' AND b.project_id = ?';
    params.push(project_id);
  }

  query += ' ORDER BY b.created_at DESC';
  const [rows] = await db.query(query, params);

  res.json({ success: true, data: rows, message: 'Billing retrieved' });
}));

// GET by project
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await db.query(`
    SELECT b.*, u.name AS created_by_name
    FROM billing b
    LEFT JOIN users u ON b.created_by = u.user_id
    WHERE b.project_id = ?
    ORDER BY b.billing_date DESC
  `, [req.params.projectId]);
  res.json({ success: true, data: rows, message: 'Billing retrieved' });
}));

// GET single
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM billing WHERE billing_id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Bill not found' });
  
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, data: rows[0], message: 'Bill retrieved' });
}));

// POST create
router.post('/', authMiddleware, validate(billingSchema), asyncHandler(async (req, res) => {
  const fields = req.body;
  const invoice_number = fields.invoice_no || fields.invoice_number;
  const billing_date = fields.invoice_date || fields.billing_date;
  const amount = fields.billable_amount || fields.amount;
  const created_by = req.user?.user_id;

  if (!fields.project_id || !invoice_number || !amount) {
    return res.status(400).json({
      success: false,
      message: 'project_id, invoice_number, and amount are required'
    });
  }

  // Only insert columns that actually exist in the billing table
  const [result] = await db.query(
    `INSERT INTO billing (project_id, invoice_number, amount, status, billing_date, due_date, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      fields.project_id,
      invoice_number,
      amount,
      fields.status || 'pending',
      billing_date || null,
      fields.due_date || null,
      created_by || null
    ]
  );
  res.json({ success: true, data: { id: result.insertId, billing_id: result.insertId }, message: 'Billing record created' });
}));

// PUT update
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  // Map frontend field aliases to actual DB column names
  if (fields.invoice_no) fields.invoice_number = fields.invoice_no;
  if (fields.invoice_date) fields.billing_date = fields.invoice_date;
  if (fields.billable_amount && !fields.amount) fields.amount = fields.billable_amount;

  // Only update columns that actually exist in the billing table
  const validKeys = ['project_id', 'invoice_number', 'amount', 'status', 'billing_date', 'due_date'];

  const keys = Object.keys(fields).filter(k => validKeys.includes(k));
  const values = keys.map(k => fields[k]);
  const setClause = keys.map(k => `${k} = ?`).join(', ');

  if (keys.length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided' });
  }

  await db.query(
    `UPDATE billing SET ${setClause}, updated_at = NOW() WHERE billing_id = ?`,
    [...values, id]
  );
  res.json({ success: true, data: null, message: 'Billing record updated' });
}));

// DELETE
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  await db.query('DELETE FROM billing WHERE billing_id = ?', [req.params.id]);
  res.json({ success: true, data: null, message: 'Billing deleted' });
}));

module.exports = router;
