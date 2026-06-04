/**
 * Role-based access control middleware.
 * Checks req.user.role_id against a list of allowed role IDs.
 * Must be used AFTER authMiddleware (which sets req.user).
 *
 * Usage:  router.post('/admin-only', authMiddleware, requireRole(1), handler);
 *         router.get('/managers',    authMiddleware, requireRole(1, 2), handler);
 */
module.exports = (...allowedRoleIds) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!allowedRoleIds.includes(req.user.role_id)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  next();
};
