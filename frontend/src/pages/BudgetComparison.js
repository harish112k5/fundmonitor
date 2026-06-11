import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';

export default function BudgetComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/budget-comparison')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '₹0';

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  // Summary row
  const totals = data.reduce((acc, r) => ({
    billable: acc.billable + r.billable,
    actual: acc.actual + r.actual,
    billed: acc.billed + r.billed,
    profitLoss: acc.profitLoss + r.profitLoss
  }), { billable: 0, actual: 0, billed: 0, profitLoss: 0 });

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Budget Analysis</h1>
          <p>Billable vs Actual vs Billed comparison per project</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">📋</div>
          <div className="stat-info">
            <div className="stat-label">Total Billable (Budget)</div>
            <div className="stat-value currency">{fmt(totals.billable)}</div>
            <div className="stat-change">Estimated project budgets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">💸</div>
          <div className="stat-info">
            <div className="stat-label">Total Actual Cost</div>
            <div className="stat-value currency">{fmt(totals.actual)}</div>
            <div className="stat-change">Materials + Manpower + Machines + Expenses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-info">
            <div className="stat-label">Total Billed (Revenue)</div>
            <div className="stat-value currency">{fmt(totals.billed)}</div>
            <div className="stat-change">Invoiced amount</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${totals.profitLoss >= 0 ? 'green' : 'red'}`}>
            {totals.profitLoss >= 0 ? '📈' : '📉'}
          </div>
          <div className="stat-info">
            <div className="stat-label">Net Profit / Loss</div>
            <div className="stat-value currency" style={{ color: totals.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)' }}>
              {totals.profitLoss >= 0 ? '+' : ''}{fmt(totals.profitLoss)}
            </div>
            <div className="stat-change">Billed − Actual Cost</div>
          </div>
        </div>
      </div>

      {/* Per-Project Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Project-wise Breakdown</h3>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{data.length} projects</span>
        </div>
        {data.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No project data</h3>
            <p>Add projects and record costs to see the analysis.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Billable (Budget)</th>
                  <th style={{ textAlign: 'right' }}>Actual Cost</th>
                  <th style={{ textAlign: 'right' }}>Billed (Revenue)</th>
                  <th style={{ textAlign: 'right' }}>Budget Variance</th>
                  <th style={{ textAlign: 'right' }}>Profit / Loss</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => {
                  const budgetPct = r.billable > 0 ? ((r.actual / r.billable) * 100).toFixed(0) : 0;
                  return (
                    <tr key={r.project_id}>
                      <td><strong style={{ color: 'var(--text-primary)' }}>{r.project_name}</strong></td>
                      <td><span className={`badge badge-${r.status}`}>{r.status?.replace('_', ' ')}</span></td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.billable)}</td>
                      <td style={{ textAlign: 'right' }}>{fmt(r.actual)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)' }}>{fmt(r.billed)}</td>
                      <td style={{ textAlign: 'right', color: r.budgetVariance >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {r.budgetVariance >= 0 ? '+' : ''}{fmt(r.budgetVariance)}
                      </td>
                      <td style={{ textAlign: 'right', color: r.profitLoss >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                        {r.profitLoss >= 0 ? '+' : ''}{fmt(r.profitLoss)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(budgetPct, 100)}%`, height: '100%', borderRadius: 3,
                              background: budgetPct > 100 ? 'var(--danger)' : budgetPct > 80 ? 'var(--warning)' : 'var(--success)'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{budgetPct}%</span>
                        </div>
                      </td>
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
