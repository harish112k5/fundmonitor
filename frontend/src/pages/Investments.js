import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { formatINR, statusBadge } from '../utils/finance';
import {
  validateInvestmentForm,
  formatAmountInput
} from '../utils/validators';
import { FormField, inputStyle } from '../components/FormField';

export default function Investments() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ project_id: '', investor_id: '', amount: '', investment_date: '', return_type: 'Fixed', expected_return: '', lock_in_months: '', notes: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, p, i] = await Promise.all([API.get('/investments'), API.get('/projects'), API.get('/investors')]);
      setData(d.data); setProjects(p.data); setInvestors(i.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validateInvestmentForm(form);
    if (!valid) { setErrors(errs); return; }
    setErrors({});
    try {
      if (editing) { await API.put(`/investments/${editing}`, form); toast.success('Updated'); }
      else { await API.post('/investments', form); toast.success('Investment recorded'); }
      setShowModal(false); setEditing(null);
      setForm({ project_id: '', investor_id: '', amount: '', investment_date: '', return_type: 'Fixed', expected_return: '', lock_in_months: '', notes: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    setForm({
      project_id: row.project_id, investor_id: row.investor_id, amount: row.amount,
      investment_date: row.investment_date ? row.investment_date.split('T')[0] : '',
      return_type: row.return_type || 'Fixed', expected_return: row.expected_return || '',
      lock_in_months: row.lock_in_months || '', notes: row.notes || ''
    });
    setShowModal(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investment?')) return;
    try { await API.delete(`/investments/${id}`); toast.success('Deleted'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const filtered = data.filter(d => 
    d.project_name?.toLowerCase().includes(search.toLowerCase()) || 
    d.investor_name?.toLowerCase().includes(search.toLowerCase())
  );

  // KPI totals
  const totalAmount = data.reduce((s, d) => s + parseFloat(d.amount || 0), 0);
  const totalRepaid = data.reduce((s, d) => s + parseFloat(d.repaid_amount || 0), 0);
  const totalPending = data.reduce((s, d) => s + parseFloat(d.pending_amount || 0), 0);

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Investments</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Track project investments and returns</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ project_id: '', investor_id: '', amount: '', investment_date: '', return_type: 'Fixed', expected_return: '', lock_in_months: '', notes: '' }); setErrors({}); setShowModal(true); }}
          className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          + Add Investment
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Investments', value: data.length, color: '#7C3AED', icon: '📈' },
          { label: 'Total Amount', value: formatINR(totalAmount), color: '#10B981', icon: '💰' },
          { label: 'Total Repaid', value: formatINR(totalRepaid), color: '#3B82F6', icon: '✅' },
          { label: 'Pending Returns', value: formatINR(totalPending), color: '#F59E0B', icon: '⏳' },
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
          <input type="text" placeholder="Search investments..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ width: '260px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Project', 'Investor', 'Amount', 'Repaid', 'Pending', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inv.project_name}</div>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <div>{inv.investor_name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.investor_type}</div>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{formatINR(inv.amount)}</td>
                  <td style={{ padding: '12px 10px', color: '#3B82F6', fontWeight: '600' }}>{formatINR(inv.repaid_amount)}</td>
                  <td style={{ padding: '12px 10px', color: '#F59E0B', fontWeight: '600' }}>{formatINR(inv.pending_amount)}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {inv.investment_date ? new Date(inv.investment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={statusBadge(inv.derived_status || inv.status)}>{inv.derived_status || inv.status || 'Active'}</span>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(inv)}
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => handleDelete(inv.id)}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No investments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ borderRadius: '14px', padding: '28px', width: '500px', maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              {editing ? 'Edit Investment' : 'Add Investment'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Project *" error={errors.project_id}>
                <select value={form.project_id} onChange={e => { setForm({ ...form, project_id: e.target.value }); setErrors(p => ({ ...p, project_id: '' })); }} style={inputStyle(!!errors.project_id)}>
                  <option value="">Select</option>
                  {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                </select>
              </FormField>

              <FormField label="Investor *" error={errors.investor_id}>
                <select value={form.investor_id} onChange={e => { setForm({ ...form, investor_id: e.target.value }); setErrors(p => ({ ...p, investor_id: '' })); }} style={inputStyle(!!errors.investor_id)}>
                  <option value="">Select</option>
                  {investors.map(i => <option key={i.investor_id} value={i.investor_id}>{i.name}</option>)}
                </select>
              </FormField>

              <FormField label="Investment Amount (₹) *" error={errors.amount}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                  <input type="text" placeholder="0.00" value={form.amount} inputMode="decimal" onChange={e => { const v = formatAmountInput(e.target.value); setForm({ ...form, amount: v }); setErrors(p => ({ ...p, amount: '' })); }} style={{ ...inputStyle(!!errors.amount), paddingLeft: '24px' }} />
                </div>
              </FormField>

              <FormField label="Date" error={errors.investment_date}>
                <input type="date" value={form.investment_date} onChange={e => { setForm({ ...form, investment_date: e.target.value }); setErrors(p => ({ ...p, investment_date: '' })); }} style={inputStyle(!!errors.investment_date)} />
              </FormField>

              <FormField label="Return Type">
                <select value={form.return_type || 'Fixed'} onChange={e => setForm({ ...form, return_type: e.target.value })} style={inputStyle(false)}>
                  {['Fixed', 'Percentage', 'Profit Share'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Expected Return (₹)" error={errors.expected_return}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>₹</span>
                  <input type="text" placeholder="0.00" value={form.expected_return || ''} inputMode="decimal" onChange={e => { const v = formatAmountInput(e.target.value); setForm({ ...form, expected_return: v }); setErrors(p => ({ ...p, expected_return: '' })); }} style={{ ...inputStyle(!!errors.expected_return), paddingLeft: '24px' }} />
                </div>
              </FormField>

              <FormField label="Lock-in Period (months)">
                <input type="number" min="0" max="120" placeholder="0" value={form.lock_in_months || ''} onChange={e => { const v = Math.max(0, Math.min(120, parseInt(e.target.value) || 0)); setForm({ ...form, lock_in_months: isNaN(v) ? '' : v }); }} style={inputStyle(false)} />
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
