import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);

  // Data loading flags
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    // If not admin, boot them
    if (user && user.role_id !== 1) {
      alert("Access denied — Admin only");
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
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await API.get('/admin/users');
      if (data.success) setUsers(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingUsers(false);
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await API.get('/admin/sessions');
      if (data.success) setSessions(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingSessions(false);
  };

  const fetchActivities = async () => {
    setLoadingActivities(true);
    try {
      const { data } = await API.get('/admin/activity');
      if (data.success) setActivities(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingActivities(false);
  };

  const handleBlock = async (userId, userName) => {
    const confirmed = window.confirm(`Block user "${userName}"? They will be unable to log in.`);
    if (!confirmed) return;
    try {
      await API.patch(`/admin/users/${userId}/block`);
      fetchUsers(); // reload table
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblock = async (userId, userName) => {
    try {
      await API.patch(`/admin/users/${userId}/unblock`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const styles = {
    page: {
      background: '#0f0f1a',
      minHeight: '100vh',
      padding: '24px 32px',
      color: '#f1f5f9',
    },
    card: {
      background: '#1a1a2e',
      border: '1px solid #2a2a45',
      borderRadius: 12,
      padding: '20px 24px',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: '#f1f5f9',
      marginBottom: 4,
    },
    sectionSub: {
      fontSize: 13,
      color: '#64748b',
      marginBottom: 20,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#64748b',
      padding: '10px 12px',
      borderBottom: '1px solid #2a2a45',
    },
    td: {
      padding: '12px',
      fontSize: 14,
      color: '#cbd5e1',
      borderBottom: '1px solid #1e1e35',
      verticalAlign: 'middle',
    },
    blockBtn: {
      padding: '5px 14px',
      background: 'transparent',
      border: '1px solid #ef4444',
      borderRadius: 6,
      color: '#ef4444',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 500,
    },
    unblockBtn: {
      padding: '5px 14px',
      background: 'transparent',
      border: '1px solid #10b981',
      borderRadius: 6,
      color: '#10b981',
      cursor: 'pointer',
      fontSize: 12,
      fontWeight: 500,
    },
    statusActive: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: '#10b981',
      fontSize: 13,
    },
    statusBlocked: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      color: '#ef4444',
      fontSize: 13,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#10b981',
      animation: 'pulse 1.5s infinite',
    },
  };

  const formatBrowser = (userAgent) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    return userAgent.length > 30 ? userAgent.substring(0, 30) + '...' : userAgent;
  };

  const getActionColor = (action) => {
    if (!action) return '#64748b';
    if (action.includes('UNBLOCK')) return '#10b981'; // green (check before BLOCK)
    if (action.includes('BLOCK')) return '#991b1b';   // dark red
    if (action.includes('INSERT')) return '#10b981';  // green
    if (action.includes('UPDATE')) return '#3b82f6';  // blue
    if (action.includes('DELETE')) return '#ef4444';  // red
    if (action.includes('LOGIN')) return '#7c3aed';   // purple
    if (action.includes('LOGOUT')) return '#64748b';  // gray
    return '#64748b';
  };

  const formatDuration = (mins) => {
    if (mins === null || mins === undefined || isNaN(mins)) return '—';
    if (mins < 1) return '< 1 min';
    if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div style={styles.page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: '1px solid #2a2a45',
          borderRadius: 8,
          color: '#94a3b8',
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: 14,
        }}>
          ← Back
        </button>
        <h1 style={{ margin: 0, fontSize: 24, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
          🛡 Admin Control Panel
        </h1>
      </div>

      {/* SECTION 1 — Admin Profile + Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 24, marginBottom: 24 }}>
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#7c3aed', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 'bold' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{user?.name}</h2>
              <div style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600 }}>ADMIN</div>
            </div>
          </div>
          <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div><strong style={{color:'#cbd5e1'}}>Email:</strong> {user?.email}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Total Users</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>{stats?.total_users || 0}</div>
          </div>
          <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Active Sessions</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{stats?.active_sessions || 0}</div>
          </div>
          <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Blocked Users</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#ef4444' }}>{stats?.blocked_users || 0}</div>
          </div>
          <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Actions Today</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{stats?.total_actions_today || 0}</div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — All Users Table */}
      <div style={{ ...styles.card, marginBottom: 24 }}>
        <h2 style={styles.sectionTitle}>User Management</h2>
        <div style={styles.sectionSub}>Manage access and permissions</div>
        
        {loadingUsers ? <p>Loading users...</p> : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>USER</th>
                <th style={styles.th}>ROLE</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>LAST LOGIN</th>
                <th style={styles.th}>JOINED</th>
                <th style={styles.th}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.user_id}>
                  <td style={styles.td}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={styles.td}>{u.role_name}</td>
                  <td style={styles.td}>
                    {u.is_active === 1 ? (
                      <span style={styles.statusActive}>● Active</span>
                    ) : (
                      <span style={styles.statusBlocked}>● Blocked</span>
                    )}
                  </td>
                  <td style={styles.td}>{u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td style={styles.td}>
                    {u.user_id === user?.user_id ? (
                      <span style={{ padding: '4px 10px', background: '#334155', borderRadius: 4, fontSize: 12 }}>You</span>
                    ) : (
                      u.is_active === 1 ? (
                        <button style={styles.blockBtn} onClick={() => handleBlock(u.user_id, u.name)}>Block</button>
                      ) : (
                        <button style={styles.unblockBtn} onClick={() => handleUnblock(u.user_id, u.name)}>Unblock</button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SECTION 3 — Session / Login History */}
      <div style={{ ...styles.card, marginBottom: 24 }}>
        <h2 style={styles.sectionTitle}>Session History</h2>
        <div style={styles.sectionSub}>Login and logout tracking across all users</div>

        {loadingSessions ? <p style={{ color: '#64748b' }}>Loading sessions...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>USER</th>
                  <th style={styles.th}>ROLE</th>
                  <th style={styles.th}>LOGIN TIME</th>
                  <th style={styles.th}>LOGOUT TIME</th>
                  <th style={styles.th}>DURATION</th>
                  <th style={styles.th}>IP / BROWSER</th>
                  <th style={styles.th}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#475569' }}>
                      🔐 No session records yet. Sessions will appear here after users log in.
                    </td>
                  </tr>
                ) : sessions.map(s => (
                  <tr key={s.session_id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{s.user_name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{s.user_email}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: 12, padding: '2px 8px', background: '#1e293b', borderRadius: 4, color: '#94a3b8' }}>
                        {s.role_name}
                      </span>
                    </td>
                    <td style={styles.td}>{new Date(s.login_time).toLocaleString()}</td>
                    <td style={styles.td}>{s.logout_time ? new Date(s.logout_time).toLocaleString() : <span style={{ color: '#475569' }}>—</span>}</td>
                    <td style={styles.td}>
                      {formatDuration(s.session_duration_mins)}
                      {s.status === 'active' && <span style={{ color: '#10b981', fontSize: 11, marginLeft: 4 }}>(ongoing)</span>}
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontSize: 13 }}>{s.ip_address || '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{formatBrowser(s.user_agent)}</div>
                    </td>
                    <td style={styles.td}>
                      {s.status === 'active' && (
                        <span style={{ ...styles.statusActive, fontWeight: 600 }}>
                          <div style={styles.liveDot} /> Live
                        </span>
                      )}
                      {s.status === 'logged_out' && <span style={{ color: '#64748b' }}>Ended</span>}
                      {s.status === 'expired' && <span style={{ color: '#f59e0b' }}>Expired</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 4 — Activity Log Table */}
      <div style={{ ...styles.card }}>
        <h2 style={styles.sectionTitle}>Activity Log</h2>
        <div style={styles.sectionSub}>All data modifications and admin actions</div>

        {loadingActivities ? <p style={{ color: '#64748b' }}>Loading activities...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ACTION</th>
                  <th style={styles.th}>TABLE</th>
                  <th style={styles.th}>RECORD ID</th>
                  <th style={styles.th}>PERFORMED BY</th>
                  <th style={styles.th}>IP ADDRESS</th>
                  <th style={styles.th}>DATE & TIME</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#475569' }}>
                      📋 No activity recorded yet. Actions will appear here as users interact with data.
                    </td>
                  </tr>
                ) : activities.map((a, i) => (
                  <tr key={a.log_id ?? i}>
                    <td style={styles.td}>
                      <span style={{
                        background: getActionColor(a.action),
                        color: '#fff',
                        padding: '3px 10px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                        whiteSpace: 'nowrap',
                      }}>
                        {a.action}
                      </span>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 13, color: '#94a3b8' }}>{a.table_name || '—'}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{a.record_id || '—'}</td>
                    <td style={styles.td}><span style={{ color: '#fff', fontWeight: 500 }}>{a.performed_by || <span style={{ color: '#475569' }}>Unknown</span>}</span></td>
                    <td style={{ ...styles.td, fontSize: 12 }}>{a.ip_address || '—'}</td>
                    <td style={{ ...styles.td, fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(a.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
