import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const initialForm = { project_id: '', material_id: '', quantity: '', unit_price: '', usage_date: '', recorded_by: '' };

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  background: 'var(--bg-input, var(--border-subtle))',
  border: '1px solid var(--border-subtle, var(--border-subtle))',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  boxSizing: 'border-box'
};

const colHeaderStyle = {
  fontSize: '11px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

export default function MaterialUsage() {
  const { user, canEdit, canDeleteResources } = useAuth();
  const currentUserId = user?.user_id;

  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // States for single row editing
  const [form, setForm] = useState(initialForm);

  // States for bulk entries
  const emptyRow = () => ({
    _id: Date.now() + Math.random(),
    material_id: '',
    quantity: '',
    unit_price: '',
    supplier_name: '',
  });

  const [sharedProject, setSharedProject] = useState('');
  const [sharedDate, setSharedDate] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      API.get('/material-usage'), API.get('/projects'),
      API.get('/materials'), API.get('/users')
    ]).then(([d, p, m, u]) => {
      setData(d.data); setProjects(p.data); setMaterials(m.data); setUsers(u.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'material_id') {
      const mat = materials.find(m => m.material_id === parseInt(e.target.value));
      if (mat && mat.unit_price) newForm.unit_price = mat.unit_price;
    }
    setForm(newForm);
  };

  const handleSingleSubmit = async () => {
    try {
      await API.put(`/material-usage/${editing.id}`, form);
      toast.success('Record updated');
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleBulkSubmit = async () => {
    if (!sharedProject) { toast.error('Select a project'); return; }
    if (!sharedDate)    { toast.error('Select a usage date'); return; }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.material_id || !r.quantity || !r.unit_price) {
        toast.error(`Row ${i + 1} is incomplete`);
        return;
      }
    }

    const payload = rows.map(r => ({
      project_id    : sharedProject,
      material_id   : r.material_id,
      quantity      : parseFloat(r.quantity),
      unit_price    : parseFloat(r.unit_price),
      usage_date    : sharedDate,
      supplier_name : r.supplier_name || '',
      recorded_by   : currentUserId
    }));

    try {
      setSubmitting(true);
      await API.post('/material-usage/bulk', { entries: payload });
      toast.success(`${payload.length} records saved successfully`);
      setRows([emptyRow()]);
      setSharedProject('');
      setSharedDate('');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, material_id: row.material_id, quantity: row.quantity,
      unit_price: row.unit_price, usage_date: row.usage_date ? row.usage_date.split('T')[0] : '',
      recorded_by: row.recorded_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/material-usage/${deleteTarget.id}`);
      toast.success('Record deleted');
      setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed to delete'); }
  };

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const removeRow = (id) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r._id !== id));
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      return { ...r, [field]: value };
    }));
  };

  const onMaterialChange = (id, materialId) => {
    const mat = materials.find(m => String(m.material_id) === String(materialId));
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      return {
        ...r,
        material_id: materialId,
        unit_price: mat ? String(mat.unit_price) : r.unit_price,
      };
    }));
  };

  const totalCost = rows.reduce((sum, r) => {
    return sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.unit_price) || 0);
  }, 0);

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span>
    )},
    { header: 'Material', accessor: 'material_name' },
    { header: 'Qty', accessor: 'quantity', render: r => `${r.quantity} ${r.unit || ''}` },
    { header: 'Unit Price', accessor: 'unit_price', render: r => fmt(r.unit_price) },
    { header: 'Total', accessor: 'total_cost', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{fmt(r.total_cost)}</span>
    )},
    { header: 'Date', accessor: 'usage_date' },
    { header: 'Recorded By', accessor: 'recorded_by_name', render: r => r.recorded_by_name || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <style>{`
        .responsive-grid-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 2fr 40px;
          gap: 8px;
          margin-bottom: 8px;
        }
        .responsive-grid-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 2fr 40px;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          border-radius: 8px;
          background: var(--bg-card);
          align-items: center;
        }
        @media (max-width: 900px) {
          .responsive-grid-header {
            display: none !important;
          }
          .responsive-grid-row {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            padding: 16px !important;
            border: 1px solid var(--border-subtle) !important;
          }
          .responsive-grid-cell-wrapper {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .responsive-grid-cell-wrapper::before {
            content: attr(data-label);
            font-size: 11px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
          }
        }
      `}</style>

      <div className="page-header">
        <div className="page-header-left">
          <h1>Material Usage</h1>
          <p>Track material consumption per project</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} 
        onEdit={canEdit ? handleEdit : null}
        onDelete={canDeleteResources ? r => { setDeleteTarget(r); setShowDelete(true); } : null}
        searchPlaceholder="Search usage..." emptyIcon="📦" emptyTitle="No material usage logged"
        addButton={
          canEdit && (
            <button className="btn btn-primary" onClick={() => {
              setEditing(null);
              setRows([emptyRow()]);
              setSharedProject('');
              setSharedDate('');
              setShowModal(true);
            }}>
              <HiOutlinePlus /> Log Usage
            </button>
          )
        }
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Usage' : 'Log Material Usage'}
        style={editing ? { maxWidth: '560px', width: '100%' } : { maxWidth: '860px', width: '90vw' }}
        footer={null}
      >
        {editing ? (
          /* Single Row Edit Form */
          <div style={{ padding: '0 24px 24px' }}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Material *</label>
                <select className="form-select" name="material_id" value={form.material_id} onChange={handleChange}>
                  <option value="">Select material</option>
                  {materials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name} ({m.unit})</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" type="number" step="0.01" name="quantity" value={form.quantity} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Unit Price (₹) *</label>
                <input className="form-input" type="number" step="0.01" name="unit_price" value={form.unit_price} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Usage Date *</label>
                <input className="form-input" type="date" name="usage_date" value={form.usage_date} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Recorded By</label>
                <select className="form-select" name="recorded_by" value={form.recorded_by} onChange={handleChange}>
                  <option value="">Select user</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSingleSubmit}>Update</button>
            </div>
          </div>
        ) : (
          /* Bulk Multi-Row Entry Form */
          <div style={{ padding: '0 24px 24px' }}>
            {/* Shared top fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>PROJECT *</label>
                <select value={sharedProject} onChange={e => setSharedProject(e.target.value)} style={inputStyle}>
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>USAGE DATE *</label>
                <input type="date" value={sharedDate} onChange={e => setSharedDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Row table header */}
            <div className="responsive-grid-header">
              <span style={colHeaderStyle}>MATERIAL *</span>
              <span style={colHeaderStyle}>QTY *</span>
              <span style={colHeaderStyle}>UNIT PRICE (₹)</span>
              <span style={colHeaderStyle}>TOTAL COST</span>
              <span style={colHeaderStyle}>SUPPLIER</span>
              <span></span>
            </div>

            {/* Rows */}
            {rows.map((row, index) => {
              const cost = (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
              const isIncomplete = !row.material_id || !row.quantity || !row.unit_price;
              return (
                <div
                  key={row._id}
                  className="responsive-grid-row"
                  style={{
                    border: isIncomplete && submitting ? '1px solid #ef4444' : '1px solid var(--border-medium)',
                  }}
                >
                  <div className="responsive-grid-cell-wrapper" data-label="Material *">
                    <select
                      value={row.material_id}
                      onChange={e => onMaterialChange(row._id, e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select material</option>
                      {materials.map(m => (
                        <option key={m.material_id} value={m.material_id}>{m.material_name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Quantity *">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={e => updateRow(row._id, 'quantity', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Unit Price (₹)">
                    <input
                      type="number"
                      min="0"
                      placeholder="Price"
                      value={row.unit_price}
                      onChange={e => updateRow(row._id, 'unit_price', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Total Cost">
                    <div style={{ ...inputStyle, background: 'var(--bg-card)', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      ₹{cost.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Supplier">
                    <input
                      type="text"
                      placeholder="Optional"
                      value={row.supplier_name}
                      onChange={e => updateRow(row._id, 'supplier_name', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => removeRow(row._id)}
                      disabled={rows.length === 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: rows.length === 1 ? 'var(--border-medium)' : '#ef4444',
                        cursor: rows.length === 1 ? 'not-allowed' : 'pointer',
                        fontSize: 18,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Add Row button */}
            <button
              onClick={addRow}
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px',
                background: 'transparent',
                border: '1px dashed #F59E0B',
                borderRadius: 8,
                color: '#FCD34D',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              + Add Row
            </button>

            {/* Summary bar */}
            <div style={{
              marginTop: 16,
              padding: '10px 16px',
              background: 'var(--bg-card)',
              borderRadius: 8,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              color: '#94a3b8',
            }}>
              <span>{rows.length} row{rows.length > 1 ? 's' : ''}</span>
              <span>Total Material Cost: <strong style={{ color: 'var(--text-primary)' }}>₹{totalCost.toLocaleString('en-IN')}</strong></span>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-medium)', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={submitting}
                style={{ padding: '10px 24px', background: '#F59E0B', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : `Submit All (${rows.length})`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this usage record" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
