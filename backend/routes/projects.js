const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware, roleGuard } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');

const projectSchema = Joi.object({
  project_name: Joi.string().required(),
  location: Joi.string().allow('', null).optional(),
  start_date: Joi.date().iso().allow('', null).optional(),
  end_date: Joi.date().iso().allow('', null).optional(),
  estimated_budget: Joi.number().min(0).allow('', null).optional(),
  status: Joi.string().valid('ongoing', 'completed', 'on_hold').optional(),
  created_by: Joi.number().integer().required()
});

// GET /api/projects/my-projects
router.get('/my-projects', asyncHandler(async (req, res) => {
  const { user_id } = req.user;
  const [rows] = await db.query(`
    SELECT p.*, u.name AS created_by_name, pt.role AS team_role
    FROM projects p
    JOIN project_team pt ON pt.project_id = p.project_id AND pt.user_id = ?
    LEFT JOIN users u ON p.created_by = u.user_id
    WHERE p.is_deleted = 0
    ORDER BY p.project_id DESC
  `, [user_id]);
  res.json({ success: true, data: rows, message: 'My projects retrieved' });
}));

// GET /api/projects
router.get('/', asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;

  // Admin(1): see all projects
  if (role_id === 1) {
    const [rows] = await db.query(`
      SELECT p.*, u.name AS created_by_name
      FROM projects p LEFT JOIN users u ON p.created_by = u.user_id
      WHERE p.is_deleted = 0 ORDER BY p.project_id DESC
    `);
    return res.json({ success: true, data: rows, message: 'All projects retrieved' });
  }

  // Accountant(4): no project access
  if (role_id === 4) {
    return res.json({ success: true, data: [], message: 'No access to projects' });
  }

  // Manager(2), Engineer(3), Supervisor(5), Viewer(6): assigned projects only
  const [rows] = await db.query(`
    SELECT p.*, u.name AS created_by_name, pt.role AS team_role
    FROM projects p
    JOIN project_team pt ON pt.project_id = p.project_id AND pt.user_id = ?
    LEFT JOIN users u ON p.created_by = u.user_id
    WHERE p.is_deleted = 0
    ORDER BY p.project_id DESC
  `, [user_id]);
  return res.json({ success: true, data: rows, message: 'Assigned projects retrieved' });
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.*, u.name AS created_by_name
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.user_id
    WHERE p.project_id = ? AND p.is_deleted = 0
  `, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
  res.json({ success: true, data: rows[0], message: 'Project retrieved' });
}));

// GET /api/projects/:id/details
router.get('/:id/details', asyncHandler(async (req, res) => {
  const pid = req.params.id;

  // 1. Project base info
  const [projectRows] = await db.query(`
    SELECT p.*, u.name AS created_by_name
    FROM projects p
    LEFT JOIN users u ON p.created_by = u.user_id
    WHERE p.project_id = ? AND p.is_deleted = 0
  `, [pid]);
  
  if (projectRows.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
  const project = projectRows[0];

  // Optimize multiple queries by running them concurrently with Promise.all
  const [
    [[progressRow]], [[matCost]], [[manCost]], [[machCost]], [[expCost]], [[invTotal]], [[loanTotal]], [[pendingInt]], [[billingStats]],
    [material_usage], [manpower_usage], [machine_usage], [team], [billing], [expenses]
  ] = await Promise.all([
    db.query(`SELECT progress_percentage, remarks, month, year FROM project_progress WHERE project_id = ? ORDER BY year DESC, month DESC LIMIT 1`, [pid]),
    db.query(`SELECT COALESCE(SUM(quantity * unit_price), 0) AS cost FROM material_usage WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(work_days * daily_rate), 0) AS cost FROM manpower_usage WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(usage_hours * hourly_rate), 0) AS cost FROM machine_usage WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS cost FROM expenses WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM project_investments WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(principal), 0) AS total FROM project_loans WHERE project_id = ?`, [pid]),
    db.query(`SELECT COALESCE(SUM(ip.amount), 0) AS total FROM interest_payments ip JOIN project_loans pl ON ip.loan_id = pl.id WHERE pl.project_id = ? AND ip.status != 'paid'`, [pid]),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total_billed, SUM(CASE WHEN status != 'paid' THEN 1 ELSE 0 END) AS pending_count FROM billing WHERE project_id = ?`, [pid]),
    db.query(`SELECT mu.id, mu.material_id, mm.material_name, mu.quantity, mm.unit, mu.unit_price, ROUND(mu.quantity * mu.unit_price, 2) AS total_cost, mu.usage_date FROM material_usage mu JOIN materials_master mm ON mu.material_id = mm.material_id WHERE mu.project_id = ? ORDER BY mu.usage_date DESC`, [pid]),
    db.query(`SELECT mu.id, mu.worker_id, w.name AS worker_name, mu.work_days, mu.daily_rate, ROUND(mu.work_days * mu.daily_rate, 2) AS total_cost, mu.work_date FROM manpower_usage mu JOIN workers w ON mu.worker_id = w.worker_id WHERE mu.project_id = ? ORDER BY mu.work_date DESC`, [pid]),
    db.query(`SELECT mu.id, mu.machine_id, mm.machine_name, mu.usage_hours, mu.hourly_rate, ROUND(mu.usage_hours * mu.hourly_rate, 2) AS total_cost, mu.usage_date FROM machine_usage mu JOIN machines_master mm ON mu.machine_id = mm.machine_id WHERE mu.project_id = ? ORDER BY mu.usage_date DESC`, [pid]),
    db.query(`SELECT u.name AS user_name, pt.role, pt.joined_at AS assigned_date FROM project_team pt JOIN users u ON pt.user_id = u.user_id WHERE pt.project_id = ? ORDER BY pt.joined_at DESC`, [pid]),
    db.query(`SELECT invoice_number, amount, status, due_date FROM billing WHERE project_id = ? ORDER BY due_date DESC`, [pid]),
    db.query(`SELECT ec.category_name, e.description, e.amount, e.expense_date FROM expenses e JOIN expense_categories ec ON e.category_id = ec.category_id WHERE e.project_id = ? ORDER BY e.expense_date DESC`, [pid])
  ]);

  const actualCost = parseFloat(matCost.cost) + parseFloat(manCost.cost) + parseFloat(machCost.cost) + parseFloat(expCost.cost);

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

  res.json({
    success: true,
    data: {
      project,
      progress: progressRow || null,
      financials,
      material_usage,
      manpower_usage,
      machine_usage,
      team,
      billing,
      expenses
    },
    message: 'Project details retrieved'
  });
}));

// POST /api/projects
router.post('/', validate(projectSchema), asyncHandler(async (req, res) => {
  const { project_name, location, start_date, end_date, estimated_budget, status, created_by } = req.body;
  const [result] = await db.query(
    `INSERT INTO projects (project_name, location, start_date, end_date, estimated_budget, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [project_name, location || null, start_date || null, end_date || null, estimated_budget || null, status || 'ongoing', created_by]
  );
  res.status(201).json({ success: true, data: { project_id: result.insertId, project_name }, message: 'Project created' });
}));

// PUT /api/projects/:id
router.put('/:id', validate(projectSchema), asyncHandler(async (req, res) => {
  const { project_name, location, start_date, end_date, estimated_budget, status } = req.body;
  await db.query(
    `UPDATE projects SET project_name = ?, location = ?, start_date = ?, end_date = ?,
     estimated_budget = ?, status = ? WHERE project_id = ?`,
    [project_name, location || null, start_date || null, end_date || null, estimated_budget || null, status, req.params.id]
  );
  res.json({ success: true, data: null, message: 'Project updated' });
}));

// DELETE /api/projects/:id (soft delete)
router.delete('/:id', roleGuard('admin', 'manager'), asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const userId = req.user.user_id;
  const userName = req.user.name || 'Unknown';

  const [proj] = await db.query('SELECT project_name FROM projects WHERE project_id = ?', [projectId]);
  if (proj.length === 0) return res.status(404).json({ success: false, message: 'Project not found' });
  const projectName = proj[0].project_name;

  await db.query(
    'UPDATE projects SET is_deleted = 1, deleted_at = NOW(), deleted_by = ? WHERE project_id = ?',
    [userId, projectId]
  );

  await db.query(`
    INSERT INTO recycle_bin (project_id, project_name, deleted_by_user, deleted_by_name, deleted_at)
    VALUES (?, ?, ?, ?, NOW())
  `, [projectId, projectName, userId, userName]);

  res.json({ success: true, data: null, message: 'Project moved to Recycle Bin' });
}));

// GET /api/projects/:id/finance-summary
router.get('/:id/finance-summary', asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  const [[project]] = await db.query(
    `SELECT project_id, project_name, estimated_budget AS tender_amount,
            start_date, end_date, status
     FROM projects WHERE project_id = ? AND is_deleted = 0`,
    [projectId]
  );
  if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

  // Optimize multiple queries
  const [
    [[billingSummary]], [[materialCost]], [[manpowerCost]], [[machineCost]], [[expenseCost]], [[investments]], [[loans]], [billingRecords]
  ] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total_invoices, SUM(billable_amount) AS total_billable, SUM(submitted_amount) AS total_submitted, SUM(certified_amount) AS total_certified, SUM(payment_received) AS total_received, SUM(rejection_amount) AS total_rejected, SUM(submitted_amount - certified_amount) AS pending_approval, SUM(certified_amount - payment_received) AS pending_payment FROM billing WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(quantity * unit_price),0) AS cost FROM material_usage WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(work_days * daily_rate),0) AS cost FROM manpower_usage WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(usage_hours * hourly_rate),0) AS cost FROM machine_usage WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(amount),0) AS cost FROM expenses WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(amount),0) AS total FROM project_investments WHERE project_id = ?`, [projectId]),
    db.query(`SELECT COALESCE(SUM(principal),0) AS total FROM project_loans WHERE project_id = ?`, [projectId]),
    db.query(`SELECT * FROM billing WHERE project_id = ? ORDER BY billing_date DESC`, [projectId])
  ]);

  const actualCost = parseFloat(materialCost.cost) + parseFloat(manpowerCost.cost) + parseFloat(machineCost.cost) + parseFloat(expenseCost.cost);

  res.json({
    success: true,
    data: {
      project,
      billing_summary: {
        ...billingSummary,
        total_billable:   parseFloat(billingSummary?.total_billable  || 0),
        total_submitted:  parseFloat(billingSummary?.total_submitted || 0),
        total_certified:  parseFloat(billingSummary?.total_certified || 0),
        total_received:   parseFloat(billingSummary?.total_received  || 0),
        pending_approval: parseFloat(billingSummary?.pending_approval|| 0),
        pending_payment:  parseFloat(billingSummary?.pending_payment || 0),
      },
      actual_cost: {
        material:  parseFloat(materialCost.cost),
        manpower:  parseFloat(manpowerCost.cost),
        machine:   parseFloat(machineCost.cost),
        expenses:  parseFloat(expenseCost.cost),
        total:     actualCost
      },
      investments: parseFloat(investments.total),
      loans:       parseFloat(loans.total),
      billing_records: billingRecords,
      computed: {
        net_profit: parseFloat(billingSummary?.total_certified || 0) - actualCost,
        budget_utilization: parseFloat(project.tender_amount || 0) > 0
          ? ((actualCost / parseFloat(project.tender_amount)) * 100).toFixed(1)
          : 0,
        roi: parseFloat(investments.total) > 0
          ? (((parseFloat(billingSummary?.total_certified || 0) - actualCost) / parseFloat(investments.total)) * 100).toFixed(1)
          : 0
      }
    },
    message: 'Finance summary retrieved'
  });
}));

module.exports = router;
