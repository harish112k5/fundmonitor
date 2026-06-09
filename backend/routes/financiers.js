const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/financiers — all financiers with loan summary
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        f.*,
        COALESCE(SUM(pl.principal), 0) AS total_funded,
        COALESCE(SUM(pl.principal - COALESCE(pl.repaid_amount, 0)), 0) AS outstanding,
        COUNT(DISTINCT pl.project_id) AS project_count,
        SUM(CASE WHEN pl.status = 'Closed' THEN 1 ELSE 0 END) AS closed_loans
      FROM financiers f
      LEFT JOIN project_loans pl ON pl.financier_id = f.financier_id
      GROUP BY f.financier_id
      ORDER BY f.financier_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM financiers WHERE financier_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Financier not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/financiers
router.post('/', async (req, res) => {
  try {
    const { name, company, phone, email, type, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const [result] = await db.query(
      'INSERT INTO financiers (name, company, phone, email, type, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, company || null, phone || null, email || null, type || 'Bank', address || null, notes || null]
    );
    res.status(201).json({ financier_id: result.insertId, message: 'Financier created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/financiers/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, company, phone, email, type, address, notes } = req.body;
    await db.query(
      'UPDATE financiers SET name=?, company=?, phone=?, email=?, type=?, address=?, notes=? WHERE financier_id=?',
      [name, company, phone, email, type, address, notes, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/financiers/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM financiers WHERE financier_id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
