import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import AnimatedKPICard from '../components/AnimatedKPICard';
import SkeletonCard, { SkeletonKPI, SkeletonTable } from '../components/SkeletonCard';
import AnimatedTableRow from '../components/AnimatedTableRow';
import API from '../api';
import { 
  HiOutlineDocumentText, 
  HiOutlineCash, 
  HiOutlineCheckCircle, 
  HiOutlineClipboardCheck, 
  HiOutlineExclamationCircle 
} from 'react-icons/hi';

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
        const res = await API.get(`/projects/${id}/finance`);
        const d = res.data;
        if (d && d.project) {
          setData({
            project: d.project || {},
            billing_summary: d.billing?.summary || {
              total_billable: 0,
              total_submitted: 0,
              total_certified: 0,
              total_received: 0,
              pending_payment: 0,
              pending_approval: 0
            },
            actual_cost: {
              total: d.expenses?.total || 0,
              material: 0, manpower: 0, machine: 0, expenses: 0
            },
            billing_records: d.billing?.records || [],
            computed: {
              budget_utilization: 0,
              roi: 0,
              net_profit: d.profit_loss || 0
            }
          });
        }
        else setError('Failed to load');
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => <SkeletonKPI key={i} />)}
      </div>
      <SkeletonCard height="200px" />
      <div style={{ marginTop: 20 }}><SkeletonTable rows={5} /></div>
    </PageWrapper>
  );

  if (error) return (
    <PageWrapper>
      <AnimatedItem delayIndex={0}>
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="animate-float" style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: 'var(--danger)', marginBottom: 16, fontFamily: 'var(--font-heading)', fontSize: '24px' }}>Error: {error}</div>
          <button onClick={() => window.location.reload()} className="btn-premium">
            Retry
          </button>
        </div>
      </AnimatedItem>
    </PageWrapper>
  );

  if (!data) return null;

  const { project, billing_summary, actual_cost, billing_records, computed } = data;
  const pendingPayment = (billing_summary?.total_certified || 0) - (billing_summary?.total_received || 0);
  const pendingRecovery = (billing_summary?.pending_approval || 0) + (billing_summary?.pending_payment || 0);

  // Determine the latest stage from billing records
  const latestStage = billing_records.length > 0
    ? billing_records.reduce((best, r) => {
        const idx = STAGE_ORDER.indexOf(r.billing_stage);
        return idx > STAGE_ORDER.indexOf(best) ? r.billing_stage : best;
      }, 'BILLABLE')
    : 'BILLABLE';
  const latestStageIdx = STAGE_ORDER.indexOf(latestStage);

  const budgetUtil = parseFloat(computed?.budget_utilization || 0);
  const utilColor = budgetUtil > 90 ? '#EF4444' : budgetUtil > 70 ? '#F59E0B' : '#10B981';

  return (
    <PageWrapper>
      {/* SECTION A — Header */}
      <AnimatedItem delayIndex={0}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/budget-comparison')}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '7px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
            ← Back to Budget Analysis
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '1px' }}>{project.project_name}</h1>
            <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', alignItems: 'center', fontFamily: 'var(--font-body)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Tender: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{formatINR(project.tender_amount)}</strong>
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Progress: <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{project.work_completed_percent || 0}%</strong>
              </span>
            </div>
          </div>
          <span style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)', padding: '5px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-heading)', textTransform: 'uppercase' }}>
            {project.status?.replace('_', ' ')}
          </span>
        </div>
      </AnimatedItem>

      {/* SECTION B — 5 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <AnimatedKPICard index={1} label="Billable" value={billing_summary.total_billable} isMoney={true} icon={HiOutlineDocumentText} accentColor="#F59E0B" subtitle="Work completed on site" />
        <AnimatedKPICard index={2} label="Submitted" value={billing_summary.total_submitted} isMoney={true} icon={HiOutlineClipboardCheck} accentColor="#3B82F6" subtitle="RA Bills raised" />
        <AnimatedKPICard index={3} label="Certified" value={billing_summary.total_certified} isMoney={true} icon={HiOutlineCheckCircle} accentColor="#10B981" subtitle="Government approved" />
        <AnimatedKPICard index={4} label="Received" value={billing_summary.total_received} isMoney={true} icon={HiOutlineCash} accentColor="#2DD4BF" subtitle="Money credited" />
        <AnimatedKPICard index={5} label="Pending Payment" value={pendingPayment} isMoney={true} icon={HiOutlineExclamationCircle} accentColor={pendingPayment > 0 ? '#EF4444' : '#10B981'} subtitle="Yet to be received" />
      </div>

      {/* SECTION C — Billing Stage Pipeline */}
      <AnimatedItem delayIndex={3}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 16, background: 'var(--accent)', borderRadius: 2 }} />
            Billing Stage Pipeline
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: 14, left: 30, right: 30, height: 2, background: 'var(--border)', zIndex: 0 }} />
            {STAGE_ORDER.map((stage, i) => {
              const isCompleted = i < latestStageIdx;
              const isCurrent = i === latestStageIdx;
              const isFuture = i > latestStageIdx;
              return (
                <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                  <div className={isCurrent ? "animate-pulse-glow" : ""} style={{
                    width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-heading)',
                    background: isCompleted ? '#10B981' : isCurrent ? '#F59E0B' : 'var(--bg-page)',
                    border: isFuture ? '2px solid var(--border)' : 'none',
                    color: isCompleted ? '#0A0A0F' : isCurrent ? '#0A0A0F' : 'var(--text-muted)',
                    marginBottom: 8,
                    boxShadow: isCurrent ? '0 0 15px rgba(245,158,11,0.4)' : 'none'
                  }}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: isCurrent ? 700 : 600, fontFamily: 'var(--font-heading)',
                    color: isCompleted ? '#10B981' : isCurrent ? '#F59E0B' : 'var(--text-muted)',
                    textDecoration: isCompleted ? 'line-through' : 'none', textTransform: 'uppercase', letterSpacing: 0.5
                  }}>{STAGE_LABELS[stage]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimatedItem>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>
        {/* SECTION D — Actual Cost Breakdown */}
        <AnimatedItem delayIndex={4}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 16, background: '#F59E0B', borderRadius: 2 }} />
              Actual Cost Breakdown
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, flex: 1 }}>
              {[
                { label: 'Materials',  value: actual_cost.material, accent: '#A855F7' },
                { label: 'Manpower',   value: actual_cost.manpower, accent: '#10B981' },
                { label: 'Machines',   value: actual_cost.machine,  accent: '#3B82F6' },
                { label: 'Expenses',   value: actual_cost.expenses, accent: '#F59E0B' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-page)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-heading)' }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: item.accent, fontFamily: 'var(--font-mono)' }}>{formatINR(item.value)}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1 }}>Net Profit / Loss</span>
              <span style={{ fontWeight: 700, fontSize: 20, fontFamily: 'var(--font-mono)', color: computed.net_profit >= 0 ? '#10B981' : '#EF4444' }}>
                {computed.net_profit >= 0 ? '+' : ''}{formatINR(computed.net_profit)}
              </span>
            </div>
          </div>
        </AnimatedItem>

        {/* SECTION E — Financial Ratios */}
        <AnimatedItem delayIndex={5}>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 12, height: '100%' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-heading)' }}>Budget Utilization</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: utilColor, fontFamily: 'var(--font-mono)' }}>{budgetUtil}%</div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-heading)' }}>ROI</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: (computed.roi || 0) >= 0 ? '#10B981' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                {(computed.roi || 0).toFixed ? parseFloat(computed.roi || 0).toFixed(1) : 0}%
              </div>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'var(--font-heading)' }}>Pending Recovery</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: pendingRecovery > 0 ? '#EF4444' : '#10B981', fontFamily: 'var(--font-mono)' }}>{formatINR(pendingRecovery)}</div>
            </div>
          </div>
        </AnimatedItem>
      </div>

      {/* SECTION F — All Invoices Table */}
      <AnimatedItem delayIndex={6}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 4, height: 16, background: '#A855F7', borderRadius: 2 }} />
            Invoice Records ({billing_records.length})
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Invoice No','MB Ref','Billable','Submitted','Certified','Received','Pending','Rejection','Stage','Dates'].map(h => (
                    <th key={h} style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'var(--font-heading)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {billing_records.length === 0 ? (
                  <tr><td colSpan={10} style={{ padding: 30, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>No invoice records yet</td></tr>
                ) : billing_records.map((rec, idx) => {
                  const pendingAmt = (parseFloat(rec.certified_amount) || 0) - (parseFloat(rec.payment_received) || 0);
                  const rejAmt = parseFloat(rec.rejection_amount) || 0;
                  return (
                    <AnimatedTableRow key={rec.billing_id} index={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{rec.invoice_number || '—'}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>{rec.mb_reference || '—'}</td>
                      <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{formatINR(rec.billable_amount)}</td>
                      <td style={{ padding: '12px 10px', fontFamily: 'var(--font-mono)' }}>{formatINR(rec.submitted_amount)}</td>
                      <td style={{ padding: '12px 10px', color: '#10B981', fontFamily: 'var(--font-mono)' }}>{formatINR(rec.certified_amount)}</td>
                      <td style={{ padding: '12px 10px', color: '#2DD4BF', fontFamily: 'var(--font-mono)' }}>{formatINR(rec.payment_received)}</td>
                      <td style={{ padding: '12px 10px', color: pendingAmt > 0 ? '#EF4444' : '#10B981', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{formatINR(pendingAmt)}</td>
                      <td style={{ padding: '12px 10px', color: rejAmt > 0 ? '#F59E0B' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{rejAmt > 0 ? formatINR(rejAmt) : '—'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span className="badge badge-ongoing">
                          {STAGE_LABELS[rec.billing_stage] || rec.billing_stage}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px', fontFamily: 'var(--font-body)' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                          {rec.billing_date ? new Date(rec.billing_date).toLocaleDateString('en-IN') : '—'}
                        </div>
                        {rec.certified_date && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                            Cert: {new Date(rec.certified_date).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </td>
                    </AnimatedTableRow>
                  );
                })}
                {/* Totals Row */}
                {billing_records.length > 0 && (
                  <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700, background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '14px 10px', fontFamily: 'var(--font-heading)', letterSpacing: 1 }} colSpan={2}>TOTALS</td>
                    <td style={{ padding: '14px 10px', fontFamily: 'var(--font-mono)' }}>{formatINR(billing_summary.total_billable)}</td>
                    <td style={{ padding: '14px 10px', fontFamily: 'var(--font-mono)' }}>{formatINR(billing_summary.total_submitted)}</td>
                    <td style={{ padding: '14px 10px', color: '#10B981', fontFamily: 'var(--font-mono)' }}>{formatINR(billing_summary.total_certified)}</td>
                    <td style={{ padding: '14px 10px', color: '#2DD4BF', fontFamily: 'var(--font-mono)' }}>{formatINR(billing_summary.total_received)}</td>
                    <td style={{ padding: '14px 10px', color: pendingPayment > 0 ? '#EF4444' : '#10B981', fontFamily: 'var(--font-mono)' }}>{formatINR(pendingPayment)}</td>
                    <td style={{ padding: '14px 10px' }} colSpan={3}></td>
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
