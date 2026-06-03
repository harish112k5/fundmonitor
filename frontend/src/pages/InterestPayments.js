import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { loan_id: '', payment_date: '', amount: '', status: 'pending', created_by: '' };

export default function InterestPayments() {
  const [data, setData] = useState([]);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/interest-payments'), API.get('/loans'), API.get('/users')])
      .then(([d, l, u]) => { setData(d.data); setLoans(l.data); setUsers(u.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/interest-payments/${editing.id}`, form); toast.success('Updated'); }
      else { await API.post('/interest-payments', form); toast.success('Payment recorded'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      loan_id: row.loan_id, payment_date: row.payment_date ? row.payment_date.split('T')[0] : '',
      amount: row.amount, status: row.status, created_by: row.created_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/interest-payments/${deleteTarget.id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Financier', accessor: 'financier_name' },
    { header: 'Loan Principal', accessor: 'principal', render: r => fmt(r.principal) },
    { header: 'Payment Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600 }}>{fmt(r.amount)}</span> },
    { header: 'Date', accessor: 'payment_date' },
    { header: 'Status', accessor: 'status', render: r => <span className={`badge badge-${r.status}`}>{r.status}</span> },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Interest Payments</h1><p>Track loan interest payments</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search..." emptyIcon="💵" emptyTitle="No interest payments" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Payment' : 'Record Payment'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-group"><label className="form-label">Loan *</label>
          <select className="form-select" name="loan_id" value={form.loan_id} onChange={handleChange}>
            <option value="">Select loan</option>
            {loans.map(l => <option key={l.id} value={l.id}>Loan #{l.id} — {l.project_name} ({fmt(l.principal)})</option>)}
          </select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Payment Date *</label>
            <input className="form-input" type="date" name="payment_date" value={form.payment_date} onChange={handleChange} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="pending">Pending</option><option value="paid">Paid</option>
            </select></div>
          <div className="form-group"><label className="form-label">Created By</label>
            <select className="form-select" name="created_by" value={form.created_by} onChange={handleChange}>
              <option value="">Select</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
            </select></div>
        </div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this payment" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
