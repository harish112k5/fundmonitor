import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { machine_name: '', machine_type: '', hourly_rate: '', ownership_type: 'owned', status: 'available' };

export default function Machines() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    API.get('/machines').then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) {
        await API.put(`/machines/${editing.machine_id}`, form);
        toast.success('Machine updated');
      } else {
        await API.post('/machines', form);
        toast.success('Machine added');
      }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      machine_name: row.machine_name, machine_type: row.machine_type || '',
      hourly_rate: row.hourly_rate || '', ownership_type: row.ownership_type, status: row.status
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/machines/${deleteTarget.machine_id}`);
      toast.success('Machine deleted');
      setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'ID', accessor: 'machine_id', style: { width: 60 } },
    { header: 'Machine Name', accessor: 'machine_name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.machine_name}</span>
    )},
    { header: 'Type', accessor: 'machine_type', render: r => r.machine_type || '—' },
    { header: 'Hourly Rate', accessor: 'hourly_rate', render: r => r.hourly_rate ? `₹${Number(r.hourly_rate).toLocaleString('en-IN')}` : '—' },
    { header: 'Ownership', accessor: 'ownership_type', render: r => (
      <span className={`badge badge-${r.ownership_type}`}>{r.ownership_type}</span>
    )},
    { header: 'Status', accessor: 'status', render: r => (
      <span className={`badge badge-${r.status}`}>{r.status?.replace('_', ' ')}</span>
    )},
  ];

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Machines</h1>
          <p>Manage machinery & equipment</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={(r) => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search machines..." emptyIcon="🚜" emptyTitle="No machines"
              addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Machine
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Machine' : 'New Machine'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Machine Name *</label>
          <input className="form-input" name="machine_name" value={form.machine_name} onChange={handleChange} placeholder="e.g. JCB Excavator" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Type</label>
            <input className="form-input" name="machine_type" value={form.machine_type} onChange={handleChange} placeholder="e.g. Excavator" />
          </div>
          <div className="form-group">
            <label className="form-label">Hourly Rate (₹)</label>
            <input className="form-input" type="number" name="hourly_rate" value={form.hourly_rate} onChange={handleChange} placeholder="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Ownership</label>
            <select className="form-select" name="ownership_type" value={form.ownership_type} onChange={handleChange}>
              <option value="owned">Owned</option>
              <option value="rented">Rented</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.machine_name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
