import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatINR, statusBadge } from '../utils/finance';
import {
  validateInterestPaymentForm,
  formatAmountInput
} from '../utils/validators';
import { FormField, inputStyle } from '../components/FormField';

export default function InterestPayments() {
  const [data, setData] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ loan_id: '', amount: '', due_date: '', notes: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, l] = await Promise.all([API.get('/interest-payments'), API.get('/loans')]);
      setData(d.data); setLoans(l.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validateInterestPaymentForm(form);
    if (!valid) { setErrors(errs); return; }
    setErrors({});
    try {
      await API.post('/interest-payments', form);
      toast.success('Interest payment recorded');
      setShowModal(false);
      setForm({ loan_id: '', amount: '', due_date: '', notes: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const markPaid = async (id) => {
    try {
      await API.patch(`/interest-payments/${id}/pay`);
      toast.success('Marked as paid');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try { await API.delete(`/interest-payments/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const filtered = data.filter(d =>
    d.project_name?.toLowerCase().includes(search.toLowerCase()) ||
    d.financier_name?.toLowerCase().includes(search.toLowerCase())
  );

  // KPI totals
  const totalAmount = data.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const paidCount = data.filter(d => d.status === 'Paid').length;
  const overdueCount = data.filter(d => d.status === 'Overdue').length;
  const pendingCount = data.filter(d => d.status === 'Pending').length;
  const totalPenalty = data.reduce((s, d) => s + parseFloat(d.penalty || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Interest Payments</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Monthly interest log with overdue detection</p>
        </div>
        <button onClick={() => { setForm({ loan_id: '', amount: '', due_date: '', notes: '' }); setErrors({}); setShowModal(true); }}
          className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          + Add Payment
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Amount', value: formatINR(totalAmount), color: '#7C3AED', icon: '💵' },
          { label: 'Paid', value: paidCount, color: '#10B981', icon: '✅' },
          { label: 'Pending', value: pendingCount, color: '#F59E0B', icon: '⏳' },
          { label: 'Overdue', value: overdueCount, color: '#EF4444', icon: '🚨' },
          { label: 'Total Penalty', value: formatINR(totalPenalty), color: '#EF4444', icon: '⚠️' },
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
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ width: '260px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Project', 'Financier', 'Amount', 'Due Date', 'Status', 'Paid Date', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ip => (
                <tr key={ip.id} style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: ip.status === 'Overdue' ? 'rgba(239,68,68,0.04)' : 'transparent',
                  transition: 'background 0.15s'
                }}
                  onMouseEnter={e => { if (ip.status !== 'Overdue') e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.03))'; }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ip.status === 'Overdue' ? 'rgba(239,68,68,0.04)' : 'transparent'}>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{ip.project_name}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{ip.financier_name}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{formatINR(ip.amount)}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {ip.due_date ? new Date(ip.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={statusBadge(ip.status)}>{ip.status}</span>
                    {ip.status === 'Overdue' && (
                      <div style={{ color: '#EF4444', fontSize: '11px', marginTop: '2px' }}>
                        {ip.delay_days}d late · Penalty: {formatINR(ip.penalty)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', color: ip.paid_date ? '#10B981' : 'var(--text-muted)', fontSize: '13px' }}>
                    {ip.paid_date ? new Date(ip.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {ip.status !== 'Paid' && (
                        <button onClick={() => markPaid(ip.id)}
                          style={{ backgroundColor: '#10B98122', color: '#10B981', border: '1px solid #10B98144', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                          ✓ Mark Paid
                        </button>
                      )}
                      <button onClick={() => handleDelete(ip.id)}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No interest payments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ borderRadius: '14px', padding: '28px', width: '480px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              Record Interest Payment
            </h2>

            <div style={{ display: 'grid', gap: '16px' }}>
              <FormField label="Loan *" error={errors.loan_id}>
                <select value={form.loan_id} onChange={e => { setForm({ ...form, loan_id: e.target.value }); setErrors(p => ({ ...p, loan_id: '' })); }} style={inputStyle(!!errors.loan_id)}>
                  <option value="">Select loan</option>
                  {loans.map(l => <option key={l.id} value={l.id}>#{l.id} — {l.project_name} ({formatINR(l.principal)})</option>)}
                </select>
              </FormField>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <FormField label="Interest Amount (₹) *" error={errors.amount}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                    <input type="text" placeholder="0.00" value={form.amount} inputMode="decimal" onChange={e => { const v = formatAmountInput(e.target.value); setForm({ ...form, amount: v }); setErrors(p => ({ ...p, amount: '' })); }} style={{ ...inputStyle(!!errors.amount), paddingLeft: '24px' }} />
                  </div>
                </FormField>

                <FormField label="Due Date *" error={errors.due_date}>
                  <input type="date" value={form.due_date} onChange={e => { setForm({ ...form, due_date: e.target.value }); setErrors(p => ({ ...p, due_date: '' })); }} style={inputStyle(!!errors.due_date)} />
                  {form.due_date && new Date(form.due_date) < new Date() && (
                    <div style={{ marginTop: '4px', color: '#F59E0B', fontSize: '12px' }}>⚠ Due date is in the past — will be marked Overdue</div>
                  )}
                </FormField>
              </div>

              <FormField label="Notes">
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle(false), resize: 'vertical' }} />
              </FormField>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSubmit} className="btn btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
