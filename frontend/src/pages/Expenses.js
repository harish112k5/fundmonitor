import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { project_id: '', category_id: '', amount: '', description: '', expense_date: '', recorded_by: '' };

export default function Expenses() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/expenses'), API.get('/projects'), API.get('/expense-categories'), API.get('/users')])
      .then(([d, p, c, u]) => { setData(d.data); setProjects(p.data); setCategories(c.data); setUsers(u.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/expenses/${editing.expense_id}`, form); toast.success('Updated'); }
      else { await API.post('/expenses', form); toast.success('Expense recorded'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, category_id: row.category_id, amount: row.amount,
      description: row.description || '',
      expense_date: row.expense_date ? row.expense_date.split('T')[0] : '',
      recorded_by: row.recorded_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/expenses/${deleteTarget.expense_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'expense_id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Category', accessor: 'category_name', render: r => <span className="badge badge-draft">{r.category_name}</span> },
    { header: 'Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(r.amount)}</span> },
    { header: 'Description', accessor: 'description', render: r => r.description ? r.description.substring(0, 40) : '—' },
    { header: 'Date', accessor: 'expense_date' },
    { header: 'Recorded By', accessor: 'recorded_by_name', render: r => r.recorded_by_name || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Expenses</h1><p>Track project expenses</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search expenses..." emptyIcon="💸" emptyTitle="No expenses"
        addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Expense
          </button>
        }
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Expense' : 'New Expense'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Category *</label>
            <select className="form-select" name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">Select</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Date *</label>
            <input className="form-input" type="date" name="expense_date" value={form.expense_date} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label>
          <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Recorded By</label>
          <select className="form-select" name="recorded_by" value={form.recorded_by} onChange={handleChange}>
            <option value="">Select</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
          </select></div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this expense" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
