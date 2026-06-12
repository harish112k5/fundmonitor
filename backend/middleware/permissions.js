const db = require('../db');

/**
 * Get all active permission codes for a user on a specific project.
 * Merges default role-based permissions with explicit grants/revokes.
 */
async function getUserProjectPermissions(user_id, project_id) {
  // Step 1: Get user's role_id
  const [[user]] = await db.query(
    'SELECT role_id FROM users WHERE user_id = ? AND is_active = 1 AND is_deleted = 0',
    [user_id]
  );
  if (!user) return [];

  const role_id = user.role_id;

  // Step 2: Admin bypass — returns ALL permissions
  if (role_id === 1) {
    const [allPerms] = await db.query('SELECT permission_code FROM permission_definitions');
    return allPerms.map(p => p.permission_code);
  }

  // Step 3: Get default permissions for this role from permission_definitions
  const [defaultPerms] = await db.query(
    `SELECT permission_code FROM permission_definitions 
     WHERE JSON_CONTAINS(default_roles, CAST(? AS JSON))`,
    [role_id]
  );
  const permissions = new Set(defaultPerms.map(p => p.permission_code));

  // Step 4: Apply explicit grants (permissions manually added by admin)
  const [explicitGrants] = await db.query(
    `SELECT permission_code FROM user_project_permissions 
     WHERE user_id = ? AND project_id = ? AND is_active = 1 AND revoked_at IS NULL`,
    [user_id, project_id]
  );
  explicitGrants.forEach(p => permissions.add(p.permission_code));

  // Step 5: Apply explicit revokes (permissions manually removed by admin)
  const [explicitRevokes] = await db.query(
    `SELECT permission_code FROM user_project_permissions 
     WHERE user_id = ? AND project_id = ? AND is_active = 0`,
    [user_id, project_id]
  );
  explicitRevokes.forEach(p => permissions.delete(p.permission_code));

  return Array.from(permissions);
}

/**
 * Check if user has a specific permission on a specific project.
 */
async function hasPermission(user_id, project_id, permission_code) {
  const perms = await getUserProjectPermissions(user_id, project_id);
  return perms.includes(permission_code);
}

/**
 * Express middleware factory: checks if user has ANY of the listed permissions.
 * project_id is extracted from URL params, query string, or request body.
 * Admin (role_id=1) always bypasses.
 */
function checkPermission(...permissionCodes) {
  return async (req, res, next) => {
    try {
      const user_id = req.user?.user_id;
      const role_id = req.user?.role_id;

      if (!user_id) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      // Admin always bypasses
      if (role_id === 1) return next();

      // Extract project_id from various sources
      const project_id =
        req.params.projectId ||
        req.params.id ||
        req.query.project_id ||
        req.body?.project_id;

      if (!project_id) {
        // No specific project context — allow through (route handler will filter by access)
        return next();
      }

      const userPerms = await getUserProjectPermissions(user_id, project_id);
      const hasAny = permissionCodes.some(code => userPerms.includes(code));

      if (!hasAny) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required: ${permissionCodes.join(' or ')}`
        });
      }

      // Attach permissions to request for downstream handlers
      req.userProjectPermissions = userPerms;
      next();
    } catch (err) {
      console.error('Permission check error:', err);
      return res.status(500).json({ success: false, message: 'Permission check failed' });
    }
  };
}

/**
 * When admin assigns user to a project, auto-grant default permissions
 * for that user's role. Uses a transaction for atomicity.
 */
async function autoGrantDefaultPermissions(user_id, project_id, granted_by) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Get user's role
    const [[user]] = await connection.query(
      'SELECT role_id FROM users WHERE user_id = ?',
      [user_id]
    );
    if (!user) throw new Error('User not found');

    // Get default permissions for this role
    const [defaults] = await connection.query(
      `SELECT permission_code FROM permission_definitions 
       WHERE JSON_CONTAINS(default_roles, CAST(? AS JSON))`,
      [user.role_id]
    );

    // Grant each default permission (upsert — safe to re-run)
    for (const perm of defaults) {
      await connection.query(
        `INSERT INTO user_project_permissions 
         (user_id, project_id, permission_code, granted_by, is_active)
         VALUES (?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1, revoked_at = NULL`,
        [user_id, project_id, perm.permission_code, granted_by]
      );
    }

    // Log the auto-grant event
    await connection.query(
      `INSERT INTO permission_audit_log 
       (action, user_id, project_id, performed_by, reason)
       VALUES ('AUTO_GRANT', ?, ?, ?, 'Default permissions granted for role on project assignment')`,
      [user_id, project_id, granted_by]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  getUserProjectPermissions,
  hasPermission,
  checkPermission,
  autoGrantDefaultPermissions
};
