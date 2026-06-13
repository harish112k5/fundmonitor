import { SkeletonTable } from '../components/SkeletonCard';
import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { formatINR, statusBadge } from '../utils/finance';
import {
  validateLoanForm,
  formatAmountInput
} from '../utils/validators';
import { FormField, inputStyle } from '../components/FormField';

export default function Loans() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [financiers, setFinanciers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ project_id: '', financier_id: '', principal: '', interest_rate: '', interest_type: 'Simple', tenure_months: '12', repayment_type: 'Monthly', start_date: '', end_date: '', notes: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, p, f] = await Promise.all([API.get('/loans'), API.get('/projects'), API.get('/financiers')]);
      setData(d.data); setProjects(p.data); setFinanciers(f.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validateLoanForm(form);
    if (!valid) { setErrors(errs); return; }
    setErrors({});
    try {
      if (editing) { await API.put(`/loans/${editing}`, form); toast.success('Updated'); }
      else { await API.post('/loans', form); toast.success('Loan added'); }
      setShowModal(false); setEditing(null);
      setForm({ project_id: '', financier_id: '', principal: '', interest_rate: '', interest_type: 'Simple', tenure_months: '12', repayment_type: 'Monthly', start_date: '', end_date: '', notes: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    setForm({
      project_id: row.project_id, financier_id: row.financier_id, principal: row.principal,
      interest_rate: row.interest_rate, interest_type: row.interest_type || 'Simple',
      tenure_months: row.tenure_months || '12', repayment_type: row.repayment_type || 'Monthly',
      start_date: row.start_date ? row.start_date.split('T')[0] : '',
      end_date: row.end_date ? row.end_date.split('T')[0] : '', notes: row.notes || ''
    });
    setShowModal(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this loan?')) return;
    try { await API.delete(`/loans/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const filtered = data.filter(d =>
    d.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.financier_name?.toLowerCase().includes(search.toLowerCase())
  );

  // KPI totals
  const totalPrincipal = data.reduce((s, d) => s + parseFloat(d.principal || 0), 0);
  const totalOutstanding = data.reduce((s, d) => s + parseFloat(d.outstanding_principal || 0), 0);
  const totalInterestPaid = data.reduce((s, d) => s + parseFloat(d.total_interest_paid || 0), 0);
  const totalOverdue = data.reduce((s, d) => s + parseInt(d.overdue_count || 0), 0);

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Loans</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Manage project loans with EMI/interest calculations</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ project_id: '', financier_id: '', principal: '', interest_rate: '', interest_type: 'Simple', tenure_months: '12', repayment_type: 'Monthly', start_date: '', end_date: '', notes: '' }); setErrors({}); setShowModal(true); }}
          className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          + Add Loan
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Loans', value: data.length, color: '#7C3AED', icon: '🏦' },
          { label: 'Total Principal', value: formatINR(totalPrincipal), color: '#3B82F6', icon: '💰' },
          { label: 'Outstanding', value: formatINR(totalOutstanding), color: '#EF4444', icon: '📊' },
          { label: 'Interest Paid', value: formatINR(totalInterestPaid), color: '#10B981', icon: '✅' },
        ].map((c, i) => (
          <div key={i} className="card" style={{ borderLeft: `4px solid ${c.color}`, padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{c.label}</span>
              <span style={{ fontSize: '18px' }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Table */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <input type="text" placeholder="Search loans..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ width: '260px' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {totalOverdue > 0 && (
              <span style={{ backgroundColor: '#EF444422', color: '#EF4444', borderRadius: '10px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
                {totalOverdue} overdue payments
              </span>
            )}
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} records</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Project', 'Financier', 'Principal', 'Rate', 'Tenure', 'Monthly Payment', 'Outstanding', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(loan => (
                <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{loan.project_name}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{loan.financier_name}</div>
                    {loan.financier_company && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{loan.financier_company}</div>}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: '600', color: 'var(--text-primary)' }}>{formatINR(loan.principal)}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{loan.interest_rate}%</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{loan.tenure_months || '—'} mo</td>
                  {/* Monthly Payment (EMI or Interest only) */}
                  <td style={{ padding: '12px 10px' }}>
                    {loan.repayment_type === 'EMI' ? (
                      <div>
                        <div style={{ color: '#7C3AED', fontWeight: '600' }}>{formatINR(loan.emi)}/mo</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>EMI</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ color: '#F59E0B', fontWeight: '600' }}>{formatINR(loan.monthly_interest)}/mo</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Interest only</div>
                      </div>
                    )}
                  </td>
                  {/* Outstanding with progress bar */}
                  <td style={{ padding: '12px 10px', minWidth: '140px' }}>
                    <div style={{ fontWeight: '600', color: parseFloat(loan.outstanding_principal) > 0 ? '#EF4444' : '#10B981' }}>
                      {formatINR(loan.outstanding_principal)}
                    </div>
                    <div style={{ marginTop: '4px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '2px', backgroundColor: '#10B981',
                        width: `${Math.min(100, (parseFloat(loan.repaid_amount || 0) / parseFloat(loan.principal || 1)) * 100)}%`
                      }} />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {((parseFloat(loan.repaid_amount || 0) / parseFloat(loan.principal || 1)) * 100).toFixed(0)}% repaid
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={statusBadge(loan.status || 'Active')}>{loan.status || 'Active'}</span>
                    {parseInt(loan.overdue_count) > 0 && (
                      <span style={{ backgroundColor: '#EF444422', color: '#EF4444', borderRadius: '10px', padding: '2px 8px', fontSize: '11px', fontWeight: '600', marginLeft: '6px' }}>
                        {loan.overdue_count} overdue
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(loan)}
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => handleDelete(loan.id)}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No loans found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ borderRadius: '14px', padding: '28px', width: '560px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              {editing ? 'Edit Loan' : 'Add Loan'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Project *" error={errors.project_id}>
                <select value={form.project_id} onChange={e => { setForm({ ...form, project_id: e.target.value }); setErrors(p => ({ ...p, project_id: '' })); }} style={inputStyle(!!errors.project_id)}>
                  <option value="">Select</option>
                  {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                </select>
              </FormField>

              <FormField label="Financier *" error={errors.financier_id}>
                <select value={form.financier_id} onChange={e => { setForm({ ...form, financier_id: e.target.value }); setErrors(p => ({ ...p, financier_id: '' })); }} style={inputStyle(!!errors.financier_id)}>
                  <option value="">Select</option>
                  {financiers.map(f => <option key={f.financier_id} value={f.financier_id}>{f.name}</option>)}
                </select>
              </FormField>

              <FormField label="Principal Amount (₹) *" error={errors.principal}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                  <input type="text" placeholder="0.00" value={form.principal} inputMode="decimal" onChange={e => { const v = formatAmountInput(e.target.value); setForm({ ...form, principal: v }); setErrors(p => ({ ...p, principal: '' })); }} style={{ ...inputStyle(!!errors.principal), paddingLeft: '24px' }} />
                </div>
              </FormField>

              <FormField label="Interest Rate (% per annum) *" error={errors.interest_rate}>
                <div style={{ position: 'relative' }}>
                  <input type="number" placeholder="12" min="0" max="100" step="0.01" value={form.interest_rate} onChange={e => { let v = parseFloat(e.target.value); if (v > 100) v = 100; if (v < 0) v = 0; setForm({ ...form, interest_rate: isNaN(v) ? '' : v }); setErrors(p => ({ ...p, interest_rate: '' })); }} style={{ ...inputStyle(!!errors.interest_rate), paddingRight: '32px' }} />
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>%</span>
                </div>
                {form.principal && form.interest_rate && form.tenure_months && (
                  <div style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: 'var(--bg-page, #f8fafc)', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    💡 Monthly Interest: ₹{((parseFloat(form.principal) * parseFloat(form.interest_rate)) / (12 * 100)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    {form.repayment_type === 'EMI' && (() => {
                      const P = parseFloat(form.principal);
                      const r = parseFloat(form.interest_rate) / 12 / 100;
                      const n = parseInt(form.tenure_months);
                      const emi = r === 0 ? P/n : (P * r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1);
                      return <span> &nbsp;|&nbsp; EMI: ₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>;
                    })()}
                  </div>
                )}
              </FormField>

              <FormField label="Interest Type">
                <select value={form.interest_type || 'Simple'} onChange={e => setForm({ ...form, interest_type: e.target.value })} style={inputStyle(false)}>
                  {['Simple', 'Compound', 'Floating'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Tenure (months) *" error={errors.tenure_months}>
                <input type="number" placeholder="12" min="1" max="600" value={form.tenure_months} onChange={e => { let v = parseInt(e.target.value); if (v > 600) v = 600; if (v < 1) v = 1; setForm({ ...form, tenure_months: isNaN(v) ? '' : v }); setErrors(p => ({ ...p, tenure_months: '' })); }} style={inputStyle(!!errors.tenure_months)} />
              </FormField>

              <FormField label="Repayment Type">
                <select value={form.repayment_type || 'Monthly'} onChange={e => setForm({ ...form, repayment_type: e.target.value })} style={inputStyle(false)}>
                  {['Monthly', 'Quarterly', 'EMI', 'Bullet', 'Half-yearly'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Start Date" error={errors.start_date}>
                <input type="date" value={form.start_date} onChange={e => { setForm({ ...form, start_date: e.target.value }); setErrors(p => ({ ...p, start_date: '' })); }} style={inputStyle(!!errors.start_date)} />
              </FormField>

              <FormField label="Notes" style={{ gridColumn: '1 / -1' }}>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle(false), resize: 'vertical' }} />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary">
                {editing ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatedItem>
    </PageWrapper>
  );
}
