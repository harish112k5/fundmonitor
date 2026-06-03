import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { project_id: '', investor_id: '', amount: '', investment_date: '', notes: '', created_by: '' };

export default function Investments() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/investments'), API.get('/projects'), API.get('/investors'), API.get('/users')])
      .then(([d, p, i, u]) => { setData(d.data); setProjects(p.data); setInvestors(i.data); setUsers(u.data); })
      .catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/investments/${editing.id}`, form); toast.success('Updated'); }
      else { await API.post('/investments', form); toast.success('Investment recorded'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, investor_id: row.investor_id, amount: row.amount,
      investment_date: row.investment_date ? row.investment_date.split('T')[0] : '',
      notes: row.notes || '', created_by: row.created_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/investments/${deleteTarget.id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Investor', accessor: 'investor_name' },
    { header: 'Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(r.amount)}</span> },
    { header: 'Date', accessor: 'investment_date' },
    { header: 'Notes', accessor: 'notes', render: r => r.notes ? r.notes.substring(0, 40) + (r.notes.length > 40 ? '...' : '') : '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Investments</h1><p>Track project investments</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search..." emptyIcon="💰" emptyTitle="No investments" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Investment' : 'New Investment'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Investor *</label>
            <select className="form-select" name="investor_id" value={form.investor_id} onChange={handleChange}>
              <option value="">Select</option>{investors.map(i => <option key={i.investor_id} value={i.investor_id}>{i.name}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Date *</label>
            <input className="form-input" type="date" name="investment_date" value={form.investment_date} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label>
          <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Created By</label>
          <select className="form-select" name="created_by" value={form.created_by} onChange={handleChange}>
            <option value="">Select</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
          </select></div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this investment" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
