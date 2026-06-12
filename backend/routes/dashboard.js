const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { getAllowedProjectIds } = require('../utils/projectAccess');

// Dashboard stats
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);

  if (projectIds.length === 0) {
    return res.json({
      success: true,
      data: {
        projects: { total_projects: 0, ongoing: 0, completed: 0, on_hold: 0, total_budget: 0 },
        workers: { total_workers: 0, active_workers: 0 },
        machines: { total_machines: 0, available: 0, in_use: 0 },
        costs: { material: 0, manpower: 0, machine: 0, expenses: 0, total: 0 },
        financial: { investments: 0, billed: 0, paid: 0 },
        budgetComparison: { billable: 0, actual: 0, billed: 0, profitLoss: 0, budgetVariance: 0 }
      },
      message: 'No projects accessible'
    });
  }

  const placeholders = projectIds.map(() => '?').join(',');

  const [
    [[projectStats]], [[workerStats]], [[machineStats]], [[materialCost]], [[manpowerCost]],
    [[machineCost]], [[expenseTotal]], [[investmentTotal]], [[billingTotal]]
  ] = await Promise.all([
    db.query(`
      SELECT 
        COUNT(*) AS total_projects,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) AS ongoing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) AS on_hold,
        COALESCE(SUM(estimated_budget), 0) AS total_budget
      FROM projects WHERE is_deleted = 0 AND project_id IN (${placeholders})
    `, projectIds),
    db.query(`
      SELECT COUNT(DISTINCT mu.worker_id) AS total_workers,
        COUNT(DISTINCT CASE WHEN w.is_active = 1 THEN mu.worker_id END) AS active_workers
      FROM manpower_usage mu
      JOIN workers w ON mu.worker_id = w.worker_id
      WHERE mu.project_id IN (${placeholders}) AND w.is_deleted = 0
    `, projectIds),
    db.query(`
      SELECT COUNT(DISTINCT mu.machine_id) AS total_machines,
        COUNT(DISTINCT CASE WHEN m.status = 'available' THEN mu.machine_id END) AS available,
        COUNT(DISTINCT CASE WHEN m.status = 'in_use' THEN mu.machine_id END) AS in_use
      FROM machine_usage mu
      JOIN machines_master m ON mu.machine_id = m.machine_id
      WHERE mu.project_id IN (${placeholders}) AND m.is_deleted = 0
    `, projectIds),
    db.query(`SELECT COALESCE(SUM(quantity * unit_price), 0) AS total_material_cost FROM material_usage WHERE project_id IN (${placeholders})`, projectIds),
    db.query(`SELECT COALESCE(SUM(work_days * daily_rate), 0) AS total_manpower_cost FROM manpower_usage WHERE project_id IN (${placeholders})`, projectIds),
    db.query(`SELECT COALESCE(SUM(usage_hours * hourly_rate), 0) AS total_machine_cost FROM machine_usage WHERE project_id IN (${placeholders})`, projectIds),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total_expenses FROM expenses WHERE project_id IN (${placeholders})`, projectIds),
    db.query(`SELECT COALESCE(SUM(amount), 0) AS total_investments FROM project_investments WHERE project_id IN (${placeholders})`, projectIds),
    db.query(`
      SELECT COALESCE(SUM(amount), 0) AS total_billed,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS total_paid
      FROM billing WHERE project_id IN (${placeholders})
    `, projectIds)
  ]);

  const totalActualCost = parseFloat(materialCost.total_material_cost) +
                          parseFloat(manpowerCost.total_manpower_cost) +
                          parseFloat(machineCost.total_machine_cost) +
                          parseFloat(expenseTotal.total_expenses);

  res.json({
    success: true,
    data: {
      projects: projectStats,
      workers: workerStats,
      machines: machineStats,
      costs: {
        material: parseFloat(materialCost.total_material_cost),
        manpower: parseFloat(manpowerCost.total_manpower_cost),
        machine: parseFloat(machineCost.total_machine_cost),
        expenses: parseFloat(expenseTotal.total_expenses),
        total: totalActualCost
      },
      financial: {
        investments: parseFloat(investmentTotal.total_investments),
        billed: parseFloat(billingTotal.total_billed),
        paid: parseFloat(billingTotal.total_paid)
      },
      budgetComparison: {
        billable: parseFloat(projectStats.total_budget),
        actual: totalActualCost,
        billed: parseFloat(billingTotal.total_billed),
        profitLoss: parseFloat(billingTotal.total_billed) - totalActualCost,
        budgetVariance: parseFloat(projectStats.total_budget) - totalActualCost
      }
    },
    message: 'Dashboard stats retrieved'
  });
}));

// Per-project budget comparison
router.get('/budget-comparison', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No projects accessible' });

  const placeholders = projectIds.map(() => '?').join(',');

  const [projects] = await db.query(`
    SELECT p.project_id, p.project_name, p.estimated_budget, p.status
    FROM projects p WHERE p.is_deleted = 0 AND p.project_id IN (${placeholders}) ORDER BY p.project_id
  `, projectIds);

  const result = await Promise.all(projects.map(async (proj) => {
    const pid = proj.project_id;
    const [ [[matCost]], [[manCost]], [[machCost]], [[expCost]], [[billAmt]] ] = await Promise.all([
      db.query('SELECT COALESCE(SUM(quantity * unit_price), 0) AS cost FROM material_usage WHERE project_id = ?', [pid]),
      db.query('SELECT COALESCE(SUM(work_days * daily_rate), 0) AS cost FROM manpower_usage WHERE project_id = ?', [pid]),
      db.query('SELECT COALESCE(SUM(usage_hours * hourly_rate), 0) AS cost FROM machine_usage WHERE project_id = ?', [pid]),
      db.query('SELECT COALESCE(SUM(amount), 0) AS cost FROM expenses WHERE project_id = ?', [pid]),
      db.query('SELECT COALESCE(SUM(amount), 0) AS total FROM billing WHERE project_id = ?', [pid])
    ]);

    const actualCost = parseFloat(matCost.cost) + parseFloat(manCost.cost) +
                        parseFloat(machCost.cost) + parseFloat(expCost.cost);

    return {
      project_id: pid,
      project_name: proj.project_name,
      status: proj.status,
      billable: parseFloat(proj.estimated_budget || 0),
      actual: actualCost,
      billed: parseFloat(billAmt.total),
      profitLoss: parseFloat(billAmt.total) - actualCost,
      budgetVariance: parseFloat(proj.estimated_budget || 0) - actualCost
    };
  }));

  res.json({ success: true, data: result, message: 'Budget comparison retrieved' });
}));

// Material consumption summary
router.get('/material-summary', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No access' });
  const placeholders = projectIds.map(() => '?').join(',');

  const [rows] = await db.query(`
    SELECT mm.material_id, mm.material_name, mm.unit, mm.unit_price AS catalog_price,
           COALESCE(SUM(mu.quantity), 0) AS total_consumed,
           COALESCE(SUM(mu.quantity * mu.unit_price), 0) AS total_cost,
           COUNT(DISTINCT mu.project_id) AS projects_used_in
    FROM materials_master mm
    JOIN material_usage mu ON mm.material_id = mu.material_id
    WHERE mm.is_deleted = 0 AND mu.project_id IN (${placeholders})
    GROUP BY mm.material_id, mm.material_name, mm.unit, mm.unit_price
    ORDER BY total_consumed DESC
  `, projectIds);
  res.json({ success: true, data: rows, message: 'Material summary retrieved' });
}));

// Alerts — overdue items, pending interest, delayed projects
router.get('/alerts', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) {
    return res.json({ success: true, data: { overdueBills: [], pendingInterest: [], overBudget: [], delayedProjects: [], loanAlerts: [], totalAlerts: 0 }, message: 'No access' });
  }
  const placeholders = projectIds.map(() => '?').join(',');

  const [ [overdueBills], [pendingInterest], [projects], [delayedProjects], [activeLoans] ] = await Promise.all([
    // Overdue billing
    db.query(`
      SELECT b.billing_id, b.invoice_number, b.amount, b.due_date, p.project_name
      FROM billing b
      JOIN projects p ON b.project_id = p.project_id
      WHERE b.status IN ('sent', 'draft') AND b.due_date < CURDATE() AND b.project_id IN (${placeholders})
      ORDER BY b.due_date ASC
    `, projectIds),
    // Pending interest
    db.query(`
      SELECT ip.id, ip.amount, ip.payment_date, ip.status,
             pl.principal, pl.interest_rate, p.project_name, f.name AS financier_name
      FROM interest_payments ip
      JOIN project_loans pl ON ip.loan_id = pl.id
      JOIN projects p ON pl.project_id = p.project_id
      JOIN financiers f ON pl.financier_id = f.financier_id
      WHERE ip.status = 'pending' AND pl.project_id IN (${placeholders})
      ORDER BY ip.payment_date ASC
    `, projectIds),
    // Projects over budget candidates
    db.query(`
      SELECT p.project_id, p.project_name, p.estimated_budget
      FROM projects p WHERE p.is_deleted = 0 AND p.estimated_budget > 0 AND p.project_id IN (${placeholders})
    `, projectIds),
    // Delayed projects
    db.query(`
      SELECT project_id, project_name, end_date, status
      FROM projects
      WHERE is_deleted = 0 AND status = 'ongoing' AND end_date < CURDATE() AND project_id IN (${placeholders})
      ORDER BY end_date ASC
    `, projectIds),
    // Active loans
    db.query(`
      SELECT pl.id, pl.principal, pl.interest_rate, pl.start_date, pl.end_date,
             p.project_name, f.name AS financier_name,
             COALESCE((SELECT SUM(ip.amount) FROM interest_payments ip WHERE ip.loan_id = pl.id AND ip.status = 'paid'), 0) AS total_paid,
             ROUND(pl.principal * pl.interest_rate / 100 / 12, 2) AS monthly_interest,
             TIMESTAMPDIFF(MONTH, pl.start_date, CURDATE()) AS months_elapsed
      FROM project_loans pl
      JOIN projects p ON pl.project_id = p.project_id
      JOIN financiers f ON pl.financier_id = f.financier_id
      WHERE pl.project_id IN (${placeholders})
      ORDER BY pl.start_date DESC
    `, projectIds)
  ]);

  const overBudgetResults = await Promise.all(projects.map(async (proj) => {
    const [[total]] = await db.query(`
      SELECT (
        COALESCE((SELECT SUM(quantity * unit_price) FROM material_usage WHERE project_id = ?), 0) +
        COALESCE((SELECT SUM(work_days * daily_rate) FROM manpower_usage WHERE project_id = ?), 0) +
        COALESCE((SELECT SUM(usage_hours * hourly_rate) FROM machine_usage WHERE project_id = ?), 0) +
        COALESCE((SELECT SUM(amount) FROM expenses WHERE project_id = ?), 0)
      ) AS actual_cost
    `, [proj.project_id, proj.project_id, proj.project_id, proj.project_id]);

    if (parseFloat(total.actual_cost) > parseFloat(proj.estimated_budget)) {
      return {
        project_id: proj.project_id,
        project_name: proj.project_name,
        estimated_budget: parseFloat(proj.estimated_budget),
        actual_cost: parseFloat(total.actual_cost),
        overBy: parseFloat(total.actual_cost) - parseFloat(proj.estimated_budget)
      };
    }
    return null;
  }));

  const overBudget = overBudgetResults.filter(Boolean);

  const loanAlerts = activeLoans.map(loan => {
    const expectedPaid = loan.monthly_interest * loan.months_elapsed;
    const shortfall = expectedPaid - parseFloat(loan.total_paid);
    return {
      ...loan,
      total_paid: parseFloat(loan.total_paid),
      expected_total: expectedPaid,
      shortfall: shortfall > 0 ? shortfall : 0,
      status: shortfall > 0 ? 'behind' : 'on_track'
    };
  });

  res.json({
    success: true,
    data: {
      overdueBills,
      pendingInterest,
      overBudget,
      delayedProjects,
      loanAlerts,
      totalAlerts: overdueBills.length + pendingInterest.length + overBudget.length + delayedProjects.length
    },
    message: 'Alerts retrieved'
  });
}));

// Recent activities
router.get('/recent', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: { recentProjects: [], recentExpenses: [] }, message: 'No access' });
  const placeholders = projectIds.map(() => '?').join(',');

  const [ [recentProjects], [recentExpenses] ] = await Promise.all([
    db.query(`
      SELECT project_id, project_name, status, created_at, 'project' AS type
      FROM projects WHERE is_deleted = 0 AND project_id IN (${placeholders})
      ORDER BY created_at DESC LIMIT 5
    `, projectIds),
    db.query(`
      SELECT e.expense_id, p.project_name, e.amount, ec.category_name, e.expense_date, 'expense' AS type
      FROM expenses e
      JOIN projects p ON e.project_id = p.project_id
      JOIN expense_categories ec ON e.category_id = ec.category_id
      WHERE e.project_id IN (${placeholders})
      ORDER BY e.created_at DESC LIMIT 5
    `, projectIds)
  ]);

  res.json({ success: true, data: { recentProjects, recentExpenses }, message: 'Recent activities retrieved' });
}));

// GET /api/dashboard/financial-summary?project_id=
router.get('/financial-summary', authMiddleware, asyncHandler(async (req, res) => {
  const { project_id } = req.query;
  const userId = req.user.user_id;
  const roleId = req.user.role_id;

  const allowedProjects = await getAllowedProjectIds(userId, roleId);
  const ids = project_id ? [project_id] : allowedProjects;
  const finalIds = ids.filter(id => allowedProjects.includes(parseInt(id) || id));

  if (finalIds.length === 0) return res.json({ success: true, data: {}, message: 'No accessible projects' });

  const ph = finalIds.map(() => '?').join(',');

  const [
    [[mat]], [[man]], [[mach]], [[exp]], [[bil]], [[inv]], [[loan]], [[ip]], [[budget]]
  ] = await Promise.all([
    db.query(`SELECT COALESCE(SUM(quantity * unit_price),0) as v FROM material_usage WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(work_days * daily_rate),0) as v FROM manpower_usage WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(usage_hours * hourly_rate),0) as v FROM machine_usage WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(amount),0) as v FROM expenses WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(amount),0) as billed, COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END),0) as received FROM billing WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(repaid_amount),0) as repaid FROM project_investments WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(principal),0) as total, COALESCE(SUM(repaid_amount),0) as repaid FROM project_loans WHERE project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(ip.amount),0) as paid FROM interest_payments ip JOIN project_loans pl ON pl.id = ip.loan_id WHERE ip.status='paid' AND pl.project_id IN (${ph})`, finalIds),
    db.query(`SELECT COALESCE(SUM(estimated_budget),0) as v FROM projects WHERE project_id IN (${ph})`, finalIds)
  ]);

  const totalCost = parseFloat(mat.v) + parseFloat(man.v) + parseFloat(mach.v) + parseFloat(exp.v);
  const totalFunding = parseFloat(inv.total) + parseFloat(loan.total);
  const netProfit = parseFloat(bil.received) - totalCost;
  const roi = totalFunding > 0 ? (netProfit / totalFunding) * 100 : 0;

  res.json({
    success: true,
    data: {
      material_cost: parseFloat(mat.v),
      manpower_cost: parseFloat(man.v),
      machine_cost: parseFloat(mach.v),
      expense_cost: parseFloat(exp.v),
      total_cost: totalCost,
      billed: parseFloat(bil.billed),
      received: parseFloat(bil.received),
      pending_billing: parseFloat(bil.billed) - parseFloat(bil.received),
      total_investments: parseFloat(inv.total),
      investments_repaid: parseFloat(inv.repaid),
      investments_pending: parseFloat(inv.total) - parseFloat(inv.repaid),
      total_loans: parseFloat(loan.total),
      loans_repaid: parseFloat(loan.repaid),
      loans_outstanding: parseFloat(loan.total) - parseFloat(loan.repaid),
      interest_paid: parseFloat(ip.paid),
      total_funding: totalFunding,
      net_profit: netProfit,
      roi: roi,
      budget: parseFloat(budget.v),
      budget_remaining: parseFloat(budget.v) - totalCost,
      budget_used_pct: parseFloat(budget.v) > 0 ? (totalCost / parseFloat(budget.v)) * 100 : 0
    },
    message: 'Financial summary retrieved'
  });
}));

module.exports = router;
