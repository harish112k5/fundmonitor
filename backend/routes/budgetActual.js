const express = require('express');
const router = express.Router();
const db = require('../db');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

// ─── Helper: recalculate & upsert P&L for an activity ──────────────────────
async function recalcPL(activityId) {
  const [[activity]] = await db.query(
    'SELECT planned_budget FROM budget_actual_activities WHERE activity_id = ?',
    [activityId]
  );
  if (!activity) return;

  const [[usage]] = await db.query(
    `SELECT COALESCE(SUM(aru.actual_total_cost), 0) AS total_actual
     FROM actual_resource_usage aru
     WHERE aru.activity_id = ?`,
    [activityId]
  );

  const planned = parseFloat(activity.planned_budget) || 0;
  const actual  = parseFloat(usage.total_actual) || 0;

  // No actual cost recorded yet — don't compute misleading 100% profit
  if (actual === 0) {
    await db.query(
      `INSERT INTO activity_profit_loss
         (activity_id, total_planned_budget, total_actual_cost, profit_loss, profit_loss_percentage, cost_performance_index, financial_status)
       VALUES (?, ?, 0, 0, 0, 0, 'Good')
       ON DUPLICATE KEY UPDATE
         total_planned_budget   = VALUES(total_planned_budget),
         total_actual_cost      = 0,
         profit_loss            = 0,
         profit_loss_percentage = 0,
         cost_performance_index = 0,
         financial_status       = 'Good',
         last_calculated        = CURRENT_TIMESTAMP`,
      [activityId, planned]
    );
    return;
  }

  const pl    = planned - actual;
  const plPct = planned > 0 ? ((pl / planned) * 100) : 0;
  const cpi   = actual  > 0 ? (planned / actual)     : 0;

  let status = 'Good';
  if (plPct >= 10)       status = 'Excellent';
  else if (plPct >= 0)   status = 'Good';
  else if (plPct >= -10) status = 'At Risk';
  else                   status = 'Critical';

  await db.query(
    `INSERT INTO activity_profit_loss
       (activity_id, total_planned_budget, total_actual_cost, profit_loss, profit_loss_percentage, cost_performance_index, financial_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       total_planned_budget = VALUES(total_planned_budget),
       total_actual_cost    = VALUES(total_actual_cost),
       profit_loss          = VALUES(profit_loss),
       profit_loss_percentage = VALUES(profit_loss_percentage),
       cost_performance_index = VALUES(cost_performance_index),
       financial_status     = VALUES(financial_status),
       last_calculated      = CURRENT_TIMESTAMP`,
    [activityId, planned, actual, pl, plPct.toFixed(2), cpi.toFixed(2), status]
  );

  // Also update progress_percentage on activity from latest progress record
  const [[latest]] = await db.query(
    `SELECT actual_completion_percentage, actual_status
     FROM activity_progress WHERE activity_id = ?
     ORDER BY progress_date DESC, progress_id DESC LIMIT 1`,
    [activityId]
  );
  if (latest) {
    await db.query(
      `UPDATE budget_actual_activities
       SET progress_percentage = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE activity_id = ?`,
      [latest.actual_completion_percentage, latest.actual_status, activityId]
    );
  }
}

// ══════════════════════════════════════════════════════════════════════
//  DASHBOARD — KPI summary
// ══════════════════════════════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    const projectIds = await getAllowedProjectIds(user_id, role_id);
    if (projectIds.length === 0) {
      return res.json({ kpis: { totalBudget: 0, totalActual: 0, totalProfit: 0, overallMargin: 0 }, activities: [] });
    }
    const ph = projectIds.map(() => '?').join(',');

    const [[kpi]] = await db.query(
      `SELECT
         COALESCE(SUM(baa.planned_budget), 0) AS totalBudget,
         COALESCE(SUM(apl.total_actual_cost), 0) AS totalActual,
         COALESCE(SUM(apl.profit_loss), 0) AS totalProfit
       FROM budget_actual_activities baa
       LEFT JOIN activity_profit_loss apl ON baa.activity_id = apl.activity_id
       WHERE baa.project_id IN (${ph})`,
      projectIds
    );

    const margin = kpi.totalBudget > 0
      ? ((kpi.totalProfit / kpi.totalBudget) * 100).toFixed(1)
      : '0.0';

    res.json({
      kpis: {
        totalBudget:   parseFloat(kpi.totalBudget),
        totalActual:   parseFloat(kpi.totalActual),
        totalProfit:   parseFloat(kpi.totalProfit),
        overallMargin: parseFloat(margin),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  LIST activities
// ══════════════════════════════════════════════════════════════════════
router.get('/activities', async (req, res) => {
  try {
    const { user_id, role_id } = req.user;
    const projectIds = await getAllowedProjectIds(user_id, role_id);
    if (projectIds.length === 0) return res.json([]);
    const ph = projectIds.map(() => '?').join(',');

    const { project_id, status, search } = req.query;
    let where = `WHERE baa.project_id IN (${ph})`;
    const params = [...projectIds];

    if (project_id) { where += ' AND baa.project_id = ?'; params.push(project_id); }
    if (status)     { where += ' AND baa.status = ?';     params.push(status); }
    if (search)     { where += ' AND baa.activity_name LIKE ?'; params.push(`%${search}%`); }

    const [rows] = await db.query(
      `SELECT baa.*,
              p.project_name,
              COALESCE(apl.total_actual_cost, 0)      AS actual_cost,
              COALESCE(apl.profit_loss, 0)             AS profit_loss,
              COALESCE(apl.profit_loss_percentage, 0)  AS profit_margin,
              COALESCE(apl.financial_status, 'Good')   AS financial_status,
              COALESCE(apl.cost_performance_index, 1)  AS cpi,
              (baa.planned_budget - COALESCE(apl.total_actual_cost, 0)) AS variance
       FROM budget_actual_activities baa
       JOIN projects p ON baa.project_id = p.project_id AND p.is_deleted = 0
       LEFT JOIN activity_profit_loss apl ON baa.activity_id = apl.activity_id
       ${where}
       ORDER BY baa.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  GET single activity detail (with allocations, progress, P&L)
// ══════════════════════════════════════════════════════════════════════
router.get('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [[activity]] = await db.query(
      `SELECT baa.*, p.project_name,
              COALESCE(apl.total_actual_cost, 0) AS actual_cost,
              COALESCE(apl.profit_loss, 0) AS profit_loss,
              COALESCE(apl.profit_loss_percentage, 0) AS profit_margin,
              COALESCE(apl.financial_status, 'Good') AS financial_status,
              COALESCE(apl.cost_performance_index, 1) AS cpi
       FROM budget_actual_activities baa
       JOIN projects p ON baa.project_id = p.project_id
       LEFT JOIN activity_profit_loss apl ON baa.activity_id = apl.activity_id
       WHERE baa.activity_id = ?`,
      [id]
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    const [allocations] = await db.query(
      'SELECT * FROM budget_allocations WHERE activity_id = ? ORDER BY resource_type, allocation_id',
      [id]
    );

    const [progress] = await db.query(
      `SELECT ap.*, u.name AS recorded_by_name
       FROM activity_progress ap
       LEFT JOIN users u ON ap.recorded_by = u.user_id
       WHERE ap.activity_id = ?
       ORDER BY ap.progress_date DESC, ap.progress_id DESC`,
      [id]
    );

    // Actual resource usage aggregated by type
    const [resourceUsage] = await db.query(
      `SELECT resource_type, resource_name,
              SUM(actual_quantity) AS total_quantity,
              AVG(actual_unit_cost) AS avg_unit_cost,
              SUM(actual_total_cost) AS total_cost
       FROM actual_resource_usage
       WHERE activity_id = ?
       GROUP BY resource_type, resource_name`,
      [id]
    );

    res.json({ activity, allocations, progress, resourceUsage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  CREATE activity + allocations
// ══════════════════════════════════════════════════════════════════════
router.post('/activities', async (req, res) => {
  try {
    const {
      project_id, activity_name, activity_category, description,
      planned_budget, planned_work_hours, start_date, end_date, status,
      allocations = []
    } = req.body;

    const cost_per_hour = planned_work_hours > 0
      ? (parseFloat(planned_budget) / parseFloat(planned_work_hours)).toFixed(2)
      : 0;

    const [result] = await db.query(
      `INSERT INTO budget_actual_activities
         (project_id, activity_name, activity_category, description,
          planned_budget, planned_work_hours, cost_per_hour, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project_id, activity_name, activity_category || null, description || null,
        planned_budget || 0, planned_work_hours || 0, cost_per_hour,
        start_date || null, end_date || null, status || 'Planned',
        req.user?.user_id || null
      ]
    );

    const activityId = result.insertId;

    // Insert allocations
    for (const alloc of allocations) {
      const total = (parseFloat(alloc.planned_quantity) || 0) * (parseFloat(alloc.planned_unit_cost) || 0);
      await db.query(
        `INSERT INTO budget_allocations
           (activity_id, resource_type, resource_id, resource_name,
            planned_quantity, planned_unit, planned_unit_cost, planned_total_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activityId, alloc.resource_type, alloc.resource_id || null, alloc.resource_name,
          alloc.planned_quantity || 0, alloc.planned_unit || 'unit',
          alloc.planned_unit_cost || 0, total
        ]
      );
    }

    // Init P&L record — profit_loss starts at 0 (no actual work done yet)
    await db.query(
      `INSERT IGNORE INTO activity_profit_loss (activity_id, total_planned_budget, total_actual_cost, profit_loss, profit_loss_percentage, cost_performance_index, financial_status)
       VALUES (?, ?, 0, 0, 0, 0, 'Good')`,
      [activityId, planned_budget || 0]
    );

    res.status(201).json({ activity_id: activityId, message: 'Activity created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  UPDATE activity
// ══════════════════════════════════════════════════════════════════════
router.put('/activities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      activity_name, activity_category, description,
      planned_budget, planned_work_hours, start_date, end_date, status,
      allocations
    } = req.body;

    const cost_per_hour = planned_work_hours > 0
      ? (parseFloat(planned_budget) / parseFloat(planned_work_hours)).toFixed(2)
      : 0;

    await db.query(
      `UPDATE budget_actual_activities SET
         activity_name = ?, activity_category = ?, description = ?,
         planned_budget = ?, planned_work_hours = ?, cost_per_hour = ?,
         start_date = ?, end_date = ?, status = ?
       WHERE activity_id = ?`,
      [
        activity_name, activity_category || null, description || null,
        planned_budget || 0, planned_work_hours || 0, cost_per_hour,
        start_date || null, end_date || null, status || 'Planned',
        id
      ]
    );

    // Replace allocations if provided
    if (allocations !== undefined) {
      await db.query('DELETE FROM budget_allocations WHERE activity_id = ?', [id]);
      for (const alloc of allocations) {
        const total = (parseFloat(alloc.planned_quantity) || 0) * (parseFloat(alloc.planned_unit_cost) || 0);
        await db.query(
          `INSERT INTO budget_allocations
             (activity_id, resource_type, resource_id, resource_name,
              planned_quantity, planned_unit, planned_unit_cost, planned_total_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, alloc.resource_type, alloc.resource_id || null, alloc.resource_name,
            alloc.planned_quantity || 0, alloc.planned_unit || 'unit',
            alloc.planned_unit_cost || 0, total
          ]
        );
      }
    }

    await recalcPL(id);
    res.json({ message: 'Activity updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  DELETE activity
// ══════════════════════════════════════════════════════════════════════
router.delete('/activities/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM budget_actual_activities WHERE activity_id = ?', [req.params.id]);
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  RECORD PROGRESS (actual work + resource usage)
// ══════════════════════════════════════════════════════════════════════
router.post('/activities/:id/progress', async (req, res) => {
  try {
    const activityId = req.params.id;
    const {
      actual_work_hours, actual_completion_percentage, actual_status,
      progress_date, notes, resource_usage = []
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO activity_progress
         (activity_id, actual_work_hours, actual_completion_percentage, actual_status, progress_date, recorded_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        activityId,
        actual_work_hours || 0,
        actual_completion_percentage || 0,
        actual_status || 'In Progress',
        progress_date || new Date().toISOString().slice(0, 10),
        req.user?.user_id || null,
        notes || null
      ]
    );

    const progressId = result.insertId;

    // Insert actual resource usage
    for (const usage of resource_usage) {
      const total = (parseFloat(usage.actual_quantity) || 0) * (parseFloat(usage.actual_unit_cost) || 0);
      await db.query(
        `INSERT INTO actual_resource_usage
           (progress_id, activity_id, allocation_id, resource_type, resource_name,
            actual_quantity, actual_unit_cost, actual_total_cost, usage_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          progressId, activityId, usage.allocation_id || null,
          usage.resource_type, usage.resource_name,
          usage.actual_quantity || 0, usage.actual_unit_cost || 0, total,
          progress_date || new Date().toISOString().slice(0, 10)
        ]
      );
    }

    // Recalculate P&L
    await recalcPL(activityId);

    res.status(201).json({ progress_id: progressId, message: 'Progress recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  GET allocations for an activity
// ══════════════════════════════════════════════════════════════════════
router.get('/activities/:id/allocations', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM budget_allocations WHERE activity_id = ? ORDER BY resource_type, allocation_id',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  SIMPLE UPDATE ACTUAL — direct actual cost + completion % entry
//  This is the user-friendly endpoint. It upserts a single "Direct Entry"
//  row in actual_resource_usage so the recalcPL function works normally.
// ══════════════════════════════════════════════════════════════════════
router.post('/activities/:id/update-actual', async (req, res) => {
  try {
    const activityId = req.params.id;
    const {
      actual_cost,          // total actual amount spent
      completion_percentage,
      status,
      notes,
      entry_date,
    } = req.body;

    const cost    = parseFloat(actual_cost) || 0;
    const pct     = Math.min(100, Math.max(0, parseFloat(completion_percentage) || 0));
    const date    = entry_date || new Date().toISOString().slice(0, 10);
    const newStatus = status || 'In Progress';

    // 1. Record a progress snapshot
    const [progResult] = await db.query(
      `INSERT INTO activity_progress
         (activity_id, actual_work_hours, actual_completion_percentage, actual_status, progress_date, recorded_by, notes)
       VALUES (?, 0, ?, ?, ?, ?, ?)`,
      [activityId, pct, newStatus, date, req.user?.user_id || null, notes || null]
    );

    // 2. Delete previous "Direct Entry" rows and insert new total
    //    (we store the cumulative total as one row to keep it simple)
    await db.query(
      `DELETE FROM actual_resource_usage WHERE activity_id = ? AND resource_name = 'Direct Entry'`,
      [activityId]
    );

    if (cost > 0) {
      await db.query(
        `INSERT INTO actual_resource_usage
           (progress_id, activity_id, allocation_id, resource_type, resource_name,
            actual_quantity, actual_unit_cost, actual_total_cost, usage_date)
         VALUES (?, ?, NULL, 'Direct', 'Direct Entry', 1, ?, ?, ?)`,
        [progResult.insertId, activityId, cost, cost, date]
      );
    }

    // 3. Also update activity status + progress directly
    await db.query(
      `UPDATE budget_actual_activities
       SET status = ?, progress_percentage = ?, updated_at = CURRENT_TIMESTAMP
       WHERE activity_id = ?`,
      [newStatus, pct, activityId]
    );

    // 4. Recalculate P&L
    await recalcPL(activityId);

    res.json({ message: 'Actual cost updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════
//  GET activity history (progress log)
// ══════════════════════════════════════════════════════════════════════
router.get('/activities/:id/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT ap.*, u.name AS recorded_by_name
       FROM activity_progress ap
       LEFT JOIN users u ON ap.recorded_by = u.user_id
       WHERE ap.activity_id = ?
       ORDER BY ap.progress_date DESC, ap.progress_id DESC
       LIMIT 20`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
