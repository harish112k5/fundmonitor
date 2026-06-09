const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/interest-payments — with auto-overdue detection
router.get('/', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Auto-mark overdue payments
    await db.query(
      `UPDATE interest_payments
       SET status = 'Overdue',
           delay_days = DATEDIFF(CURDATE(), due_date),
           penalty = ROUND(amount * 0.02 * DATEDIFF(CURDATE(), due_date) / 30, 2)
       WHERE status = 'Pending' AND due_date < ?`,
      [today]
    );

    const [rows] = await db.query(`
      SELECT
        ip.*,
        pl.principal,
        pl.interest_rate,
        pl.interest_type,
        p.project_name,
        f.name AS financier_name
      FROM interest_payments ip
      JOIN project_loans pl ON pl.id = ip.loan_id
      JOIN projects p ON p.project_id = pl.project_id AND p.is_deleted = 0
      JOIN financiers f ON f.financier_id = pl.financier_id
      ORDER BY ip.due_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET by loan
router.get('/loan/:loanId', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM interest_payments WHERE loan_id = ? ORDER BY due_date DESC',
      [req.params.loanId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM interest_payments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Payment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/interest-payments
router.post('/', async (req, res) => {
  try {
    const { loan_id, amount, due_date, notes, created_by } = req.body;
    if (!loan_id || !amount || !due_date) {
      return res.status(400).json({ error: 'loan_id, amount, due_date required' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }
    const today = new Date().toISOString().split('T')[0];
    const status = due_date < today ? 'Overdue' : 'Pending';
    const delay_days = due_date < today ? Math.floor((new Date(today) - new Date(due_date)) / 86400000) : 0;
    const penalty = delay_days > 0 ? (amount * 0.02 * delay_days / 30).toFixed(2) : 0;

    const [result] = await db.query(
      `INSERT INTO interest_payments (loan_id, amount, due_date, status, delay_days, penalty, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [loan_id, amount, due_date, status, delay_days, penalty, notes || null, created_by || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Interest payment recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/interest-payments/:id/pay — mark as paid
router.patch('/:id/pay', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    await db.query(
      `UPDATE interest_payments SET status='Paid', paid_date=?, delay_days=0, penalty=0 WHERE id=?`,
      [today, req.params.id]
    );
    res.json({ message: 'Marked as paid' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/interest-payments/:id — general update
router.put('/:id', async (req, res) => {
  try {
    const { loan_id, amount, due_date, status, payment_date, notes } = req.body;
    await db.query(
      'UPDATE interest_payments SET loan_id=?, amount=?, due_date=?, status=?, paid_date=?, notes=? WHERE id=?',
      [loan_id, amount, due_date, status, payment_date || null, notes, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/interest-payments/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM interest_payments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
