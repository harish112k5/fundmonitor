const express = require('express');
const router = express.Router();
const db = require('../db');

// EMI Calculator
function calcEMI(principal, annualRate, months) {
  if (!months || months === 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

// Monthly Simple Interest
function calcMonthlyInterest(principal, annualRate) {
  return (principal * annualRate) / (12 * 100);
}

// GET /api/loans — all loans with enriched calculations
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pl.*,
        p.project_name,
        f.name AS financier_name,
        f.company AS financier_company,
        (pl.principal - COALESCE(pl.repaid_amount, 0)) AS outstanding_principal,
        COALESCE(
          (SELECT SUM(ip.amount) FROM interest_payments ip WHERE ip.loan_id = pl.id AND ip.status = 'Paid'),
          0
        ) AS total_interest_paid,
        COALESCE(
          (SELECT COUNT(*) FROM interest_payments ip WHERE ip.loan_id = pl.id AND ip.status = 'Overdue'),
          0
        ) AS overdue_count
      FROM project_loans pl
      JOIN projects p ON p.project_id = pl.project_id AND p.is_deleted = 0
      JOIN financiers f ON f.financier_id = pl.financier_id
      ORDER BY pl.start_date DESC
    `);

    // Add calculated fields
    const enriched = rows.map(loan => {
      const principal = parseFloat(loan.principal) || 0;
      const rate = parseFloat(loan.interest_rate) || 0;
      const tenure = parseInt(loan.tenure_months) || 12;
      return {
        ...loan,
        emi: loan.repayment_type === 'EMI'
          ? calcEMI(principal, rate, tenure).toFixed(2)
          : null,
        monthly_interest: calcMonthlyInterest(principal, rate).toFixed(2),
        total_repayable: loan.interest_type === 'Simple'
          ? (principal + (principal * rate * (tenure / 12) / 100)).toFixed(2)
          : principal.toFixed(2)
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/loans/project/:id
router.get('/project/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pl.*, f.name AS financier_name FROM project_loans pl
       JOIN financiers f ON f.financier_id = pl.financier_id
       WHERE pl.project_id = ? ORDER BY pl.start_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM project_loans WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/loans
router.post('/', async (req, res) => {
  try {
    const { project_id, financier_id, principal, interest_rate, interest_type,
            tenure_months, repayment_type, start_date, end_date, notes, created_by } = req.body;
    if (!project_id || !financier_id || !principal) {
      return res.status(400).json({ error: 'project_id, financier_id, principal required' });
    }

    if (!principal || isNaN(principal) || principal <= 0) {
      return res.status(400).json({ error: 'Principal must be a positive number' });
    }
    if (interest_rate < 0 || interest_rate > 100) {
      return res.status(400).json({ error: 'Interest rate must be between 0 and 100' });
    }
    if (tenure_months < 1 || tenure_months > 600) {
      return res.status(400).json({ error: 'Tenure must be between 1 and 600 months' });
    }

    const [result] = await db.query(
      `INSERT INTO project_loans
        (project_id, financier_id, principal, interest_rate, interest_type, tenure_months, repayment_type, start_date, end_date, repaid_amount, status, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'Active', ?, ?)`,
      [project_id, financier_id, principal, interest_rate || 0,
       interest_type || 'Simple', tenure_months || 12,
       repayment_type || 'Monthly', start_date || new Date().toISOString().split('T')[0],
       end_date || null, notes || null, created_by || null]
    );
    res.status(201).json({ id: result.insertId, message: 'Loan created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/loans/:id
router.put('/:id', async (req, res) => {
  try {
    const { project_id, financier_id, principal, interest_rate, interest_type,
            tenure_months, repayment_type, start_date, end_date, repaid_amount, status, notes } = req.body;
    // Full edit if all main fields provided
    if (project_id && financier_id && principal) {
      await db.query(
        `UPDATE project_loans SET project_id=?, financier_id=?, principal=?, interest_rate=?,
         interest_type=?, tenure_months=?, repayment_type=?, start_date=?, end_date=?,
         repaid_amount=?, status=?, notes=? WHERE id=?`,
        [project_id, financier_id, principal, interest_rate, interest_type, tenure_months,
         repayment_type, start_date, end_date, repaid_amount || 0, status || 'Active', notes, req.params.id]
      );
    } else {
      // Partial update (repayment/status only)
      await db.query(
        'UPDATE project_loans SET repaid_amount=?, status=?, notes=? WHERE id=?',
        [repaid_amount, status, notes, req.params.id]
      );
    }
    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/loans/:id
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM project_loans WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
