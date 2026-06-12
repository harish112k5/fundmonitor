const express = require('express');
const router = express.Router();
const Joi = require('joi');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validator');
const { getAllowedProjectIds, canAccessProject } = require('../utils/projectAccess');

const materialUsageSchema = Joi.object({
  project_id: Joi.number().integer().required(),
  material_id: Joi.number().integer().required(),
  quantity: Joi.number().positive().required(),
  unit_price: Joi.number().positive().required(),
  usage_date: Joi.date().iso().required(),
  supplier_name: Joi.string().allow('', null).optional(),
  recorded_by: Joi.number().integer().optional()
});

const bulkMaterialUsageSchema = Joi.object({
  entries: Joi.array().items(materialUsageSchema).min(1).required()
});

// GET all material usage (with joins)
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const projectIds = await getAllowedProjectIds(user_id, role_id);
  if (projectIds.length === 0) return res.json({ success: true, data: [], message: 'No access to projects' });
  
  const placeholders = projectIds.map(() => '?').join(',');
  const [rows] = await db.query(`
    SELECT mu.*, p.project_name, mm.material_name, mm.unit, u.name AS recorded_by_name,
           (mu.quantity * mu.unit_price) AS total_cost
    FROM material_usage mu
    JOIN projects p ON mu.project_id = p.project_id AND p.is_deleted = 0
    JOIN materials_master mm ON mu.material_id = mm.material_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id IN (${placeholders})
    ORDER BY mu.usage_date DESC
  `, projectIds);
  res.json({ success: true, data: rows, message: 'Material usage retrieved' });
}));

// GET by project
router.get('/project/:projectId', authMiddleware, asyncHandler(async (req, res) => {
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, req.params.projectId);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  const [rows] = await db.query(`
    SELECT mu.*, mm.material_name, mm.unit, u.name AS recorded_by_name,
           (mu.quantity * mu.unit_price) AS total_cost
    FROM material_usage mu
    JOIN materials_master mm ON mu.material_id = mm.material_id
    LEFT JOIN users u ON mu.recorded_by = u.user_id
    WHERE mu.project_id = ?
    ORDER BY mu.usage_date DESC
  `, [req.params.projectId]);
  res.json({ success: true, data: rows, message: 'Material usage retrieved' });
}));

// GET single
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT mu.*, p.project_name, mm.material_name, mm.unit
    FROM material_usage mu
    JOIN projects p ON mu.project_id = p.project_id AND p.is_deleted = 0
    JOIN materials_master mm ON mu.material_id = mm.material_id
    WHERE mu.id = ?
  `, [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found' });
  
  const { user_id, role_id } = req.user;
  const allowed = await canAccessProject(user_id, role_id, rows[0].project_id);
  if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

  res.json({ success: true, data: rows[0], message: 'Record retrieved' });
}));

// POST create
router.post('/', validate(materialUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by } = req.body;
  const [result] = await db.query(
    `INSERT INTO material_usage (project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [project_id, material_id, quantity, unit_price, usage_date, supplier_name || null, recorded_by || null]
  );
  res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Material usage logged' });
}));

// PUT update
router.put('/:id', validate(materialUsageSchema), asyncHandler(async (req, res) => {
  const { project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by } = req.body;
  await db.query(
    `UPDATE material_usage SET project_id = ?, material_id = ?, quantity = ?,
     unit_price = ?, usage_date = ?, supplier_name = ?, recorded_by = ? WHERE id = ?`,
    [project_id, material_id, quantity, unit_price, usage_date, supplier_name || null, recorded_by || null, req.params.id]
  );
  res.json({ success: true, data: null, message: 'Material usage updated' });
}));

// DELETE
router.delete('/:id', asyncHandler(async (req, res) => {
  await db.query('DELETE FROM material_usage WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: null, message: 'Material usage deleted' });
}));

// POST bulk
router.post('/bulk', validate(bulkMaterialUsageSchema), asyncHandler(async (req, res) => {
  const { entries } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const entry of entries) {
      const { project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by } = entry;
      await connection.execute(
        `INSERT INTO material_usage
         (project_id, material_id, quantity, unit_price, usage_date, supplier_name, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [project_id, material_id, quantity, unit_price, usage_date, supplier_name || null, recorded_by || null]
      );
    }

    await connection.commit();
    res.json({ success: true, data: { inserted: entries.length }, message: `${entries.length} material records saved` });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

module.exports = router;
