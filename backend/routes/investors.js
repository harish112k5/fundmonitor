const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/investors — all investors with portfolio summary
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        i.*,
        COALESCE(SUM(pi.amount), 0) AS total_invested,
        COALESCE(SUM(pi.repaid_amount), 0) AS total_repaid,
        COALESCE(SUM(pi.amount) - SUM(pi.repaid_amount), 0) AS pending_return,
        COUNT(DISTINCT pi.project_id) AS project_count
      FROM investors i
      LEFT JOIN project_investments pi ON pi.investor_id = i.investor_id
      GROUP BY i.investor_id
      ORDER BY i.investor_id DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/investors/:id — single investor with all investments
router.get('/:id', async (req, res) => {
  try {
    const [investorRows] = await db.query('SELECT * FROM investors WHERE investor_id = ?', [req.params.id]);
    if (investorRows.length === 0) return res.status(404).json({ error: 'Investor not found' });
    const investor = investorRows[0];

    const [investments] = await db.query(`
      SELECT pi.*, p.project_name, p.status AS project_status
      FROM project_investments pi
      JOIN projects p ON p.project_id = pi.project_id
      WHERE pi.investor_id = ?
      ORDER BY pi.investment_date DESC
    `, [req.params.id]);

    const total_invested = investments.reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const total_repaid = investments.reduce((s, i) => s + parseFloat(i.repaid_amount || 0), 0);

    res.json({ ...investor, investments, total_invested, total_repaid, pending_return: total_invested - total_repaid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/investors
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, pan, gst, type, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN format. Expected: ABCDE1234F' });
    }
    if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid GST format' });
    }

    const [result] = await db.query(
      'INSERT INTO investors (name, phone, email, pan, gst, type, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, phone || null, email || null, pan || null, gst || null, type || 'Individual', address || null, notes || null]
    );
    res.status(201).json({ investor_id: result.insertId, message: 'Investor created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/investors/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, pan, gst, type, address, notes } = req.body;
    
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid PAN format. Expected: ABCDE1234F' });
    }
    if (gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid GST format' });
    }

    await db.query(
      'UPDATE investors SET name=?, phone=?, email=?, pan=?, gst=?, type=?, address=?, notes=? WHERE investor_id=?',
      [name, phone, email, pan, gst, type, address, notes, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/investors/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM investors WHERE investor_id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
