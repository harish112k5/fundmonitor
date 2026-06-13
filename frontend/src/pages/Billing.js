import { SkeletonTable } from '../components/SkeletonCard';
import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';

const formatINR = (n) => n != null ? `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';

const STAGES = [
  { value: 'BILLABLE',         label: 'Billable: Work completed, eligible to raise bill',  badge: 'Billable',  bg: '#92400e', color: '#fbbf24' },
  { value: 'SUBMITTED',        label: 'Submitted: RA Bill sent to client/government',      badge: 'Submitted', bg: '#1e3a5f', color: '#60a5fa' },
  { value: 'CERTIFIED',        label: 'Certified: Bill approved by government engineer',   badge: 'Certified', bg: '#14532d', color: '#4ade80' },
  { value: 'PARTIALLY_PAID',   label: 'Partially Paid: Part of certified amount received', badge: 'Part Paid', bg: '#7c2d12', color: '#fb923c' },
  { value: 'PAYMENT_RECEIVED', label: 'Payment Received: Full amount credited to account', badge: 'Received',  bg: '#134e4a', color: '#2dd4bf' },
];

const getStageStyle = (stage) => STAGES.find(s => s.value === stage) || STAGES[0];

const initialForm = {
  project_id: '', invoice_number: '', billing_date: '', due_date: '',
  mb_reference: '', billing_stage: 'BILLABLE',
  billable_amount: '', submitted_amount: '', certified_amount: '',
  certified_date: '', payment_received: '', payment_date: '',
  rejection_amount: '', rejection_reason: '', notes: ''
};

export default function Billing() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [stageFilter, setStageFilter] = useState('ALL');

  const load = () => {
    Promise.all([API.get('/billing'), API.get('/projects')])
      .then(([d, p]) => {
        const billingData = d.data?.data || d.data || [];
        setData(billingData);
        setProjects(p.data?.data || p.data || []);
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    const ba = parseFloat(form.billable_amount) || 0;
    const sa = parseFloat(form.submitted_amount) || 0;
    const ca = parseFloat(form.certified_amount) || 0;
    const pr = parseFloat(form.payment_received) || 0;
    const stage = form.billing_stage;

    if (ba <= 0) errs.billable_amount = 'Billable amount must be greater than 0';
    if (['SUBMITTED','CERTIFIED','PARTIALLY_PAID','PAYMENT_RECEIVED'].includes(stage) && sa <= 0)
      errs.submitted_amount = 'Submitted amount is required for this stage';
    if (['CERTIFIED','PARTIALLY_PAID','PAYMENT_RECEIVED'].includes(stage) && ca <= 0)
      errs.certified_amount = 'Certified amount is required for this stage';
    if (sa > ba) errs.submitted_amount = 'Cannot exceed billable amount';
    if (ca > sa && sa > 0) errs.certified_amount = 'Cannot exceed submitted amount';
    if (pr > ca && ca > 0) errs.payment_received = 'Cannot exceed certified amount';
    if (!form.project_id) errs.project_id = 'Project is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const payload = {
        ...form,
        billable_amount: parseFloat(form.billable_amount) || 0,
        submitted_amount: parseFloat(form.submitted_amount) || 0,
        certified_amount: parseFloat(form.certified_amount) || 0,
        payment_received: parseFloat(form.payment_received) || 0,
        rejection_amount: parseFloat(form.rejection_amount) || 0,
        amount: parseFloat(form.billable_amount) || 0,
      };
      if (editing) {
        await API.put(`/billing/${editing.billing_id}`, payload);
        toast.success('Billing record updated');
      } else {
        await API.post('/billing', payload);
        toast.success('Billing record created');
      }
      setShowModal(false); setEditing(null); setForm(initialForm); setErrors({}); load();
    } catch (err) { toast.error(err.response?.data?.message || err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id,
      invoice_number: row.invoice_number || '',
      billing_date: row.billing_date ? row.billing_date.split('T')[0] : '',
      due_date: row.due_date ? row.due_date.split('T')[0] : '',
      mb_reference: row.mb_reference || '',
      billing_stage: row.billing_stage || 'BILLABLE',
      billable_amount: row.billable_amount || '',
      submitted_amount: row.submitted_amount || '',
      certified_amount: row.certified_amount || '',
      certified_date: row.certified_date ? row.certified_date.split('T')[0] : '',
      payment_received: row.payment_received || '',
      payment_date: row.payment_date ? row.payment_date.split('T')[0] : '',
      rejection_amount: row.rejection_amount || '',
      rejection_reason: row.rejection_reason || '',
      notes: row.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/billing/${deleteTarget.billing_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  // Computed summary
  const summary = data.reduce((acc, r) => ({
    billable:  acc.billable  + parseFloat(r.billable_amount  || 0),
    submitted: acc.submitted + parseFloat(r.submitted_amount || 0),
    certified: acc.certified + parseFloat(r.certified_amount || 0),
    received:  acc.received  + parseFloat(r.payment_received || 0),
  }), { billable: 0, submitted: 0, certified: 0, received: 0 });
  summary.pending = summary.certified - summary.received;

  const filtered = stageFilter === 'ALL' ? data : data.filter(r => r.billing_stage === stageFilter);

  // Live form calculations
  const pendingApproval = (parseFloat(form.submitted_amount) || 0) - (parseFloat(form.certified_amount) || 0);
  const pendingPayment  = (parseFloat(form.certified_amount) || 0) - (parseFloat(form.payment_received) || 0);
  const totalOutstanding = (parseFloat(form.billable_amount) || 0) - (parseFloat(form.payment_received) || 0);

  const showRejection = ['CERTIFIED','PARTIALLY_PAID','PAYMENT_RECEIVED'].includes(form.billing_stage);

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  const inputStyle = { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '8px 10px', fontSize: 13, width: '100%', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'block' };
  const errorStyle = { color: '#f87171', fontSize: 11, marginTop: 2 };

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Billable',    value: summary.billable,  color: '#fbbf24', sub: 'Work completed on site' },
          { label: 'Total Submitted',   value: summary.submitted, color: '#60a5fa', sub: 'RA Bills raised' },
          { label: 'Total Certified',   value: summary.certified, color: '#4ade80', sub: 'Government approved' },
          { label: 'Total Received',    value: summary.received,  color: '#2dd4bf', sub: 'Money credited' },
          { label: 'Pending Payment',   value: summary.pending,   color: summary.pending > 0 ? '#f87171' : '#4ade80', sub: 'Certified but not paid' },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, padding: '16px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{formatINR(c.value)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Stage Filter Buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[{ value: 'ALL', label: 'All' }, ...STAGES.map(s => ({ value: s.value, label: s.badge }))].map(f => (
          <button key={f.value} onClick={() => setStageFilter(f.value)}
            style={{
              padding: '5px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: stageFilter === f.value ? '1px solid var(--text-accent)' : '1px solid var(--border-subtle)',
              background: stageFilter === f.value ? 'var(--accent-glow)' : 'var(--bg-secondary)',
              color: stageFilter === f.value ? 'var(--text-accent)' : 'var(--text-muted)',
              transition: 'all 0.15s'
            }}
          >{f.label} {f.value === 'ALL' ? `(${data.length})` : `(${data.filter(r => r.billing_stage === f.value).length})`}</button>
        ))}
      </div>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 20 }}>Billing</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>Manage invoices • {filtered.length} records</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(initialForm); setErrors({}); setShowModal(true); }}
          style={{ backgroundColor: 'var(--text-accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          + Add Invoice
        </button>
      </div>

      {/* Billing Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Invoice','MB Ref','Billable','Submitted','Certified','Received','Pending','Stage','Date','Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Actions' ? 'center' : 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🧾</div>No billing records found
                </td></tr>
              ) : filtered.map(r => {
                const stg = getStageStyle(r.billing_stage);
                const pending = (parseFloat(r.certified_amount) || 0) - (parseFloat(r.payment_received) || 0);
                return (
                  <tr key={r.billing_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{r.invoice_number || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.project_name}</div>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{r.mb_reference || '—'}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{formatINR(r.billable_amount)}</td>
                    <td style={{ padding: '10px 12px' }}>{formatINR(r.submitted_amount)}</td>
                    <td style={{ padding: '10px 12px', color: '#4ade80' }}>{formatINR(r.certified_amount)}</td>
                    <td style={{ padding: '10px 12px', color: '#2dd4bf' }}>{formatINR(r.payment_received)}</td>
                    <td style={{ padding: '10px 12px', color: pending > 0 ? '#f87171' : '#4ade80', fontWeight: 600 }}>{formatINR(pending)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: stg.bg, color: stg.color, padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>{stg.badge}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>
                      {r.billing_date ? new Date(r.billing_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(r)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>Edit</button>
                        <button onClick={() => { setDeleteTarget(r); setShowDelete(true); }} style={{ background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#f87171', fontSize: 12 }}>Del</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Billing Form Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setErrors({}); }}
        title={editing ? 'Edit Billing Record' : 'New Billing Record'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => { setShowModal(false); setErrors({}); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={Object.keys(errors).length > 0}>{editing ? 'Update' : 'Create'}</button>
        </>}>

        {/* Group 1: Project + Invoice */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange} style={inputStyle}>
              <option value="">Select Project</option>
              {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
            {errors.project_id && <div style={errorStyle}>{errors.project_id}</div>}
          </div>
          <div className="form-group">
            <label style={labelStyle}>Invoice Number</label>
            <input style={inputStyle} name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="INV-001" />
          </div>
        </div>

        {/* Group 2: Dates */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Invoice Date</label>
            <input style={inputStyle} type="date" name="billing_date" value={form.billing_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label style={labelStyle}>Due Date</label>
            <input style={inputStyle} type="date" name="due_date" value={form.due_date} onChange={handleChange} />
          </div>
        </div>

        {/* Group 3: MB Ref + Stage */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Measurement Book Reference</label>
            <input style={inputStyle} name="mb_reference" value={form.mb_reference} onChange={handleChange} placeholder="MB-2026/001" />
          </div>
          <div className="form-group">
            <label style={labelStyle}>Billing Stage *</label>
            <select className="form-select" name="billing_stage" value={form.billing_stage} onChange={handleChange} style={inputStyle}>
              {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Group 4: Amounts */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Billable Amount (Work Completed on Site) *</label>
            <input style={inputStyle} type="number" name="billable_amount" value={form.billable_amount} onChange={handleChange} placeholder="0" />
            {errors.billable_amount && <div style={errorStyle}>{errors.billable_amount}</div>}
          </div>
          <div className="form-group">
            <label style={labelStyle}>Submitted Bill Amount (RA Bill Amount)</label>
            <input style={inputStyle} type="number" name="submitted_amount" value={form.submitted_amount} onChange={handleChange} placeholder="0" />
            {errors.submitted_amount && <div style={errorStyle}>{errors.submitted_amount}</div>}
          </div>
        </div>

        {/* Group 5: Certified */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Certified Amount (Govt Approved)</label>
            <input style={inputStyle} type="number" name="certified_amount" value={form.certified_amount} onChange={handleChange} placeholder="0" />
            {errors.certified_amount && <div style={errorStyle}>{errors.certified_amount}</div>}
          </div>
          <div className="form-group">
            <label style={labelStyle}>Certified Date</label>
            <input style={inputStyle} type="date" name="certified_date" value={form.certified_date} onChange={handleChange} />
          </div>
        </div>

        {/* Group 6: Payment */}
        <div className="form-row">
          <div className="form-group">
            <label style={labelStyle}>Payment Received</label>
            <input style={inputStyle} type="number" name="payment_received" value={form.payment_received} onChange={handleChange} placeholder="0" />
            {errors.payment_received && <div style={errorStyle}>{errors.payment_received}</div>}
          </div>
          <div className="form-group">
            <label style={labelStyle}>Payment Date</label>
            <input style={inputStyle} type="date" name="payment_date" value={form.payment_date} onChange={handleChange} />
          </div>
        </div>

        {/* Live Calculations */}
        <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 12, margin: '8px 0', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending Approval</span>
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13 }}>{formatINR(pendingApproval)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pending Payment</span>
            <span style={{ color: pendingPayment > 0 ? '#f87171' : '#4ade80', fontWeight: 600, fontSize: 13 }}>{formatINR(pendingPayment)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Total Outstanding</span>
            <span style={{ color: '#fb923c', fontWeight: 600, fontSize: 13 }}>{formatINR(totalOutstanding)}</span>
          </div>
        </div>

        {/* Group 7: Rejection */}
        {showRejection && (
          <div className="form-row">
            <div className="form-group">
              <label style={labelStyle}>Rejection Amount</label>
              <input style={inputStyle} type="number" name="rejection_amount" value={form.rejection_amount} onChange={handleChange} placeholder="0" />
            </div>
            <div className="form-group">
              <label style={labelStyle}>Rejection Reason</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} name="rejection_reason" value={form.rejection_reason} onChange={handleChange} placeholder="Reason for deduction..." />
            </div>
          </div>
        )}

        {/* Group 8: Notes */}
        <div className="form-group" style={{ marginTop: 8 }}>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes..." />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={`Invoice ${deleteTarget?.invoice_number}`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>

      </AnimatedItem>
    </PageWrapper>
  );
}
