import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { name: '', contact: '', aadhar_number: '', worker_role_id: '', daily_rate: '' };

export default function Workers() {
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/workers'), API.get('/worker-roles')])
      .then(([w, r]) => { setData(w.data); setRoles(r.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) {
        await API.put(`/workers/${editing.worker_id}`, form);
        toast.success('Worker updated');
      } else {
        await API.post('/workers', form);
        toast.success('Worker added');
      }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name, contact: row.contact || '', aadhar_number: row.aadhar_number || '',
      worker_role_id: row.worker_role_id || '', daily_rate: row.daily_rate || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/workers/${deleteTarget.worker_id}`);
      toast.success('Worker deleted');
      setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'ID', accessor: 'worker_id', style: { width: 60 } },
    { header: 'Name', accessor: 'name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
    )},
    { header: 'Role', accessor: 'worker_role_name', render: r => r.worker_role_name || '—' },
    { header: 'Contact', accessor: 'contact', render: r => r.contact || '—' },
    { header: 'Aadhar', accessor: 'aadhar_number', render: r => r.aadhar_number || '—' },
    { header: 'Daily Rate', accessor: 'daily_rate', render: r => r.daily_rate ? `₹${Number(r.daily_rate).toLocaleString('en-IN')}` : '—' },
    { header: 'Status', accessor: 'is_active', render: r => (
      <span className={`badge ${r.is_active ? 'badge-active' : 'badge-inactive'}`}>
        {r.is_active ? 'Active' : 'Inactive'}
      </span>
    )},
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Workers</h1>
          <p>Manage workforce & labor</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={(r) => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search workers..." emptyIcon="👷" emptyTitle="No workers"
        addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Worker
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Worker' : 'New Worker'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Worker name" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Contact</label>
            <input className="form-input" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone number" />
          </div>
          <div className="form-group">
            <label className="form-label">Aadhar Number</label>
            <input className="form-input" name="aadhar_number" value={form.aadhar_number} onChange={handleChange} placeholder="XXXX XXXX XXXX" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" name="worker_role_id" value={form.worker_role_id} onChange={handleChange}>
              <option value="">Select role</option>
              {roles.map(r => <option key={r.worker_role_id} value={r.worker_role_id}>{r.role_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Daily Rate (₹)</label>
            <input className="form-input" type="number" name="daily_rate" value={form.daily_rate} onChange={handleChange} placeholder="0" />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
