import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { name: '', phone: '', email: '' };

export default function Investors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    API.get('/investors').then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/investors/${editing.investor_id}`, form); toast.success('Updated'); }
      else { await API.post('/investors', form); toast.success('Added'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, phone: row.phone || '', email: row.email || '' });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/investors/${deleteTarget.investor_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { header: 'ID', accessor: 'investor_id', style: { width: 60 } },
    { header: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span> },
    { header: 'Phone', accessor: 'phone', render: r => r.phone || '—' },
    { header: 'Email', accessor: 'email', render: r => r.email || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Investors</h1><p>Manage investor contacts</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search investors..." emptyIcon="💰" emptyTitle="No investors"
              addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Investor
          </button>
        }
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Investor' : 'New Investor'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Investor name" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Phone</label>
            <input className="form-input" name="phone" value={form.phone} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} /></div>
        </div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
