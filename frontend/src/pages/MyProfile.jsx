import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import { useAuth } from '../context/AuthContext';
import API from '../api';

const ROLE_LABELS = {
  1: 'Administrator',
  2: 'Project Manager',
  3: 'Site Engineer',
  4: 'Accountant',
  5: 'Site Supervisor',
  6: 'Viewer',
};

const ROLE_DESCRIPTIONS = {
  1: 'Full system access. Manages users, projects, and all modules.',
  2: 'Manages assigned projects with full resource control.',
  3: 'Field-level data entry and resource management for assigned projects.',
  4: 'Full access to billing, expenses, and budget analysis.',
  5: 'Read-only daily site data for assigned projects.',
  6: 'Read-only access to assigned project data.',
};

export default function MyProfile() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load assigned projects for non-accountant roles
        if (user?.role_id !== 4) {
          const res = await API.get('/projects/my-projects');
          setProjects(res.data || []);
        }

        // Load role-specific stats
        if (user?.role_id === 4) {
          // Accountant: billing stats
          try {
            const [billRes, expRes] = await Promise.all([
              API.get('/billing'),
              API.get('/expenses')
            ]);
            const bills = billRes.data?.data || billRes.data || [];
            const expenses = expRes.data?.data || expRes.data || [];
            const thisMonth = new Date().toISOString().slice(0, 7);
            setStats({
              totalBills: bills.length,
              totalExpenses: expenses.filter(e => e.expense_date?.startsWith(thisMonth)).length,
              totalBillingAmt: bills.reduce((s, b) => s + parseFloat(b.billable_amount || b.amount || 0), 0),
            });
          } catch {}
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const roleId = user?.role_id;
  const roleLabel = ROLE_LABELS[roleId] || user?.role_name;
  const roleDesc = ROLE_DESCRIPTIONS[roleId] || '';

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 10, padding: 20, marginBottom: 16
  };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 };

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 20, marginBottom: 20 }}>My Profile</h1>

        {/* User Info Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700,
              background: 'var(--accent-glow)', color: 'var(--text-accent)',
              border: '2px solid var(--text-accent)'
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <span style={{
                  background: '#92400e', color: '#fbbf24', padding: '2px 10px',
                  borderRadius: 10, fontSize: 11, fontWeight: 600
                }}>{roleLabel}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID: {user?.user_id}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            {roleDesc}
          </div>
        </div>

        {/* Manager/Engineer/Supervisor/Viewer: My Projects */}
        {[2, 3, 5, 6].includes(roleId) && (
          <div style={cardStyle}>
            <div style={labelStyle}>My Assigned Projects ({projects.length})</div>
            {projects.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No projects assigned yet. Contact your administrator.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
                {projects.map(p => (
                  <div key={p.project_id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px', background: 'var(--bg-primary)', borderRadius: 8,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{p.project_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Role: {p.team_role || 'Member'} • Status: {p.status}
                      </div>
                    </div>
                    <span className={`badge badge-${p.status}`} style={{ fontSize: 10 }}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Accountant: Financial Summary */}
        {roleId === 4 && stats && (
          <div style={cardStyle}>
            <div style={labelStyle}>Financial Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
              <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#fbbf24' }}>{stats.totalBills}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Total Bills</div>
              </div>
              <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#60a5fa' }}>{stats.totalExpenses}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Expenses This Month</div>
              </div>
              <div style={{ textAlign: 'center', padding: 14, background: 'var(--bg-primary)', borderRadius: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>
                  ₹{stats.totalBillingAmt?.toLocaleString('en-IN')}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Total Billing</div>
              </div>
            </div>
          </div>
        )}

        {/* Supervisor: Today's Site Info */}
        {roleId === 5 && projects.length > 0 && (
          <div style={cardStyle}>
            <div style={labelStyle}>My Site</div>
            <div style={{ padding: 14, background: 'var(--bg-primary)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{projects[0]?.project_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Location: {projects[0]?.location || '—'} • Status: {projects[0]?.status}
              </div>
            </div>
          </div>
        )}
      </AnimatedItem>
    </PageWrapper>
  );
}
