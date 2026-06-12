import { useAuth } from '../context/AuthContext';

/**
 * PermissionGuard — Renders children only when user has the required permission
 * on the given project. Returns `fallback` (default: null) otherwise.
 *
 * Usage:
 *   <PermissionGuard projectId={project.project_id} permission="can_add_expenses">
 *     <button>Add Expense</button>
 *   </PermissionGuard>
 *
 *   // With fallback:
 *   <PermissionGuard projectId={projectId} permission="can_view_financials"
 *     fallback={<p>You do not have access to view financial reports.</p>}>
 *     <FinanceReport />
 *   </PermissionGuard>
 */
export function PermissionGuard({ projectId, permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(projectId, permission)) return fallback;
  return children;
}

/**
 * AnyPermissionGuard — Renders children if user has ANY of the listed permissions.
 *
 * Usage:
 *   <AnyPermissionGuard projectId={projectId} permissions={['can_add_expenses', 'can_edit_expenses']}>
 *     <ExpenseActions />
 *   </AnyPermissionGuard>
 */
export function AnyPermissionGuard({ projectId, permissions = [], children, fallback = null }) {
  const { hasAnyPermission } = useAuth();
  if (!hasAnyPermission(projectId, ...permissions)) return fallback;
  return children;
}

/**
 * AdminGuard — Renders children only for admin users.
 */
export function AdminGuard({ children, fallback = null }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return fallback;
  return children;
}

export default PermissionGuard;
