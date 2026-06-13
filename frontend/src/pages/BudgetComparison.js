import { SkeletonTable } from '../components/SkeletonCard';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';

const formatINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '₹0';

export default function BudgetComparison() {
  const [projects, setProjects] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get('/projects'),
      API.get('/billing'),
      API.get('/dashboard/budget-comparison').catch(() => ({ data: [] }))
    ]).then(([projRes, billRes, budgetRes]) => {
      const projs = projRes.data?.data || projRes.data || [];
      const bills = billRes.data?.data || billRes.data || [];
      const budgetData = budgetRes.data || [];

      // Group billing by project_id
      const billingByProject = {};
      bills.forEach(b => {
        const pid = b.project_id;
        if (!billingByProject[pid]) {
          billingByProject[pid] = { billable: 0, submitted: 0, certified: 0, received: 0 };
        }
        billingByProject[pid].billable  += parseFloat(b.billable_amount  || 0);
        billingByProject[pid].submitted += parseFloat(b.submitted_amount || 0);
        billingByProject[pid].certified += parseFloat(b.certified_amount || 0);
        billingByProject[pid].received  += parseFloat(b.payment_received || 0);
      });

      // Merge budget data (actual costs) with projects
      const budgetByProject = {};
      budgetData.forEach(b => {
        budgetByProject[b.project_id] = {
          actual: b.actual || 0,
          billable_budget: b.billable || 0,
          billed: b.billed || 0,
        };
      });

      const merged = projs.map(p => {
        const billing = billingByProject[p.project_id] || { billable: 0, submitted: 0, certified: 0, received: 0 };
        const budget = budgetByProject[p.project_id] || { actual: 0 };
        const tenderValue = parseFloat(p.tender_amount || p.estimated_budget || 0);
        const actualCost = parseFloat(budget.actual || 0);
        const profitLoss = billing.certified - actualCost;
        const utilization = tenderValue > 0 ? ((actualCost / tenderValue) * 100) : 0;

        return {
          ...p,
          billing,
          tenderValue,
          actualCost,
          profitLoss,
          utilization,
          pendingPayment: billing.certified - billing.received,
        };
      });

      setProjects(merged);
      setBillingData(bills);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  // Summary from billing data
  const summary = billingData.reduce((acc, r) => ({
    billable:  acc.billable  + parseFloat(r.billable_amount  || 0),
    submitted: acc.submitted + parseFloat(r.submitted_amount || 0),
    certified: acc.certified + parseFloat(r.certified_amount || 0),
    received:  acc.received  + parseFloat(r.payment_received || 0),
  }), { billable: 0, submitted: 0, certified: 0, received: 0 });
  summary.pending = summary.certified - summary.received;

  // Filter projects
  const filtered = projects.filter(p => {
    const matchSearch = p.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getHealthDot = (utilization) => {
    if (utilization > 90) return { color: '#f87171', label: 'Critical' };
    if (utilization > 70) return { color: '#fbbf24', label: 'Warning' };
    return { color: '#4ade80', label: 'Healthy' };
  };

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Budget Analysis</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Billing lifecycle tracking across all projects</p>
        </div>
      </div>

      {/* 5 Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Billable',  value: summary.billable,  color: '#fbbf24', icon: '🏗️', sub: 'Work completed, eligible to claim' },
          { label: 'Total Submitted', value: summary.submitted, color: '#60a5fa', icon: '📄', sub: 'RA Bills raised to clients' },
          { label: 'Total Certified', value: summary.certified, color: '#4ade80', icon: '✅', sub: 'Government approved bills' },
          { label: 'Total Received',  value: summary.received,  color: '#2dd4bf', icon: '💰', sub: 'Money actually credited' },
          { label: 'Pending Payment', value: summary.pending,   color: summary.pending > 0 ? '#f87171' : '#4ade80', icon: summary.pending > 0 ? '⏳' : '✓', sub: 'Certified but not yet paid' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{c.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{formatINR(c.value)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search projects..."
          style={{ flex: 1, maxWidth: 280, background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}>
          <option value="ALL">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>{filtered.length} projects</span>
      </div>

      {/* Project Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>No project data found
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Project','Status','Tender Value','Billable','Submitted','Certified','Received','Pending Pmt','Actual Cost','Profit/Loss','Health',''].map(h => (
                    <th key={h} style={{ padding: '10px 10px', textAlign: h === '' ? 'center' : 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const health = getHealthDot(p.utilization);
                  return (
                    <tr key={p.project_id}
                      onClick={() => navigate(`/projects/${p.project_id}/finance`)}
                      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.project_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{p.project_id}</div>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className={`badge badge-${p.status}`} style={{ fontSize: 11 }}>{p.status?.replace('_', ' ')}</span>
                      </td>
                      <td style={{ padding: '10px', fontWeight: 500 }}>{formatINR(p.tenderValue)}</td>
                      <td style={{ padding: '10px' }}>{formatINR(p.billing.billable)}</td>
                      <td style={{ padding: '10px' }}>{formatINR(p.billing.submitted)}</td>
                      <td style={{ padding: '10px', color: '#4ade80' }}>{formatINR(p.billing.certified)}</td>
                      <td style={{ padding: '10px', color: '#2dd4bf' }}>{formatINR(p.billing.received)}</td>
                      <td style={{ padding: '10px', color: p.pendingPayment > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>{formatINR(p.pendingPayment)}</td>
                      <td style={{ padding: '10px' }}>{formatINR(p.actualCost)}</td>
                      <td style={{ padding: '10px', color: p.profitLoss >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                        {p.profitLoss >= 0 ? '+' : ''}{formatINR(p.profitLoss)}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: health.color }} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.utilization.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </AnimatedItem>
    </PageWrapper>
  );
}
