import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/finance';
import {
  validateFinancierForm,
  formatPhoneInput
} from '../utils/validators';
import { FormField, inputStyle } from '../components/FormField';

export default function Financiers() {
  const [financiers, setFinanciers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', company: '', phone: '', email: '', type: 'Bank', address: '', notes: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchFinanciers(); }, []);

  const fetchFinanciers = async () => {
    setLoading(true);
    try { const res = await API.get('/financiers'); setFinanciers(res.data); }
    catch { toast.error('Failed to load financiers'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validateFinancierForm(form);
    if (!valid) { setErrors(errs); return; }
    setErrors({});
    try {
      if (editing) { await API.put(`/financiers/${editing}`, form); toast.success('Updated'); }
      else { await API.post('/financiers', form); toast.success('Financier added'); }
      setShowModal(false); setEditing(null);
      setForm({ name: '', company: '', phone: '', email: '', type: 'Bank', address: '', notes: '' });
      fetchFinanciers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (fin) => {
    setForm({ name: fin.name, company: fin.company || '', phone: fin.phone || '', email: fin.email || '', type: fin.type || 'Bank', address: fin.address || '', notes: fin.notes || '' });
    setEditing(fin.financier_id); setShowModal(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this financier?')) return;
    try { await API.delete(`/financiers/${id}`); toast.success('Deleted'); fetchFinanciers(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = financiers.filter(f => f.name?.toLowerCase().includes(search.toLowerCase()) || f.company?.toLowerCase().includes(search.toLowerCase()));

  // KPI totals
  const totalFunded = financiers.reduce((s, f) => s + parseFloat(f.total_funded || 0), 0);
  const totalOutstanding = financiers.reduce((s, f) => s + parseFloat(f.outstanding || 0), 0);
  const closedLoans = financiers.reduce((s, f) => s + parseInt(f.closed_loans || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Financiers</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Manage lender profiles and track funding status</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', company: '', phone: '', email: '', type: 'Bank', address: '', notes: '' }); setErrors({}); setShowModal(true); }}
          className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          + Add Financier
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Financiers', value: financiers.length, color: '#7C3AED', icon: '🏦' },
          { label: 'Total Funded', value: formatINR(totalFunded), color: '#10B981', icon: '💰' },
          { label: 'Outstanding', value: formatINR(totalOutstanding), color: '#EF4444', icon: '📊' },
          { label: 'Closed Loans', value: closedLoans, color: '#64748B', icon: '✅' },
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
          <input type="text" placeholder="Search financiers..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ width: '260px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Name', 'Company', 'Type', 'Contact', 'Projects', 'Total Funded', 'Outstanding', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(fin => (
                <tr key={fin.financier_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{fin.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fin.email || ''}</div>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{fin.company || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{fin.type || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{fin.phone || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', textAlign: 'center' }}>{fin.project_count}</td>
                  <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{formatINR(fin.total_funded)}</td>
                  <td style={{ padding: '12px 10px', color: parseFloat(fin.outstanding) > 0 ? '#EF4444' : '#64748B', fontWeight: '600' }}>{formatINR(fin.outstanding)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(fin)}
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => handleDelete(fin.financier_id)}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No financiers found</td></tr>
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
              {editing ? 'Edit Financier' : 'Add Financier'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Name *" error={errors.name} style={{ gridColumn: '1 / -1' }}>
                <input type="text" placeholder="Bank / Person name" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }} style={inputStyle(!!errors.name)} />
              </FormField>

              <FormField label="Company / Institution">
                <input type="text" placeholder="e.g. HDFC Bank, SBI" value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} style={inputStyle(false)} />
              </FormField>

              <FormField label="Phone" error={errors.phone}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>+91</span>
                  <input type="tel" placeholder="98XXXXXXXX" maxLength={10} value={form.phone} onChange={e => { const v = formatPhoneInput(e.target.value); setForm({ ...form, phone: v }); setErrors(p => ({ ...p, phone: '' })); }} style={{ ...inputStyle(!!errors.phone), paddingLeft: '38px' }} />
                </div>
              </FormField>

              <FormField label="Email" error={errors.email}>
                <input type="email" placeholder="name@example.com" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(p => ({ ...p, email: '' })); }} style={inputStyle(!!errors.email)} />
              </FormField>

              <FormField label="Financier Type">
                <select value={form.type || 'Bank'} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle(false)}>
                  {['Bank', 'NBFC', 'Private Lender', 'Microfinance', 'Government', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Address" style={{ gridColumn: '1 / -1' }}>
                <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} style={{ ...inputStyle(false), resize: 'vertical' }} />
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
