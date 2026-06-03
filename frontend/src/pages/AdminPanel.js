import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const COLORS = {
  bg: '#0F0F1A', card: '#1A1A2E', border: '#2A2A45',
  purple: '#7C3AED', green: '#10B981', amber: '#F59E0B',
  red: '#EF4444', text: '#F1F5F9', muted: '#94A3B8'
};

// ── Reusable Pagination Controls ──────────────────────────────────────────────
function Pagination({ page, totalPages, onPrev, onNext, total, pageSize }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: 16, padding: '10px 4px',
    }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>
        {total === 0 ? 'No records' : `Showing ${from}–${to} of ${total}`}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onPrev} disabled={page === 1}
          style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid #2a2a45',
            background: page === 1 ? '#1a1a2e' : '#252545',
            color: page === 1 ? '#3f4b5b' : '#94a3b8',
            cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13,
          }}
        >← Prev</button>
        <span style={{
          padding: '6px 14px', background: '#7c3aed', borderRadius: 6,
          color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 36, textAlign: 'center',
        }}>
          {page} / {totalPages || 1}
        </span>
        <button
          onClick={onNext} disabled={page >= totalPages}
          style={{
            padding: '6px 16px', borderRadius: 6, border: '1px solid #2a2a45',
            background: page >= totalPages ? '#1a1a2e' : '#252545',
            color: page >= totalPages ? '#3f4b5b' : '#94a3b8',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13,
          }}
        >Next →</button>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats,      setStats]      = useState(null);
  const [users,      setUsers]      = useState([]);
  const [sessions,   setSessions]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [assigned,   setAssigned]   = useState([]);
  const [projects,   setProjects]   = useState([]);

  const [loadingUsers,      setLoadingUsers]      = useState(false);
  const [loadingSessions,   setLoadingSessions]   = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Create Admin modal state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });
  const [adminCount, setAdminCount] = useState(0);

  // Assign modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignRole, setAssignRole] = useState('engineer');

  // Pagination state
  const [userPage,     setUserPage]     = useState(1);
  const [sessionPage,  setSessionPage]  = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    if (user && user.role_id !== 1) {
      alert('Access denied — Admin only');
      navigate('/');
    } else if (user) {
      fetchAll();
    }
  }, [user, navigate]);

  const fetchAll = () => {
    fetchStats();
    fetchUsers();
    fetchSessions();
    fetchActivities();
    fetchAssignments();
    fetchProjects();
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get('/admin/stats');
      if (data.success) setStats(data.data);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await API.get('/admin/users');
      if (data.success) {
        setUsers(data.data);
        setAdminCount(data.data.filter(u => u.role_id === 1).length);
      }
    } catch (err) { console.error(err); }
    setLoadingUsers(false);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await API.get('/admin/sessions');
      if (data.success) setSessions(data.data);
    } catch (err) { console.error(err); }
    setLoadingSessions(false);
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const { data } = await API.get('/admin/activity');
      if (data.success) setActivities(data.data);
    } catch (err) { console.error(err); }
    setLoadingActivities(false);
  };

  const fetchAssignments = async () => {
    try {
      const [unRes, asRes] = await Promise.all([
        API.get('/admin/unassigned-users'),
        API.get('/admin/assigned-users')
      ]);
      if (unRes.data.success) setUnassigned(unRes.data.data);
      if (asRes.data.success) setAssigned(asRes.data.data);
    } catch (err) { console.error(err); }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await API.get('/projects');
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBlock = async (userId, userName) => {
    if (!window.confirm(`Block user "${userName}"? They will be unable to log in.`)) return;
    try {
      await API.patch(`/admin/users/${userId}/block`);
      toast.success('User blocked');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to block user'); }
  };

  const handleUnblock = async (userId) => {
    try {
      await API.patch(`/admin/users/${userId}/unblock`);
      toast.success('User unblocked');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to unblock user'); }
  };

  const handleAssign = async () => {
    if (!assignProjectId) return toast.error('Select a project');
    try {
      await API.post('/admin/assign-project', {
        user_id: selectedUser.user_id,
        project_id: parseInt(assignProjectId),
        team_role: assignRole
      });
      toast.success(`Project assigned to ${selectedUser.name}`);
      setShowAssignModal(false);
      setAssignProjectId('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign');
    }
  };

  const handleUnassign = async (userId, projectId) => {
    if (!window.confirm('Remove this project assignment?')) return;
    try {
      await API.delete('/admin/unassign', { data: { user_id: userId, project_id: projectId } });
      toast.success('Assignment removed');
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to remove'); }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      return toast.error('All fields are required');
    }
    try {
      await API.post('/admin/create-admin', adminForm);
      toast.success('Admin account created!');
      setShowCreateAdmin(false);
      setAdminForm({ name: '', email: '', password: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const paginate = (arr, page) =>
    arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = (arr) => Math.ceil(arr.length / PAGE_SIZE);

  const formatBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Edg'))    return '🌐 Edge';
    if (ua.includes('Chrome')) return '🌐 Chrome';
    if (ua.includes('Firefox')) return '🦊 Firefox';
    if (ua.includes('Safari') && !ua.includes('Chrome')) return '🧭 Safari';
    return ua.length > 30 ? ua.substring(0, 28) + '…' : ua;
  };

  const formatDuration = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return '—';
    if (mins < 1)  return '< 1 min';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const getActionColor = (action) => {
    if (!action) return '#64748b';
    if (action.includes('UNBLOCK'))  return '#10b981';
    if (action.includes('BLOCK'))    return '#991b1b';
    if (action.includes('APPROVE'))  return '#10b981';
    if (action.includes('ASSIGN'))   return '#3b82f6';
    if (action.includes('UNASSIGN')) return '#f59e0b';
    if (action.includes('INSERT'))   return '#10b981';
    if (action.includes('UPDATE'))   return '#3b82f6';
    if (action.includes('DELETE'))   return '#ef4444';
    if (action.includes('CREATE'))   return '#7c3aed';
    return '#64748b';
  };

  // ── Styles ─────────────────────────────────────────────────────────────────
  const S = {
    page:        { background: '#0f0f1a', minHeight: '100vh', padding: '24px 32px', color: '#f1f5f9' },
    card:        { background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 12, padding: '20px 24px' },
    sectionTitle:{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4 },
    sectionSub:  { fontSize: 13, color: '#64748b', marginBottom: 16 },
    table:       { width: '100%', borderCollapse: 'collapse' },
    th:          { textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                   letterSpacing: '0.06em', color: '#64748b', padding: '10px 12px',
                   borderBottom: '1px solid #2a2a45' },
    td:          { padding: '11px 12px', fontSize: 14, color: '#cbd5e1',
                   borderBottom: '1px solid #1e1e35', verticalAlign: 'middle' },
    blockBtn:    { padding: '5px 14px', background: 'transparent', border: '1px solid #ef4444',
                   borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
    unblockBtn:  { padding: '5px 14px', background: 'transparent', border: '1px solid #10b981',
                   borderRadius: 6, color: '#10b981', cursor: 'pointer', fontSize: 12, fontWeight: 500 },
  };

  const tabStyle = (t) => ({
    padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
    fontWeight: activeTab === t ? '600' : '400',
    backgroundColor: activeTab === t ? COLORS.purple : 'transparent',
    color: activeTab === t ? '#fff' : COLORS.muted,
    border: 'none'
  });

  // ── Paginated slices ───────────────────────────────────────────────────────
  const pagedUsers      = paginate(users,      userPage);
  const pagedSessions   = paginate(sessions,   sessionPage);
  const pagedActivities = paginate(activities, activityPage);

  // ── Empty row helper ───────────────────────────────────────────────────────
  const EmptyRow = ({ cols, icon, msg }) => (
    <tr>
      <td colSpan={cols} style={{ ...S.td, textAlign: 'center', padding: '36px', color: '#475569' }}>
        {icon} {msg}
      </td>
    </tr>
  );

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
            border: '1px solid #2a2a45', borderRadius: 8, color: '#94a3b8',
            padding: '6px 14px', cursor: 'pointer', fontSize: 14,
          }}>← Back</button>
          <h1 style={{ margin: 0, fontSize: 24, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
            🛡 Admin Control Panel
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {adminCount < 2 ? (
            <button onClick={() => setShowCreateAdmin(true)} style={{
              padding: '8px 16px', background: COLORS.purple, border: 'none',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>+ Create Admin</button>
          ) : (
            <span style={{ color: '#64748B', fontSize: 12 }}>Max 2 admins</span>
          )}
          <button onClick={fetchAll} style={{
            padding: '8px 16px', background: 'transparent', border: '1px solid #2a2a45',
            borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13,
          }}>↺ Refresh</button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Users',     value: stats?.total_users      || 0, color: '#3b82f6' },
            { label: 'Active Sessions', value: stats?.active_sessions  || 0, color: '#10b981' },
            { label: 'Blocked Users',   value: stats?.blocked_users    || 0, color: '#ef4444' },
            { label: 'Actions Today',   value: stats?.total_actions_today || 0, color: '#f59e0b' },
            { label: 'Admin Accounts',  value: `${adminCount}/2`, color: '#7c3aed' },
            { label: 'Unassigned',      value: unassigned.length, color: unassigned.length > 0 ? '#f59e0b' : '#10b981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['overview', 'assignments', 'users', 'sessions'].map(t => (
          <button key={t} style={tabStyle(t)} onClick={() => setActiveTab(t)}>
            {t === 'overview' ? '📊 Overview'
              : t === 'assignments' ? `👷 Assignments ${unassigned.length > 0 ? `(${unassigned.length} pending)` : ''}`
              : t === 'users' ? '👤 All Users'
              : '🕐 Sessions'}
          </button>
        ))}
      </div>

      {/* ══════════ TAB: OVERVIEW ══════════ */}
      {activeTab === 'overview' && (
        <div style={S.card}>
          <h2 style={S.sectionTitle}>Activity Log</h2>
          <div style={S.sectionSub}>
            {activities.length} action{activities.length !== 1 ? 's' : ''} recorded
          </div>
          {loadingActivities ? (
            <p style={{ color: '#64748b' }}>Loading activities...</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>ACTION</th>
                      <th style={S.th}>TABLE</th>
                      <th style={S.th}>RECORD ID</th>
                      <th style={S.th}>PERFORMED BY</th>
                      <th style={S.th}>IP</th>
                      <th style={S.th}>DATE & TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedActivities.length === 0 ? (
                      <EmptyRow cols={7} icon="📋" msg="No activity recorded yet." />
                    ) : pagedActivities.map((a, i) => (
                      <tr key={a.log_id ?? i}>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>
                          {(activityPage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={S.td}>
                          <span style={{
                            background: getActionColor(a.action), color: '#fff',
                            padding: '3px 10px', borderRadius: 4, fontSize: 11,
                            fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap',
                          }}>
                            {a.action}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 13, color: '#94a3b8' }}>
                          {a.table_name || '—'}
                        </td>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>
                          {a.record_id || '—'}
                        </td>
                        <td style={S.td}>
                          <span style={{ color: '#fff', fontWeight: 500 }}>
                            {a.performed_by || <span style={{ color: '#475569' }}>Unknown</span>}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: 12 }}>{a.ip_address || '—'}</td>
                        <td style={{ ...S.td, fontSize: 12, whiteSpace: 'nowrap' }}>
                          {new Date(a.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={activityPage}
                totalPages={totalPages(activities)}
                onPrev={() => setActivityPage(p => p - 1)}
                onNext={() => setActivityPage(p => p + 1)}
                total={activities.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
      )}

      {/* ══════════ TAB: ASSIGNMENTS ══════════ */}
      {activeTab === 'assignments' && (
        <div>
          {/* Unassigned Users — needs action */}
          <div style={{ ...S.card, marginBottom: 24, borderColor: unassigned.length > 0 ? COLORS.amber : COLORS.border }}>
            <h2 style={{ ...S.sectionTitle, color: COLORS.amber }}>
              ⚠️ Users Without Project Assignment ({unassigned.length})
            </h2>
            <div style={S.sectionSub}>Engineers and managers who haven't been assigned to any project yet</div>
            {unassigned.length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: 'center', padding: 20 }}>✅ All users are assigned to projects.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>USER</th>
                      <th style={S.th}>ROLE</th>
                      <th style={S.th}>JOINED</th>
                      <th style={S.th}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassigned.map((u, i) => (
                      <tr key={u.user_id}>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>{i + 1}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 12, padding: '2px 8px', background: '#1e293b', borderRadius: 4, color: COLORS.purple }}>
                            {u.role_name}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: 13 }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={S.td}>
                          <button onClick={() => { setSelectedUser(u); setShowAssignModal(true); }}
                            style={{ padding: '5px 14px', background: COLORS.green, border: 'none',
                              borderRadius: 6, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                            Assign Project
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assigned Users */}
          <div style={S.card}>
            <h2 style={{ ...S.sectionTitle, color: COLORS.green }}>
              ✅ Assigned Users ({assigned.length})
            </h2>
            <div style={S.sectionSub}>Users currently assigned to projects</div>
            {assigned.length === 0 ? (
              <p style={{ color: COLORS.muted, textAlign: 'center', padding: 20 }}>No assignments yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>USER</th>
                      <th style={S.th}>SYSTEM ROLE</th>
                      <th style={S.th}>PROJECT</th>
                      <th style={S.th}>TEAM ROLE</th>
                      <th style={S.th}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assigned.map((u, i) => (
                      <tr key={`${u.user_id}-${u.project_id}`}>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>{i + 1}</td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 12, padding: '2px 8px', background: '#1e293b', borderRadius: 4, color: COLORS.purple }}>
                            {u.role_name}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: COLORS.purple, fontWeight: 500 }}>{u.project_name}</td>
                        <td style={{ ...S.td, fontSize: 13, color: COLORS.muted }}>{u.team_role}</td>
                        <td style={S.td}>
                          <button onClick={() => handleUnassign(u.user_id, u.project_id)}
                            style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${COLORS.red}`,
                              borderRadius: 6, color: COLORS.red, cursor: 'pointer', fontSize: 12 }}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ TAB: ALL USERS ══════════ */}
      {activeTab === 'users' && (
        <div style={S.card}>
          <h2 style={S.sectionTitle}>User Management</h2>
          <div style={S.sectionSub}>
            {users.length} user{users.length !== 1 ? 's' : ''} total — manage access and permissions
          </div>
          {loadingUsers ? (
            <p style={{ color: '#64748b' }}>Loading users...</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>USER</th>
                      <th style={S.th}>ROLE</th>
                      <th style={S.th}>STATUS</th>
                      <th style={S.th}>LAST LOGIN</th>
                      <th style={S.th}>JOINED</th>
                      <th style={S.th}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.length === 0 ? (
                      <EmptyRow cols={7} icon="👥" msg="No users found." />
                    ) : pagedUsers.map((u, i) => (
                      <tr key={u.user_id}>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>
                          {(userPage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 12, padding: '2px 8px', background: '#1e293b', borderRadius: 4, color: '#94a3b8' }}>
                            {u.role_name}
                          </span>
                        </td>
                        <td style={S.td}>
                          {u.is_active === 1 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 13 }}>
                              ● Active
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#ef4444', fontSize: 13 }}>
                              ● Blocked
                            </span>
                          )}
                        </td>
                        <td style={{ ...S.td, fontSize: 13 }}>
                          {u.last_login ? new Date(u.last_login).toLocaleString() : (
                            <span style={{ color: '#475569' }}>Never</span>
                          )}
                        </td>
                        <td style={{ ...S.td, fontSize: 13 }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={S.td}>
                          {u.user_id === user?.user_id ? (
                            <span style={{ padding: '4px 10px', background: '#334155', borderRadius: 4, fontSize: 12 }}>You</span>
                          ) : u.is_active === 1 ? (
                            <button style={S.blockBtn} onClick={() => handleBlock(u.user_id, u.name)}>Block</button>
                          ) : (
                            <button style={S.unblockBtn} onClick={() => handleUnblock(u.user_id)}>Unblock</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={userPage}
                totalPages={totalPages(users)}
                onPrev={() => setUserPage(p => p - 1)}
                onNext={() => setUserPage(p => p + 1)}
                total={users.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
      )}

      {/* ══════════ TAB: SESSIONS ══════════ */}
      {activeTab === 'sessions' && (
        <div style={S.card}>
          <h2 style={S.sectionTitle}>Session History</h2>
          <div style={S.sectionSub}>
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} total — login and logout tracking
          </div>
          {loadingSessions ? (
            <p style={{ color: '#64748b' }}>Loading sessions...</p>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>#</th>
                      <th style={S.th}>USER</th>
                      <th style={S.th}>ROLE</th>
                      <th style={S.th}>LOGGED IN</th>
                      <th style={S.th}>LOGGED OUT</th>
                      <th style={S.th}>DURATION</th>
                      <th style={S.th}>IP / BROWSER</th>
                      <th style={S.th}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSessions.length === 0 ? (
                      <EmptyRow cols={8} icon="🔐" msg="No sessions yet." />
                    ) : pagedSessions.map((s, i) => (
                      <tr key={s.session_id}>
                        <td style={{ ...S.td, color: '#475569', fontSize: 12 }}>
                          {(sessionPage - 1) * PAGE_SIZE + i + 1}
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{s.user_name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>{s.user_email}</div>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontSize: 12, padding: '2px 8px', background: '#1e293b', borderRadius: 4, color: '#94a3b8' }}>
                            {s.role_name}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize: 13, whiteSpace: 'nowrap' }}>
                          {new Date(s.login_time).toLocaleString()}
                        </td>
                        <td style={{ ...S.td, fontSize: 13, whiteSpace: 'nowrap' }}>
                          {s.logout_time
                            ? new Date(s.logout_time).toLocaleString()
                            : <span style={{ color: '#475569' }}>—</span>
                          }
                        </td>
                        <td style={{ ...S.td, fontSize: 13 }}>
                          {formatDuration(s.session_duration_mins)}
                          {s.status === 'active' && (
                            <span style={{ color: '#10b981', fontSize: 11, marginLeft: 5 }}>(live)</span>
                          )}
                        </td>
                        <td style={S.td}>
                          <div style={{ fontSize: 13 }}>{s.ip_address || '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{formatBrowser(s.user_agent)}</div>
                        </td>
                        <td style={S.td}>
                          {s.status === 'active' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981', fontWeight: 600, fontSize: 13 }}>
                              ● Live
                            </span>
                          )}
                          {s.status === 'logged_out' && (
                            <span style={{ color: '#64748b', fontSize: 13 }}>✓ Ended</span>
                          )}
                          {s.status === 'expired' && (
                            <span style={{ color: '#f59e0b', fontSize: 13 }}>⏱ Expired</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={sessionPage}
                totalPages={totalPages(sessions)}
                onPrev={() => setSessionPage(p => p - 1)}
                onNext={() => setSessionPage(p => p + 1)}
                total={sessions.length}
                pageSize={PAGE_SIZE}
              />
            </>
          )}
        </div>
      )}

      {/* ══════════ ASSIGN PROJECT MODAL ══════════ */}
      {showAssignModal && selectedUser && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ ...S.card, width: 440, maxWidth: '90vw' }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 6, fontSize: 18 }}>Assign Project</h3>
            <p style={{ margin: '0 0 20px', color: COLORS.muted, fontSize: 14 }}>
              Assigning to: <strong style={{ color: COLORS.purple }}>{selectedUser.name}</strong> ({selectedUser.role_name})
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, color: COLORS.muted, fontSize: 14 }}>Select Project</label>
              <select value={assignProjectId} onChange={e => setAssignProjectId(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: '#0F0F1A', border: `1px solid ${COLORS.border}`,
                  color: COLORS.text, fontSize: 14 }}>
                <option value="">-- Choose project --</option>
                {projects.map(p => (
                  <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', marginBottom: 6, color: COLORS.muted, fontSize: 14 }}>Team Role</label>
              <select value={assignRole} onChange={e => setAssignRole(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8,
                  background: '#0F0F1A', border: `1px solid ${COLORS.border}`,
                  color: COLORS.text, fontSize: 14 }}>
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="supervisor">Supervisor</option>
                <option value="accountant">Accountant</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => { setShowAssignModal(false); setAssignProjectId(''); }}
                style={{ padding: '9px 20px', borderRadius: 8,
                  border: `1px solid ${COLORS.border}`, background: 'transparent',
                  color: COLORS.muted, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAssign}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none',
                  background: COLORS.green, color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                Assign Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CREATE ADMIN MODAL ══════════ */}
      {showCreateAdmin && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ ...S.card, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ color: '#f1f5f9', marginBottom: 16, fontSize: 18 }}>🛡 Create Admin Account</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                placeholder="Full Name" value={adminForm.name}
                onChange={e => setAdminForm({ ...adminForm, name: e.target.value })}
                style={{ padding: '10px 14px', background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}
              />
              <input
                placeholder="Email" type="email" value={adminForm.email}
                onChange={e => setAdminForm({ ...adminForm, email: e.target.value })}
                style={{ padding: '10px 14px', background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}
              />
              <input
                placeholder="Password" type="password" value={adminForm.password}
                onChange={e => setAdminForm({ ...adminForm, password: e.target.value })}
                style={{ padding: '10px 14px', background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={() => { setShowCreateAdmin(false); setAdminForm({ name: '', email: '', password: '' }); }}
                  style={{ padding: '8px 18px', background: 'transparent', border: '1px solid #2a2a45', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
                >Cancel</button>
                <button onClick={handleCreateAdmin}
                  style={{ padding: '8px 18px', background: '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >Create Admin</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
