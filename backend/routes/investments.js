const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/investments — all with enriched data
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pi.*,
        p.project_name,
        p.status AS project_status,
        i.name AS investor_name,
        i.type AS investor_type,
        (pi.amount - COALESCE(pi.repaid_amount, 0)) AS pending_amount,
        CASE
          WHEN COALESCE(pi.repaid_amount, 0) >= pi.amount THEN 'Closed'
          WHEN pi.status = 'Active' THEN 'Active'
          ELSE COALESCE(pi.status, 'Active')
        END AS derived_status
      FROM project_investments pi
      JOIN projects p ON p.project_id = pi.project_id AND p.is_deleted = 0
      JOIN investors i ON i.investor_id = pi.investor_id
      ORDER BY pi.investment_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/investments/project/:id
router.get('/project/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT pi.*, i.name AS investor_name
      FROM project_investments pi
      JOIN investors i ON i.investor_id = pi.investor_id
      WHERE pi.project_id = ?
      ORDER BY pi.investment_date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM project_investments WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Investment not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/investments
router.post('/', async (req, res) => {
  try {
    const { project_id, investor_id, amount, investment_date, return_type, expected_return, lock_in_months, notes, created_by } = req.body;
    if (!project_id || !investor_id || !amount) {
      return res.status(400).json({ error: 'project_id, investor_id, amount required' });
    }
    const [result] = await db.query(
      `INSERT INTO project_investments
        (project_id, investor_id, amount, investment_date, return_type, expected_return, lock_in_months, repaid_amount, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Active', ?, ?)`,
      [project_id, investor_id, amount, investment_date || new Date().toISOString().split('T')[0],
       return_type || 'Fixed', expected_return || 0, lock_in_months || 0, notes || null, created_by || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Investment recorded' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/investments/:id — update repayment
router.put('/:id', async (req, res) => {
  try {
    const { repaid_amount, status, notes, project_id, investor_id, amount, investment_date } = req.body;
    // If full edit fields provided
    if (project_id && investor_id && amount) {
      await db.query(
        `UPDATE project_investments SET project_id=?, investor_id=?, amount=?,
         investment_date=?, repaid_amount=?, status=?, notes=? WHERE id=?`,
        [project_id, investor_id, amount, investment_date, repaid_amount || 0, status || 'Active', notes, req.params.id]
      );
    } else {
      // Partial update (repayment only)
      await db.query(
        'UPDATE project_investments SET repaid_amount=?, status=?, notes=? WHERE id=?',
        [repaid_amount, status, notes, req.params.id]
      );
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/investments/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM project_investments WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
