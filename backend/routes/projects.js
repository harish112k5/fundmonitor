const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/auth');

// GET all projects (role-based filtering)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    let query = '';
    let params = [];

    if (role_id === 1 || role_id === 2) {
      // Admin + Manager: all projects
      query = `
        SELECT p.*, u.name AS created_by_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.user_id
        WHERE p.is_deleted = 0
        ORDER BY p.project_id DESC
      `;
    } else if (role_id === 3) {
      // Engineer: ONLY assigned projects
      query = `
        SELECT p.*, u.name AS created_by_name
        FROM projects p
        INNER JOIN project_team pt ON pt.project_id = p.project_id
        LEFT JOIN users u ON p.created_by = u.user_id
        WHERE pt.user_id = ? AND p.is_deleted = 0
        ORDER BY p.project_id DESC
      `;
      params = [user_id];
    } else {
      // Viewer / Other roles: all projects (read-only)
      query = `
        SELECT p.*, u.name AS created_by_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.user_id
        WHERE p.is_deleted = 0
        ORDER BY p.project_id DESC
      `;
    }

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single project
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, u.name AS created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.project_id = ? AND p.is_deleted = 0
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET full project details (all sub-tables in one call)
router.get('/:id/details', async (req, res) => {
  const pid = req.params.id;
  try {
    // 1. Project base info
    const [projectRows] = await db.query(`
      SELECT p.*, u.name AS created_by_name
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.project_id = ? AND p.is_deleted = 0
    `, [pid]);
    if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });
    const project = projectRows[0];

    // 2. Progress (latest entry)
    const [[progressRow]] = await db.query(`
      SELECT progress_percentage, remarks, month, year
      FROM project_progress
      WHERE project_id = ?
      ORDER BY year DESC, month DESC LIMIT 1
    `, [pid]);

    // 3. Financials — aggregate in parallel
    const [[matCost]] = await db.query(
      `SELECT COALESCE(SUM(quantity * unit_price), 0) AS cost FROM material_usage WHERE project_id = ?`, [pid]);
    const [[manCost]] = await db.query(
      `SELECT COALESCE(SUM(work_days * daily_rate), 0) AS cost FROM manpower_usage WHERE project_id = ?`, [pid]);
    const [[machCost]] = await db.query(
      `SELECT COALESCE(SUM(usage_hours * hourly_rate), 0) AS cost FROM machine_usage WHERE project_id = ?`, [pid]);
    const [[expCost]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS cost FROM expenses WHERE project_id = ?`, [pid]);
    const [[invTotal]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM project_investments WHERE project_id = ?`, [pid]);
    const [[loanTotal]] = await db.query(
      `SELECT COALESCE(SUM(principal), 0) AS total FROM project_loans WHERE project_id = ?`, [pid]);
    const [[pendingInt]] = await db.query(
      `SELECT COALESCE(SUM(ip.amount), 0) AS total
       FROM interest_payments ip
       JOIN project_loans pl ON ip.loan_id = pl.id
       WHERE pl.project_id = ? AND ip.status != 'paid'`, [pid]);
    const [[billingStats]] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_billed,
              SUM(CASE WHEN status != 'paid' THEN 1 ELSE 0 END) AS pending_count
       FROM billing WHERE project_id = ?`, [pid]);

    const actualCost = parseFloat(matCost.cost) + parseFloat(manCost.cost) +
                       parseFloat(machCost.cost) + parseFloat(expCost.cost);

    const financials = {
      actual_cost: actualCost,
      budget_variance: parseFloat(project.estimated_budget || 0) - actualCost,
      material_cost: parseFloat(matCost.cost),
      manpower_cost: parseFloat(manCost.cost),
      machine_cost: parseFloat(machCost.cost),
      expense_cost: parseFloat(expCost.cost),
      total_investments: parseFloat(invTotal.total),
      total_loans: parseFloat(loanTotal.total),
      pending_interest: parseFloat(pendingInt.total),
      total_billed: parseFloat(billingStats.total_billed),
      pending_invoices: parseInt(billingStats.pending_count, 10)
    };

    // 4. Material Usage
    const [material_usage] = await db.query(`
      SELECT mu.id, mu.material_id, mm.material_name, mu.quantity, mm.unit, mu.unit_price,
             ROUND(mu.quantity * mu.unit_price, 2) AS total_cost, mu.usage_date
      FROM material_usage mu
      JOIN materials_master mm ON mu.material_id = mm.material_id
      WHERE mu.project_id = ?
      ORDER BY mu.usage_date DESC
    `, [pid]);

    // 5. Manpower Usage
    const [manpower_usage] = await db.query(`
      SELECT mu.id, mu.worker_id, w.name AS worker_name, mu.work_days, mu.daily_rate,
             ROUND(mu.work_days * mu.daily_rate, 2) AS total_cost, mu.work_date
      FROM manpower_usage mu
      JOIN workers w ON mu.worker_id = w.worker_id
      WHERE mu.project_id = ?
      ORDER BY mu.work_date DESC
    `, [pid]);

    // 6. Machine Usage
    const [machine_usage] = await db.query(`
      SELECT mu.id, mu.machine_id, mm.machine_name, mu.usage_hours, mu.hourly_rate,
             ROUND(mu.usage_hours * mu.hourly_rate, 2) AS total_cost, mu.usage_date
      FROM machine_usage mu
      JOIN machines_master mm ON mu.machine_id = mm.machine_id
      WHERE mu.project_id = ?
      ORDER BY mu.usage_date DESC
    `, [pid]);

    // 7. Project Team
    const [team] = await db.query(`
      SELECT u.name AS user_name, pt.role, pt.joined_at AS assigned_date
      FROM project_team pt
      JOIN users u ON pt.user_id = u.user_id
      WHERE pt.project_id = ?
      ORDER BY pt.joined_at DESC
    `, [pid]);

    // 8. Billing
    const [billing] = await db.query(`
      SELECT invoice_number, amount, status, due_date
      FROM billing
      WHERE project_id = ?
      ORDER BY due_date DESC
    `, [pid]);

    // 9. Expenses
    const [expenses] = await db.query(`
      SELECT ec.category_name, e.description, e.amount, e.expense_date
      FROM expenses e
      JOIN expense_categories ec ON e.category_id = ec.category_id
      WHERE e.project_id = ?
      ORDER BY e.expense_date DESC
    `, [pid]);

    res.json({
      project,
      progress: progressRow || null,
      financials,
      material_usage,
      manpower_usage,
      machine_usage,
      team,
      billing,
      expenses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create project
router.post('/', async (req, res) => {
  try {
    const { project_name, location, start_date, end_date, estimated_budget, status, created_by } = req.body;
    const [result] = await db.query(
      `INSERT INTO projects (project_name, location, start_date, end_date, estimated_budget, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [project_name, location || null, start_date || null, end_date || null, estimated_budget || null, status || 'ongoing', created_by]
    );
    res.status(201).json({ project_id: result.insertId, project_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update project
router.put('/:id', async (req, res) => {
  try {
    const { project_name, location, start_date, end_date, estimated_budget, status } = req.body;
    await db.query(
      `UPDATE projects SET project_name = ?, location = ?, start_date = ?, end_date = ?,
       estimated_budget = ?, status = ? WHERE project_id = ?`,
      [project_name, location || null, start_date || null, end_date || null, estimated_budget || null, status, req.params.id]
    );
    res.json({ message: 'Project updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete('/:id', roleGuard('admin', 'manager'), async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.user_id;
  const userName = req.user.name || 'Unknown';

  try {
    // 1. Fetch project name
    const [proj] = await db.query('SELECT project_name FROM projects WHERE project_id = ?', [projectId]);
    if (proj.length === 0) return res.status(404).json({ error: 'Project not found' });
    const projectName = proj[0].project_name;

    // 2. Soft delete project
    await db.query(
      'UPDATE projects SET is_deleted = 1, deleted_at = NOW(), deleted_by = ? WHERE project_id = ?',
      [userId, projectId]
    );

    // 3. Log to recycle_bin
    await db.query(`
      INSERT INTO recycle_bin (project_id, project_name, deleted_by_user, deleted_by_name, deleted_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [projectId, projectName, userId, userName]);

    res.json({ success: true, message: 'Project moved to Recycle Bin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
