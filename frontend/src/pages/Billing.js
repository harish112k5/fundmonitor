import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { project_id: '', invoice_number: '', amount: '', status: 'draft', billing_date: '', due_date: '', created_by: '' };

export default function Billing() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/billing'), API.get('/projects')])
      .then(([d, p]) => { setData(d.data); setProjects(p.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/billing/${editing.billing_id}`, form); toast.success('Updated'); }
      else { await API.post('/billing', form); toast.success('Invoice created'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, invoice_number: row.invoice_number, amount: row.amount,
      status: row.status, billing_date: row.billing_date ? row.billing_date.split('T')[0] : '',
      due_date: row.due_date ? row.due_date.split('T')[0] : '', created_by: row.created_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/billing/${deleteTarget.billing_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'billing_id', style: { width: 60 } },
    { header: 'Invoice #', accessor: 'invoice_number', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{r.invoice_number}</span> },
    { header: 'Project', accessor: 'project_name' },
    { header: 'Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600 }}>{fmt(r.amount)}</span> },
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status}`}>{r.status}</span> },
    { header: 'Bill Date', accessor: 'billing_date' },
    { header: 'Due Date', accessor: 'due_date', render: r => r.due_date || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'nowrap'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#F1F5F9' }}>Billing</h1>
          <p style={{ margin: 0, color: '#94A3B8' }}>Manage invoices</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm(initialForm);
            setShowModal(true);
          }}
          style={{
            backgroundColor: '#7C3AED',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
        >
          + Add Invoice
        </button>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search invoices..." emptyIcon="🧾" emptyTitle="No invoices" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Invoice' : 'New Invoice'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Invoice Number *</label>
            <input className="form-input" name="invoice_number" value={form.invoice_number} onChange={handleChange} placeholder="INV-001" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="draft">Draft</option><option value="sent">Sent</option>
              <option value="paid">Paid</option><option value="overdue">Overdue</option>
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Billing Date *</label>
            <input className="form-input" type="date" name="billing_date" value={form.billing_date} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Due Date</label>
            <input className="form-input" type="date" name="due_date" value={form.due_date} onChange={handleChange} /></div>
        </div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={`Invoice ${deleteTarget?.invoice_number}`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
