import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import {
  HiOutlineExclamationCircle,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineExclamation,
  HiOutlineChartBar
} from 'react-icons/hi';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/alerts')
      .then(r => setAlerts(r.data))
      .catch(() => toast.error('Failed to load alerts'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Alerts & Notifications</h1>
          <p>{alerts?.totalAlerts || 0} items need your attention</p>
        </div>
        <div className={`badge ${alerts?.totalAlerts > 0 ? 'badge-overdue' : 'badge-active'}`} style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
          {alerts?.totalAlerts > 0 ? `${alerts.totalAlerts} Active Alerts` : 'All Clear ✓'}
        </div>
      </div>

      {/* Overdue Bills */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="alert-section-header">
          <HiOutlineClock style={{ color: 'var(--danger)', fontSize: '1.2rem' }} />
          <h3>Overdue Bills ({alerts?.overdueBills?.length || 0})</h3>
        </div>
        {alerts?.overdueBills?.length > 0 ? (
          <div className="alert-list">
            {alerts.overdueBills.map(b => (
              <div key={b.billing_id} className="alert-item alert-item-danger">
                <div>
                  <strong>{b.invoice_number}</strong> — {b.project_name}
                  <div className="alert-meta">Due: {b.due_date} · Amount: {fmt(b.amount)}</div>
                </div>
                <span className="badge badge-overdue">Overdue</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="alert-empty">No overdue bills 👍</p>
        )}
      </div>

      {/* Pending Interest */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="alert-section-header">
          <HiOutlineCurrencyDollar style={{ color: 'var(--warning)', fontSize: '1.2rem' }} />
          <h3>Pending Interest Payments ({alerts?.pendingInterest?.length || 0})</h3>
        </div>
        {alerts?.pendingInterest?.length > 0 ? (
          <div className="alert-list">
            {alerts.pendingInterest.map(ip => (
              <div key={ip.id} className="alert-item alert-item-warning">
                <div>
                  <strong>{ip.project_name}</strong> — {ip.financier_name}
                  <div className="alert-meta">Date: {ip.payment_date} · Amount: {fmt(ip.amount)}</div>
                </div>
                <span className="badge badge-pending">Pending</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="alert-empty">All interest payments are up to date 👍</p>
        )}
      </div>

      {/* Over Budget Projects */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="alert-section-header">
          <HiOutlineExclamation style={{ color: 'var(--danger)', fontSize: '1.2rem' }} />
          <h3>Over Budget Projects ({alerts?.overBudget?.length || 0})</h3>
        </div>
        {alerts?.overBudget?.length > 0 ? (
          <div className="alert-list">
            {alerts.overBudget.map(p => (
              <div key={p.project_id} className="alert-item alert-item-danger">
                <div>
                  <strong>{p.project_name}</strong>
                  <div className="alert-meta">
                    Budget: {fmt(p.estimated_budget)} · Actual: {fmt(p.actual_cost)} ·
                    <span style={{ color: 'var(--danger)', fontWeight: 600 }}> Over by {fmt(p.overBy)}</span>
                  </div>
                </div>
                <span className="badge badge-overdue">Over Budget</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="alert-empty">All projects within budget 👍</p>
        )}
      </div>

      {/* Delayed Projects */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="alert-section-header">
          <HiOutlineExclamationCircle style={{ color: 'var(--warning)', fontSize: '1.2rem' }} />
          <h3>Delayed Projects ({alerts?.delayedProjects?.length || 0})</h3>
        </div>
        {alerts?.delayedProjects?.length > 0 ? (
          <div className="alert-list">
            {alerts.delayedProjects.map(p => (
              <div key={p.project_id} className="alert-item alert-item-warning">
                <div>
                  <strong>{p.project_name}</strong>
                  <div className="alert-meta">Expected End: {p.end_date} · Status: {p.status}</div>
                </div>
                <span className="badge badge-on_hold">Delayed</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="alert-empty">No delayed projects 👍</p>
        )}
      </div>

      {/* Loan Interest Tracker */}
      <div className="card">
        <div className="alert-section-header">
          <HiOutlineChartBar style={{ color: 'var(--accent-start)', fontSize: '1.2rem' }} />
          <h3>Loan Interest Tracker ({alerts?.loanAlerts?.length || 0})</h3>
        </div>
        {alerts?.loanAlerts?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Financier</th>
                  <th>Principal</th>
                  <th>Rate</th>
                  <th>Monthly Interest</th>
                  <th>Expected Total</th>
                  <th>Paid</th>
                  <th>Shortfall</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {alerts.loanAlerts.map(l => (
                  <tr key={l.id}>
                    <td><strong style={{ color: 'var(--text-primary)' }}>{l.project_name}</strong></td>
                    <td>{l.financier_name}</td>
                    <td>{fmt(l.principal)}</td>
                    <td>{l.interest_rate}%</td>
                    <td>{fmt(l.monthly_interest)}</td>
                    <td>{fmt(l.expected_total)}</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(l.total_paid)}</td>
                    <td style={{ color: l.shortfall > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      {l.shortfall > 0 ? fmt(l.shortfall) : '—'}
                    </td>
                    <td>
                      <span className={`badge ${l.status === 'on_track' ? 'badge-active' : 'badge-overdue'}`}>
                        {l.status === 'on_track' ? 'On Track' : 'Behind'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="alert-empty">No active loans to track</p>
        )}
      </div>
    </AnimatedItem>
    </PageWrapper>
  );
}
