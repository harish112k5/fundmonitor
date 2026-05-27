const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all machine usage
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT mu.*, p.project_name, mm.machine_name, mm.machine_type,
             u.name AS recorded_by_name, (mu.usage_hours * mu.hourly_rate) AS total_cost
      FROM machine_usage mu
      JOIN projects p ON mu.project_id = p.project_id AND p.is_deleted = 0
      JOIN machines_master mm ON mu.machine_id = mm.machine_id
      LEFT JOIN users u ON mu.recorded_by = u.user_id
      ORDER BY mu.usage_date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by project
router.get('/project/:projectId', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT mu.*, mm.machine_name, mm.machine_type,
             u.name AS recorded_by_name, (mu.usage_hours * mu.hourly_rate) AS total_cost
      FROM machine_usage mu
      JOIN machines_master mm ON mu.machine_id = mm.machine_id
      LEFT JOIN users u ON mu.recorded_by = u.user_id
      WHERE mu.project_id = ?
      ORDER BY mu.usage_date DESC
    `, [req.params.projectId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM machine_usage WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create
router.post('/', async (req, res) => {
  try {
    const { project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by } = req.body;
    const [result] = await db.query(
      `INSERT INTO machine_usage (project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update
router.put('/:id', async (req, res) => {
  try {
    const { project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by } = req.body;
    await db.query(
      `UPDATE machine_usage SET project_id = ?, machine_id = ?, usage_hours = ?,
       hourly_rate = ?, usage_date = ?, recorded_by = ? WHERE id = ?`,
      [project_id, machine_id, usage_hours, hourly_rate, usage_date, recorded_by || null, req.params.id]
    );
    res.json({ message: 'Machine usage updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM machine_usage WHERE id = ?', [req.params.id]);
    res.json({ message: 'Machine usage deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST bulk
router.post('/bulk', async (req, res) => {
  const { entries } = req.body;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ success: false, message: 'No entries provided' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const entry of entries) {
      const {
        project_id,
        machine_id,
        usage_hours,
        rate_per_hour,
        usage_date,
        operator_name,
        recorded_by
      } = entry;

      await connection.execute(
        `INSERT INTO machine_usage
         (project_id, machine_id, usage_hours, hourly_rate, usage_date, operator_name, recorded_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [project_id, machine_id, usage_hours, rate_per_hour, usage_date, operator_name || null, recorded_by || null]
      );
    }

    await connection.commit();
    res.json({ success: true, inserted: entries.length, message: `${entries.length} machine records saved` });
  } catch (err) {
    await connection.rollback();
    console.error('Bulk machine insert error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
