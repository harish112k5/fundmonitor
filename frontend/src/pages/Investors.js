import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatINR } from '../utils/finance';
import {
  validateInvestorForm,
  formatPhoneInput,
  formatPANInput,
  formatGSTInput
} from '../utils/validators';
import { FormField, inputStyle } from '../components/FormField';

export default function Investors() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', pan: '', gst: '', type: 'Individual', address: '', notes: '' });
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchInvestors(); }, []);

  const fetchInvestors = async () => {
    setLoading(true);
    try { const res = await API.get('/investors'); setInvestors(res.data); }
    catch { toast.error('Failed to load investors'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    const { valid, errors: errs } = validateInvestorForm(form);
    if (!valid) { setErrors(errs); return; }
    setErrors({});
    try {
      if (editing) { await API.put(`/investors/${editing}`, form); toast.success('Updated'); }
      else { await API.post('/investors', form); toast.success('Investor added'); }
      setShowModal(false); setEditing(null);
      setForm({ name: '', phone: '', email: '', pan: '', gst: '', type: 'Individual', address: '', notes: '' });
      fetchInvestors();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (inv) => {
    setForm({ name: inv.name, phone: inv.phone || '', email: inv.email || '', pan: inv.pan || '', gst: inv.gst || '', type: inv.type || 'Individual', address: inv.address || '', notes: inv.notes || '' });
    setEditing(inv.investor_id); setShowModal(true);
    setErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this investor?')) return;
    try { await API.delete(`/investors/${id}`); toast.success('Deleted'); fetchInvestors(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = investors.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()) || i.email?.toLowerCase().includes(search.toLowerCase()));

  // KPI totals
  const totalInvested = investors.reduce((s, i) => s + parseFloat(i.total_invested || 0), 0);
  const totalRepaid = investors.reduce((s, i) => s + parseFloat(i.total_repaid || 0), 0);
  const totalPending = investors.reduce((s, i) => s + parseFloat(i.pending_return || 0), 0);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Investors</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Manage investor profiles and track returns</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ name: '', phone: '', email: '', pan: '', gst: '', type: 'Individual', address: '', notes: '' }); setErrors({}); setShowModal(true); }}
          className="btn btn-primary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          + Add Investor
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Investors', value: investors.length, color: '#7C3AED', icon: '👥' },
          { label: 'Total Invested', value: formatINR(totalInvested), color: '#10B981', icon: '💰' },
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
          <input type="text" placeholder="Search investors..." value={search} onChange={e => setSearch(e.target.value)}
            className="form-input" style={{ width: '260px' }} />
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{filtered.length} records</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Name', 'Type', 'Contact', 'PAN', 'Projects', 'Total Invested', 'Repaid', 'Pending', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.investor_id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover, rgba(255,255,255,0.03))'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inv.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inv.email}</div>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{inv.type || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{inv.phone || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'monospace' }}>{inv.pan || '—'}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', textAlign: 'center' }}>{inv.project_count}</td>
                  <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{formatINR(inv.total_invested)}</td>
                  <td style={{ padding: '12px 10px', color: '#3B82F6', fontWeight: '600' }}>{formatINR(inv.total_repaid)}</td>
                  <td style={{ padding: '12px 10px', color: '#F59E0B', fontWeight: '600' }}>{formatINR(inv.pending_return)}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(inv)}
                        style={{ backgroundColor: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>✏️</button>
                      <button onClick={() => handleDelete(inv.investor_id)}
                        style={{ backgroundColor: 'transparent', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', borderRadius: '6px', padding: '5px 10px', cursor: 'pointer', fontSize: '13px' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No investors found</td></tr>
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
              {editing ? 'Edit Investor' : 'Add Investor'}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <FormField label="Full Name *" error={errors.name} style={{ gridColumn: '1 / -1' }}>
                <input type="text" placeholder="e.g. Rajesh Kumar" value={form.name} onChange={e => { setForm({ ...form, name: e.target.value }); setErrors(p => ({ ...p, name: '' })); }} style={inputStyle(!!errors.name)} />
              </FormField>

              <FormField label="Phone Number" error={errors.phone}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px' }}>+91</span>
                  <input type="tel" placeholder="98XXXXXXXX" maxLength={10} value={form.phone} onChange={e => { const v = formatPhoneInput(e.target.value); setForm({ ...form, phone: v }); setErrors(p => ({ ...p, phone: '' })); }} style={{ ...inputStyle(!!errors.phone), paddingLeft: '38px' }} />
                </div>
              </FormField>

              <FormField label="Email" error={errors.email}>
                <input type="email" placeholder="name@example.com" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(p => ({ ...p, email: '' })); }} style={inputStyle(!!errors.email)} />
              </FormField>

              <FormField label="PAN Number" error={errors.pan}>
                <input type="text" placeholder="ABCDE1234F" maxLength={10} value={form.pan} onChange={e => { const v = formatPANInput(e.target.value); setForm({ ...form, pan: v }); setErrors(p => ({ ...p, pan: v.length === 10 && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v) ? 'PAN format: ABCDE1234F' : '' })); }} style={{ ...inputStyle(!!errors.pan), fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase' }} />
                {form.pan?.length === 10 && !errors.pan && (
                  <div style={{ marginTop: '4px', color: '#10B981', fontSize: '12px' }}>✓ Valid PAN</div>
                )}
              </FormField>

              <FormField label="GST Number" error={errors.gst}>
                <input type="text" placeholder="22ABCDE1234F1Z5" maxLength={15} value={form.gst || ''} onChange={e => { const v = formatGSTInput(e.target.value); setForm({ ...form, gst: v }); setErrors(p => ({ ...p, gst: '' })); }} style={{ ...inputStyle(!!errors.gst), fontFamily: 'monospace', letterSpacing: '1px' }} />
              </FormField>

              <FormField label="Investor Type">
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle(false)}>
                  {['Individual', 'Company', 'Partnership', 'Trust', 'HUF'].map(t => <option key={t}>{t}</option>)}
                </select>
              </FormField>

              <FormField label="Address" style={{ gridColumn: '1 / -1' }}>
                <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} placeholder="Full address..." style={{ ...inputStyle(false), resize: 'vertical' }} />
              </FormField>

              <FormField label="Notes" style={{ gridColumn: '1 / -1' }}>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional notes..." style={{ ...inputStyle(false), resize: 'vertical' }} />
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
    </div>
  );
}
