const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

const manpowerUsageSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  worker_id: Joi.number().integer().required(),
  work_days: Joi.number().positive().required(),
  daily_rate: Joi.number().positive().required(),
  work_date: Joi.date().iso().required(),
  recorded_by: Joi.number().integer().optional()
});

const bulkManpowerUsageSchema = Joi.object({
  entries: Joi.array().items(manpowerUsageSchema).min(1).required()
});

// GET all manpower usage
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No access to projects' });
  const placeholders = projectIds.map(() => '?').join(',');

  const [rows] = await db.query(`
    SELECT mu.*, p.project_name, w.name AS worker_name, wr.role_name AS worker_role_name,
           u.name AS recorded_by_name, (mu.work_days * mu.daily_rate) AS total_cost
    FROM manpower_usage mu
    JOIN projects p ON mu.project_id = p.project_id AND p.is_deleted = 0
    JOIN workers w ON mu.worker_id = w.worker_id
    LEFT JOIN worker_roles wr ON w.worker_role_id = wr.worker_role_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id IN (${placeholders})
    ORDER BY mu.work_date DESC
  `, projectIds);
  res.json({ success: true, data: rows, message: 'Manpower usage retrieved' });
}));

// GET by project
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await db.query(`
    SELECT mu.*, w.name AS worker_name, wr.role_name AS worker_role_name,
           u.name AS recorded_by_name, (mu.work_days * mu.daily_rate) AS total_cost
    FROM manpower_usage mu
    JOIN workers w ON mu.worker_id = w.worker_id
    LEFT JOIN worker_roles wr ON w.worker_role_id = wr.worker_role_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id = ?
    ORDER BY mu.work_date DESC
  `, [req.params.projectId]);
  res.json({ success: true, data: rows, message: 'Manpower usage retrieved' });
}));

// GET single
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM manpower_usage WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
  
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, data: rows[0], message: 'Record retrieved' });
}));

// POST create
router.post('/', validate(manpowerUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, worker_id, work_days, daily_rate, work_date, recorded_by } = req.body;
  const [result] = await db.query(
    `INSERT INTO manpower_usage (project_id, worker_id, work_days, daily_rate, work_date, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [project_id, worker_id, work_days, daily_rate, work_date, recorded_by || null]
  );
  res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Manpower usage logged' });
}));

// PUT update
router.put('/:id', validate(manpowerUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, worker_id, work_days, daily_rate, work_date, recorded_by } = req.body;
  await db.query(
    `UPDATE manpower_usage SET project_id = ?, worker_id = ?, work_days = ?,
     daily_rate = ?, work_date = ?, recorded_by = ? WHERE id = ?`,
    [project_id, worker_id, work_days, daily_rate, work_date, recorded_by || null, req.params.id]
  );
  res.json({ success: true, data: null, message: 'Manpower usage updated' });
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM manpower_usage WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: null, message: 'Manpower usage deleted' });
}));

// POST bulk
router.post('/bulk', validate(bulkManpowerUsageSchema), asyncHandler(async (req, res) => {
  const { entries } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const entry of entries) {
      const { project_id, worker_id, work_days, daily_rate, work_date, recorded_by } = entry;
      await connection.execute(
        `INSERT INTO manpower_usage (project_id, worker_id, work_days, daily_rate, work_date, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [project_id, worker_id, work_days, daily_rate, work_date, recorded_by || null]
      );
    }

    await connection.commit();
    res.json({ success: true, data: { inserted: entries.length }, message: `${entries.length} manpower records saved` });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

module.exports = router;
