import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { project_id: '', financier_id: '', principal: '', interest_rate: '', start_date: '', end_date: '', created_by: '' };

export default function Loans() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [financiers, setFinanciers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/loans'), API.get('/projects'), API.get('/financiers')])
      .then(([d, p, f]) => { setData(d.data); setProjects(p.data); setFinanciers(f.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/loans/${editing.id}`, form); toast.success('Updated'); }
      else { await API.post('/loans', form); toast.success('Loan added'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, financier_id: row.financier_id, principal: row.principal,
      interest_rate: row.interest_rate, start_date: row.start_date ? row.start_date.split('T')[0] : '',
      end_date: row.end_date ? row.end_date.split('T')[0] : '', created_by: row.created_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/loans/${deleteTarget.id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Financier', accessor: 'financier_name' },
    { header: 'Principal', accessor: 'principal', render: r => <span style={{ fontWeight: 600 }}>{fmt(r.principal)}</span> },
    { header: 'Interest %', accessor: 'interest_rate', render: r => `${r.interest_rate}%` },
    { header: 'Start', accessor: 'start_date' },
    { header: 'End', accessor: 'end_date', render: r => r.end_date || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Loans</h1><p>Manage project loans</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
          <HiOutlinePlus /> Add Loan
        </button>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search loans..." emptyIcon="🏦" emptyTitle="No loans" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Loan' : 'New Loan'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Financier *</label>
            <select className="form-select" name="financier_id" value={form.financier_id} onChange={handleChange}>
              <option value="">Select</option>{financiers.map(f => <option key={f.financier_id} value={f.financier_id}>{f.name}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Principal (₹) *</label>
            <input className="form-input" type="number" name="principal" value={form.principal} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Interest Rate (%) *</label>
            <input className="form-input" type="number" step="0.01" name="interest_rate" value={form.interest_rate} onChange={handleChange} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Start Date *</label>
            <input className="form-input" type="date" name="start_date" value={form.start_date} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">End Date</label>
            <input className="form-input" type="date" name="end_date" value={form.end_date} onChange={handleChange} /></div>
        </div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this loan" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
