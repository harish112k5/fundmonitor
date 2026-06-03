const pool = require('../db');

/**
 * Returns array of project IDs the user is allowed to access.
 * Admin/Manager = all projects.
 * Engineer = only project_team assigned.
 * Investor = via project_investments.
 * Financier = via project_loans.
 */
async function getAllowedProjectIds(userId, roleId) {
  if (roleId === 1 || roleId === 2) {
    // Admin + Manager: all
    const [rows] = await pool.query('SELECT project_id as id FROM projects WHERE is_deleted = 0');
    return rows.map(r => r.id);
  }

  if (roleId === 3) {
    // Engineer: only assigned
    const [rows] = await pool.query(
      'SELECT project_id as id FROM project_team WHERE user_id = ?',
      [userId]
    );
    return rows.map(r => r.id);
  }

  if (roleId === 4) {
    // Investor
    const [rows] = await pool.query(`
      SELECT pi.project_id as id FROM project_investments pi
      JOIN investors inv ON inv.investor_id = pi.investor_id
      WHERE inv.user_id = ?
    `, [userId]);
    return rows.map(r => r.id);
  }

  if (roleId === 5) {
    // Financier
    const [rows] = await pool.query(`
      SELECT pl.project_id as id FROM project_loans pl
      JOIN financiers f ON f.financier_id = pl.financier_id
      WHERE f.user_id = ?
    `, [userId]);
    return rows.map(r => r.id);
  }

  return [];
}

async function canAccessProject(userId, roleId, projectId) {
  const ids = await getAllowedProjectIds(userId, roleId);
  return ids.includes(Number(projectId));
}

module.exports = { getAllowedProjectIds, canAccessProject };
