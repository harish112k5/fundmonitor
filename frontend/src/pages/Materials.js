import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';

const initialForm = { material_name: '', unit: '', unit_price: '', total_purchased: '' };

export default function Materials() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    API.get('/materials').then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) {
        await API.put(`/materials/${editing.material_id}`, form);
        toast.success('Material updated');
      } else {
        await API.post('/materials', form);
        toast.success('Material added');
      }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({ material_name: row.material_name, unit: row.unit, unit_price: row.unit_price || '', total_purchased: row.total_purchased || '' });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/materials/${deleteTarget.material_id}`);
      toast.success('Material deleted');
      setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed to delete'); }
  };

  const columns = [
    { header: 'ID', accessor: 'material_id', style: { width: 60 } },
    { header: 'Material Name', accessor: 'material_name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.material_name}</span>
    )},
    { header: 'Unit', accessor: 'unit' },
    { header: 'Unit Price (₹)', accessor: 'unit_price', render: r => (
      <span className="currency">{r.unit_price ? `₹${Number(r.unit_price).toLocaleString('en-IN')}` : '—'}</span>
    )},
    { header: 'Total Purchased', accessor: 'total_purchased', render: r => (
      <span style={{ color: 'var(--text-secondary)' }}>{r.total_purchased || 0} {r.unit}</span>
    )},
    { header: 'Remaining Stock', accessor: 'current_stock', render: r => {
      const stock = parseFloat(r.current_stock || 0);
      let badgeCls = stock > 100 ? 'badge-active' : stock > 0 ? 'badge-warning' : 'badge-danger';
      return <span className={`badge ${badgeCls}`}>{stock.toFixed(2)} {r.unit}</span>;
    }},
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Materials</h1>
          <p>Manage master material records</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={(r) => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search materials..." emptyIcon="📦" emptyTitle="No materials"
              addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Material
          </button>
        }
      />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Material' : 'New Material'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Material Name *</label>
          <input className="form-input" name="material_name" value={form.material_name} onChange={handleChange} placeholder="e.g. Cement" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Unit *</label>
            <input className="form-input" name="unit" value={form.unit} onChange={handleChange} placeholder="e.g. bags, kg, m3" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Price (₹)</label>
            <input className="form-input" type="number" name="unit_price" value={form.unit_price} onChange={handleChange} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Total Purchased (Initial Stock)</label>
          <input className="form-input" type="number" name="total_purchased" value={form.total_purchased} onChange={handleChange} placeholder="0" />
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.material_name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
