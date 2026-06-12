import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(n || 0);

const STAGE_ORDER = ['BILLABLE', 'SUBMITTED', 'CERTIFIED', 'PARTIALLY_PAID', 'PAYMENT_RECEIVED'];
const STAGE_LABELS = {
  BILLABLE: 'Billable',
  SUBMITTED: 'Submitted',
  CERTIFIED: 'Certified',
  PARTIALLY_PAID: 'Part Paid',
  PAYMENT_RECEIVED: 'Received',
};
const STAGE_COLORS = {
  BILLABLE:         { bg: '#92400e', text: '#fbbf24' },
  SUBMITTED:        { bg: '#1e3a5f', text: '#60a5fa' },
  CERTIFIED:        { bg: '#14532d', text: '#4ade80' },
  PARTIALLY_PAID:   { bg: '#7c2d12', text: '#fb923c' },
  PAYMENT_RECEIVED: { bg: '#134e4a', text: '#2dd4bf' },
};

export default function ProjectFinanceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/projects/${id}/finance-summary`);
        if (res.data.success) setData(res.data.data);
        else setError(res.data.message || 'Failed to load');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load project finance data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <PageWrapper>
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading finance details...
      </div>
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper>
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: '#f87171', marginBottom: 16 }}>Error: {error}</div>
        <button onClick={() => window.location.reload()}
          style={{ background: 'var(--text-accent)', color: '#000', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600 }}>
          Retry
        </button>
      </div>
    </PageWrapper>
  );

  if (!data) return null;

  const { project, billing_summary, actual_cost, billing_records, computed } = data;
  const pendingPayment = billing_summary.total_certified - billing_summary.total_received;
  const pendingRecovery = billing_summary.pending_approval + billing_summary.pending_payment;

  // Determine the latest stage from billing records
  const latestStage = billing_records.length > 0
    ? billing_records.reduce((best, r) => {
        const idx = STAGE_ORDER.indexOf(r.billing_stage);
        return idx > STAGE_ORDER.indexOf(best) ? r.billing_stage : best;
      }, 'BILLABLE')
    : 'BILLABLE';
  const latestStageIdx = STAGE_ORDER.indexOf(latestStage);

  const budgetUtil = parseFloat(computed?.budget_utilization || 0);
  const utilColor = budgetUtil > 90 ? '#f87171' : budgetUtil > 70 ? '#fbbf24' : '#4ade80';

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

      {/* SECTION A — Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/budget-comparison')}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          ← Back to Budget Analysis
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{project.project_name}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Tender: <strong style={{ color: 'var(--text-primary)' }}>{formatINR(project.tender_amount)}</strong>
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Progress: <strong style={{ color: 'var(--text-primary)' }}>{project.work_completed_percent || 0}%</strong>
            </span>
          </div>
        </div>
        <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '5px 14px', borderRadius: 14, fontSize: 12, fontWeight: 600 }}>
          {project.status?.replace('_', ' ')}
        </span>
      </div>

      {/* SECTION B — 5 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Billable',        value: billing_summary.total_billable,  color: '#fbbf24', sub: 'Work completed on site' },
          { label: 'Submitted',       value: billing_summary.total_submitted, color: '#60a5fa', sub: 'RA Bills raised' },
          { label: 'Certified',       value: billing_summary.total_certified, color: '#4ade80', sub: 'Government approved' },
          { label: 'Received',        value: billing_summary.total_received,  color: '#2dd4bf', sub: 'Money credited' },
          { label: 'Pending Payment', value: pendingPayment,                  color: pendingPayment > 0 ? '#f87171' : '#4ade80', sub: 'Yet to be received' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{formatINR(c.value)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* SECTION C — Billing Stage Pipeline */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Billing Stage Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {/* Connecting line */}
          <div style={{ position: 'absolute', top: 14, left: 30, right: 30, height: 2, background: 'var(--border-subtle)', zIndex: 0 }} />
          {STAGE_ORDER.map((stage, i) => {
            const isCompleted = i < latestStageIdx;
            const isCurrent = i === latestStageIdx;
            const isFuture = i > latestStageIdx;
            return (
              <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: isCompleted ? '#4ade80' : isCurrent ? '#fbbf24' : 'var(--bg-secondary)',
                  border: isFuture ? '2px solid var(--border-subtle)' : 'none',
                  color: isCompleted ? '#000' : isCurrent ? '#000' : 'var(--text-muted)',
                  marginBottom: 6,
                }}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                  color: isCompleted ? '#4ade80' : isCurrent ? '#fbbf24' : 'var(--text-muted)',
                  textDecoration: isCompleted ? 'line-through' : 'none',
                }}>{STAGE_LABELS[stage]}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION D — Actual Cost Breakdown */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Actual Cost Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Materials',  value: actual_cost.material, accent: '#a78bfa' },
            { label: 'Manpower',   value: actual_cost.manpower, accent: '#4ade80' },
            { label: 'Machines',   value: actual_cost.machine,  accent: '#60a5fa' },
            { label: 'Expenses',   value: actual_cost.expenses, accent: '#fb923c' },
            { label: 'TOTAL',      value: actual_cost.total,    accent: '#f87171', bold: true },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '10px 0' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
              <div style={{ fontSize: item.bold ? 16 : 14, fontWeight: item.bold ? 700 : 500, color: item.accent }}>{formatINR(item.value)}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Net Profit / Loss</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: computed.net_profit >= 0 ? '#4ade80' : '#f87171' }}>
            {computed.net_profit >= 0 ? '+' : ''}{formatINR(computed.net_profit)}
          </span>
        </div>
      </div>

      {/* SECTION E — Financial Ratios */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Budget Utilization</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: utilColor }}>{budgetUtil}%</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>ROI</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: (computed.roi || 0) >= 0 ? '#4ade80' : '#f87171' }}>
            {(computed.roi || 0).toFixed ? parseFloat(computed.roi || 0).toFixed(1) : 0}%
          </div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Pending Recovery</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: pendingRecovery > 0 ? '#f87171' : '#4ade80' }}>{formatINR(pendingRecovery)}</div>
        </div>
      </div>

      {/* SECTION F — All Invoices Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
          Invoice Records ({billing_records.length})
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Invoice No','MB Ref','Billable','Submitted','Certified','Received','Pending','Rejection','Stage','Dates'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billing_records.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 30, color: 'var(--text-muted)', textAlign: 'center' }}>No invoice records yet</td></tr>
              ) : billing_records.map(rec => {
                const stg = STAGE_COLORS[rec.billing_stage] || STAGE_COLORS.BILLABLE;
                const pendingAmt = (parseFloat(rec.certified_amount) || 0) - (parseFloat(rec.payment_received) || 0);
                const rejAmt = parseFloat(rec.rejection_amount) || 0;
                return (
                  <tr key={rec.billing_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--text-primary)' }}>{rec.invoice_number || '—'}</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{rec.mb_reference || '—'}</td>
                    <td style={{ padding: '10px' }}>{formatINR(rec.billable_amount)}</td>
                    <td style={{ padding: '10px' }}>{formatINR(rec.submitted_amount)}</td>
                    <td style={{ padding: '10px', color: '#4ade80' }}>{formatINR(rec.certified_amount)}</td>
                    <td style={{ padding: '10px', color: '#2dd4bf' }}>{formatINR(rec.payment_received)}</td>
                    <td style={{ padding: '10px', color: pendingAmt > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>{formatINR(pendingAmt)}</td>
                    <td style={{ padding: '10px', color: rejAmt > 0 ? '#fb923c' : 'var(--text-muted)' }}>{rejAmt > 0 ? formatINR(rejAmt) : '—'}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: stg.bg, color: stg.text, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>
                        {STAGE_LABELS[rec.billing_stage] || rec.billing_stage}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                        {rec.billing_date ? new Date(rec.billing_date).toLocaleDateString('en-IN') : '—'}
                      </div>
                      {rec.certified_date && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          Cert: {new Date(rec.certified_date).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              {billing_records.length > 0 && (
                <tr style={{ borderTop: '2px solid var(--border-subtle)', fontWeight: 700 }}>
                  <td style={{ padding: '10px' }} colSpan={2}>TOTALS</td>
                  <td style={{ padding: '10px' }}>{formatINR(billing_summary.total_billable)}</td>
                  <td style={{ padding: '10px' }}>{formatINR(billing_summary.total_submitted)}</td>
                  <td style={{ padding: '10px', color: '#4ade80' }}>{formatINR(billing_summary.total_certified)}</td>
                  <td style={{ padding: '10px', color: '#2dd4bf' }}>{formatINR(billing_summary.total_received)}</td>
                  <td style={{ padding: '10px', color: pendingPayment > 0 ? '#f87171' : '#4ade80' }}>{formatINR(pendingPayment)}</td>
                  <td style={{ padding: '10px' }} colSpan={3}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      </AnimatedItem>
    </PageWrapper>
  );
}
