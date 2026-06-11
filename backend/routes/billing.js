const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

// GET all billing
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { project_id } = req.query;
    const { user_id, role_id } = req.user;
    const projectIds = await getAllowedProjectIds(user_id, role_id);
    if (projectIds.length === 0) return res.json([]);
    const placeholders = projectIds.map(() => '?').join(',');

    let query = `
      SELECT 
        b.*,
        p.project_name,
        p.tender_amount,
        p.work_completed_percent,
        -- Computed fields
        (b.submitted_amount - b.certified_amount)  AS pending_approval,
        (b.certified_amount  - b.payment_received) AS pending_payment,
        (b.billable_amount   - b.payment_received) AS total_outstanding,
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
    
    // Support the existing format expecting an array, or the new one
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('GET /billing error:', err);
    res.status(500).json({ success: false, message: err.message, error: err.message });
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
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      project_id,
      invoice_no,
      invoice_date,
      due_date,
      billable_amount,
      submitted_amount,
      certified_amount,
      payment_received,
      billing_stage,
      mb_reference,
      rejection_amount,
      rejection_reason,
      certified_date,
      payment_date,
      notes
    } = req.body;

    const invoice_number = invoice_no || req.body.invoice_number;
    const billing_date = invoice_date || req.body.billing_date;
    const amount = billable_amount || req.body.amount;
    const created_by = req.user?.user_id;

    if (!project_id || !invoice_number || !amount) {
      return res.status(400).json({
        success: false,
        message: 'project_id, invoice_number, and billable_amount are required'
      });
    }

    const [result] = await db.query(
      `INSERT INTO billing (
        project_id, invoice_number, amount, status, billing_date, due_date, created_by,
        billable_amount, submitted_amount, certified_amount,
        payment_received, billing_stage, mb_reference,
        rejection_amount, rejection_reason, certified_date,
        payment_date
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        project_id, invoice_number, amount, 'active', billing_date || null, due_date || null, created_by || null,
        billable_amount || 0,
        submitted_amount || 0,
        certified_amount || 0,
        payment_received || 0,
        billing_stage || 'BILLABLE',
        mb_reference || null,
        rejection_amount || 0,
        rejection_reason || null,
        certified_date || null,
        payment_date || null
      ]
    );
    res.json({ success: true, message: 'Billing record created', id: result.insertId, billing_id: result.insertId });
  } catch (err) {
    console.error('POST /billing error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    
    // Auto-advance billing_stage based on amounts if not explicitly set
    if (!fields.billing_stage) {
      if (fields.payment_received > 0) {
        const certified = parseFloat(fields.certified_amount || 0);
        const received  = parseFloat(fields.payment_received || 0);
        fields.billing_stage = received >= certified ? 'PAYMENT_RECEIVED' : 'PARTIALLY_PAID';
      } else if (fields.certified_amount > 0) {
        fields.billing_stage = 'CERTIFIED';
      } else if (fields.submitted_amount > 0) {
        fields.billing_stage = 'SUBMITTED';
      }
    }

    // Map frontend fields to db fields if they mismatch
    if (fields.invoice_no) fields.invoice_number = fields.invoice_no;
    if (fields.invoice_date) fields.billing_date = fields.invoice_date;
    if (fields.billable_amount) fields.amount = fields.billable_amount;

    const validKeys = [
      'project_id', 'invoice_number', 'amount', 'status', 'billing_date', 'due_date',
      'billable_amount', 'submitted_amount', 'certified_amount', 'payment_received',
      'billing_stage', 'mb_reference', 'rejection_amount', 'rejection_reason',
      'certified_date', 'payment_date'
    ];
    
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
    res.json({ success: true, message: 'Billing record updated' });
  } catch (err) {
    console.error('PUT /billing error:', err);
    res.status(500).json({ success: false, message: err.message });
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
