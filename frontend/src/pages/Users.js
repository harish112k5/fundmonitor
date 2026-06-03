import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';


const initialForm = { name: '', email: '', password_hash: '', role_id: '' };

export default function Users() {
  const [data, setData] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/users'), API.get('/roles')])
      .then(([u, r]) => { setData(u.data); setRoles(r.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/users/${editing.user_id}`, form); toast.success('Updated'); }
      else { await API.post('/users', form); toast.success('User created'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name, email: row.email, password_hash: '', role_id: row.role_id });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${deleteTarget.user_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { header: 'ID', accessor: 'user_id', style: { width: 60 } },
    { header: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role_name', render: r => <span className="badge badge-completed">{r.role_name}</span> },
    { header: 'Created', accessor: 'created_at', render: r => new Date(r.created_at).toLocaleDateString() },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left"><h1>Users</h1><p>Manage system users</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search users..." emptyIcon="👤" emptyTitle="No users" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit User' : 'New User'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button></>}>
        <div className="form-group"><label className="form-label">Name *</label>
          <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Full name" /></div>
        <div className="form-group"><label className="form-label">Email *</label>
          <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="user@example.com" /></div>
        {!editing && (
          <div className="form-group"><label className="form-label">Password *</label>
            <input className="form-input" type="password" name="password_hash" value={form.password_hash} onChange={handleChange} placeholder="Enter password" /></div>
        )}
        <div className="form-group"><label className="form-label">Role *</label>
          <select className="form-select" name="role_id" value={form.role_id} onChange={handleChange}>
            <option value="">Select role</option>{roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
          </select></div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
