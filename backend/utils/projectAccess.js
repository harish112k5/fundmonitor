const pool = require('../db');

/**
 * Returns array of project IDs the user is allowed to access.
 * Admin (role_id=1)      = all projects.
 * Manager (role_id=2)    = only assigned via project_team.
 * Engineer (role_id=3)   = only assigned via project_team.
 * Accountant (role_id=4) = all projects (system-wide financials).
 * Supervisor (role_id=5) = only assigned via project_team.
 * Viewer (role_id=6)     = only assigned via project_team.
 */
async function getAllowedProjectIds(userId, roleId) {
  if (roleId === 1) {
    // Admin: all projects
    const [rows] = await pool.query('SELECT project_id as id FROM projects WHERE is_deleted = 0');
    return rows.map(r => r.id);
  }

  if ([2, 3, 4, 5, 6].includes(roleId)) {
    // Manager, Engineer, Accountant, Supervisor, Viewer: assigned projects via project_team
    const [teamRows] = await pool.query(
      'SELECT project_id as id FROM project_team WHERE user_id = ?',
      [userId]
    );
    return teamRows.map(r => r.id);
  }

  return [];
}

async function canAccessProject(userId, roleId, projectId) {
  const ids = await getAllowedProjectIds(userId, roleId);
  return ids.includes(Number(projectId));
}

module.exports = { getAllowedProjectIds, canAccessProject };
