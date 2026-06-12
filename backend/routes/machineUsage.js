const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

const machineUsageSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  machine_id: Joi.number().integer().required(),
  usage_hours: Joi.number().positive().required(),
  hourly_rate: Joi.number().positive().required(),
  usage_date: Joi.date().iso().required(),
  operator_name: Joi.string().allow('', null).optional(),
  recorded_by: Joi.number().integer().optional()
});

const bulkMachineUsageSchema = Joi.object({
  entries: Joi.array().items(
    machineUsageSchema.keys({
      rate_per_hour: Joi.number().positive().optional(),
      hourly_rate: Joi.number().positive().optional()
    }).or('rate_per_hour', 'hourly_rate')
  ).min(1).required()
});

// GET all machine usage
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No access to projects' });
  const placeholders = projectIds.map(() => '?').join(',');

  const [rows] = await db.query(`
    SELECT mu.*, p.project_name, mm.machine_name, mm.machine_type,
           u.name AS recorded_by_name, (mu.usage_hours * mu.hourly_rate) AS total_cost
    FROM machine_usage mu
    JOIN projects p ON mu.project_id = p.project_id AND p.is_deleted = 0
    JOIN machines_master mm ON mu.machine_id = mm.machine_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id IN (${placeholders})
    ORDER BY mu.usage_date DESC
  `, projectIds);
  res.json({ success: true, data: rows, message: 'Machine usage retrieved' });
}));

// GET by project
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await db.query(`
    SELECT mu.*, mm.machine_name, mm.machine_type,
           u.name AS recorded_by_name, (mu.usage_hours * mu.hourly_rate) AS total_cost
    FROM machine_usage mu
    JOIN machines_master mm ON mu.machine_id = mm.machine_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id = ?
    ORDER BY mu.usage_date DESC
  `, [req.params.projectId]);
  res.json({ success: true, data: rows, message: 'Machine usage retrieved' });
}));

// GET single
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM machine_usage WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
  
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, data: rows[0], message: 'Record retrieved' });
}));

// POST create
router.post('/', validate(machineUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by } = req.body;
  const [result] = await db.query(
    `INSERT INTO machine_usage (project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by || null]
  );
  res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Machine usage logged' });
}));

// PUT update
router.put('/:id', validate(machineUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by } = req.body;
  await db.query(
    `UPDATE machine_usage SET project_id = ?, machine_id = ?, usage_hours = ?,
     hourly_rate = ?, usage_date = ?, recorded_by = ? WHERE id = ?`,
    [project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by || null, req.params.id]
  );
  res.json({ success: true, data: null, message: 'Machine usage updated' });
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM machine_usage WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: null, message: 'Machine usage deleted' });
}));

// POST bulk
router.post('/bulk', validate(bulkMachineUsageSchema), asyncHandler(async (req, res) => {
  const { entries } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const entry of entries) {
      const { project_id, machine_id, usage_hours, rate_per_hour, hourly_rate, usage_date, operator_name, recorded_by } = entry;
      const finalRate = hourly_rate || rate_per_hour;
      await connection.execute(
        `INSERT INTO machine_usage
         (project_id, machine_id, usage_hours, hourly_rate, usage_date, operator_name, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [project_id, machine_id, usage_hours, finalRate, usage_date, operator_name || null, recorded_by || null]
      );
    }

    await connection.commit();
    res.json({ success: true, data: { inserted: entries.length }, message: `${entries.length} machine records saved` });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

module.exports = router;
