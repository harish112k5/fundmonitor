import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

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

  const [loadingUsers,      setLoadingUsers]      = useState(false);
  const [loadingSessions,   setLoadingSessions]   = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Pagination state
  const [userPage,     setUserPage]     = useState(1);
  const [sessionPage,  setSessionPage]  = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  useEffect(() => {
    if (user && user.role_id !== 1) {
      alert('Access denied — Admin only');
      navigate('/');
    } else if (user) {
      fetchStats();
      fetchUsers();
      fetchSessions();
      fetchActivities();
    }
  }, [user, navigate]);

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
      if (data.success) setUsers(data.data);
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

  const handleBlock = async (userId, userName) => {
    if (!window.confirm(`Block user "${userName}"? They will be unable to log in.`)) return;
    try {
      await API.patch(`/admin/users/${userId}/block`);
      fetchUsers();
      fetchStats();
    } catch (err) { alert(err.response?.data?.message || 'Failed to block user'); }
  };

  const handleUnblock = async (userId, userName) => {
    try {
      await API.patch(`/admin/users/${userId}/unblock`);
      fetchUsers();
      fetchStats();
    } catch (err) { alert(err.response?.data?.message || 'Failed to unblock user'); }
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
    if (action.includes('UNBLOCK')) return '#10b981';
    if (action.includes('BLOCK'))   return '#991b1b';
    if (action.includes('INSERT'))  return '#10b981';
    if (action.includes('UPDATE'))  return '#3b82f6';
    if (action.includes('DELETE'))  return '#ef4444';
    if (action.includes('LOGIN'))   return '#7c3aed';
    if (action.includes('LOGOUT'))  return '#64748b';
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
    liveDot:     { width: 8, height: 8, borderRadius: '50%', background: '#10b981',
                   display: 'inline-block', marginRight: 6, animation: 'pulse 1.5s infinite' },
  };

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
          border: '1px solid #2a2a45', borderRadius: 8, color: '#94a3b8',
          padding: '6px 14px', cursor: 'pointer', fontSize: 14,
        }}>← Back</button>
        <h1 style={{ margin: 0, fontSize: 24, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
          🛡 Admin Control Panel
        </h1>
      </div>

      {/* SECTION 1 — Profile + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24, marginBottom: 24 }}>
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#7c3aed', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{user?.name}</h2>
              <div style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>ADMIN</div>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#cbd5e1' }}>Email:</strong> {user?.email}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Users',     value: stats?.total_users      || 0, color: '#3b82f6' },
            { label: 'Active Sessions', value: stats?.active_sessions  || 0, color: '#10b981' },
            { label: 'Blocked Users',   value: stats?.blocked_users    || 0, color: '#ef4444' },
            { label: 'Actions Today',   value: stats?.total_actions_today || 0, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...S.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 — User Management */}
      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={S.sectionTitle}>User Management</h2>
            <div style={S.sectionSub}>
              {users.length} user{users.length !== 1 ? 's' : ''} total — manage access and permissions
            </div>
          </div>
          <button onClick={() => { fetchUsers(); fetchStats(); }} style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a45',
            borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13,
          }}>↺ Refresh</button>
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
                          <button style={S.unblockBtn} onClick={() => handleUnblock(u.user_id, u.name)}>Unblock</button>
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

      {/* SECTION 3 — Session History */}
      <div style={{ ...S.card, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={S.sectionTitle}>Session History</h2>
            <div style={S.sectionSub}>
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} total — login and logout tracking
            </div>
          </div>
          <button onClick={fetchSessions} style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a45',
            borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13,
          }}>↺ Refresh</button>
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
                    <th style={S.th}>LOGGED IN AT</th>
                    <th style={S.th}>LOGGED OUT AT</th>
                    <th style={S.th}>DURATION</th>
                    <th style={S.th}>IP / BROWSER</th>
                    <th style={S.th}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedSessions.length === 0 ? (
                    <EmptyRow cols={8} icon="🔐" msg="No sessions yet. Sessions appear here after users log in." />
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
                            <span style={S.liveDot} /> Live
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

      {/* SECTION 4 — Activity Log */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={S.sectionTitle}>Activity Log</h2>
            <div style={S.sectionSub}>
              {activities.length} action{activities.length !== 1 ? 's' : ''} recorded — all data modifications and admin actions
            </div>
          </div>
          <button onClick={fetchActivities} style={{
            padding: '6px 14px', background: 'transparent', border: '1px solid #2a2a45',
            borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13,
          }}>↺ Refresh</button>
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
                    <th style={S.th}>IP ADDRESS</th>
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

    </div>
  );
}
