import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

const initialForm = { project_id: '', worker_id: '', work_days: '', daily_rate: '', work_date: '', recorded_by: '' };

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
  background: 'var(--bg-input, rgba(255,255,255,0.05))',
  border: '1px solid var(--border-subtle, rgba(255,255,255,0.06))',
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

export default function ManpowerUsage() {
  const { user } = useAuth();
  const currentUserId = user?.user_id;

  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
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
    worker_id: '',
    work_days: '',
    daily_rate: '',
  });

  const [sharedProject, setSharedProject] = useState('');
  const [sharedDate, setSharedDate] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    Promise.all([
      API.get('/manpower-usage'), API.get('/projects'),
      API.get('/workers'), API.get('/users')
    ]).then(([d, p, w, u]) => {
      setData(d.data); setProjects(p.data); setWorkers(w.data); setUsers(u.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'worker_id') {
      const w = workers.find(x => x.worker_id === parseInt(e.target.value));
      if (w && w.daily_rate) newForm.daily_rate = w.daily_rate;
    }
    setForm(newForm);
  };

  const handleSingleSubmit = async () => {
    try {
      await API.put(`/manpower-usage/${editing.id}`, form);
      toast.success('Record updated');
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleBulkSubmit = async () => {
    if (!sharedProject) { toast.error('Select a project'); return; }
    if (!sharedDate)    { toast.error('Select a work date'); return; }

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.worker_id || !r.work_days || !r.daily_rate) {
        toast.error(`Row ${i + 1} is incomplete`);
        return;
      }
    }

    const payload = rows.map(r => ({
      project_id  : sharedProject,
      worker_id   : r.worker_id,
      work_days   : parseFloat(r.work_days),
      daily_rate  : parseFloat(r.daily_rate),
      work_date   : sharedDate,
      recorded_by : currentUserId
    }));

    try {
      setSubmitting(true);
      await API.post('/manpower-usage/bulk', { entries: payload });
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
      project_id: row.project_id, worker_id: row.worker_id, work_days: row.work_days,
      daily_rate: row.daily_rate, work_date: row.work_date ? row.work_date.split('T')[0] : '',
      recorded_by: row.recorded_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/manpower-usage/${deleteTarget.id}`);
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

  const onWorkerChange = (id, workerId) => {
    const worker = workers.find(w => String(w.worker_id) === String(workerId));
    setRows(prev => prev.map(r => {
      if (r._id !== id) return r;
      return {
        ...r,
        worker_id: workerId,
        daily_rate: worker ? String(worker.daily_rate) : r.daily_rate,
      };
    }));
  };

  const totalCost = rows.reduce((sum, r) => {
    return sum + (parseFloat(r.work_days) || 0) * (parseFloat(r.daily_rate) || 0);
  }, 0);

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span>
    )},
    { header: 'Worker', accessor: 'worker_name' },
    { header: 'Role', accessor: 'worker_role_name', render: r => r.worker_role_name || '—' },
    { header: 'Days', accessor: 'work_days' },
    { header: 'Daily Rate', accessor: 'daily_rate', render: r => fmt(r.daily_rate) },
    { header: 'Total', accessor: 'total_cost', render: r => (
      <span style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{fmt(r.total_cost)}</span>
    )},
    { header: 'Date', accessor: 'work_date' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <style>{`
        .responsive-grid-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 40px;
          gap: 8px;
          margin-bottom: 8px;
        }
        .responsive-grid-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 40px;
          gap: 8px;
          margin-bottom: 8px;
          padding: 8px;
          border-radius: 8px;
          background: #13131f;
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
          <h1>Manpower Usage</h1>
          <p>Track worker attendance & costs</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setEditing(null);
          setRows([emptyRow()]);
          setSharedProject('');
          setSharedDate('');
          setShowModal(true);
        }}>
          <HiOutlinePlus /> Log Attendance
        </button>
      </div>

      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search..." emptyIcon="👷" emptyTitle="No manpower usage logged"
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Record' : 'Log Manpower Usage'}
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
                <label className="form-label">Worker *</label>
                <select className="form-select" name="worker_id" value={form.worker_id} onChange={handleChange}>
                  <option value="">Select worker</option>
                  {workers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Days *</label>
                <input className="form-input" type="number" step="0.5" name="work_days" value={form.work_days} onChange={handleChange} placeholder="e.g. 1 or 0.5" />
              </div>
              <div className="form-group">
                <label className="form-label">Daily Rate (₹) *</label>
                <input className="form-input" type="number" name="daily_rate" value={form.daily_rate} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Date *</label>
                <input className="form-input" type="date" name="work_date" value={form.work_date} onChange={handleChange} />
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
                <label style={labelStyle}>WORK DATE *</label>
                <input type="date" value={sharedDate} onChange={e => setSharedDate(e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Row table header */}
            <div className="responsive-grid-header">
              <span style={colHeaderStyle}>WORKER *</span>
              <span style={colHeaderStyle}>WORK DAYS *</span>
              <span style={colHeaderStyle}>DAILY RATE (₹)</span>
              <span style={colHeaderStyle}>TOTAL COST</span>
              <span></span>
            </div>

            {/* Rows */}
            {rows.map((row, index) => {
              const cost = (parseFloat(row.work_days) || 0) * (parseFloat(row.daily_rate) || 0);
              const isIncomplete = !row.worker_id || !row.work_days || !row.daily_rate;
              return (
                <div
                  key={row._id}
                  className="responsive-grid-row"
                  style={{
                    border: isIncomplete && submitting ? '1px solid #ef4444' : '1px solid #2a2a45',
                  }}
                >
                  <div className="responsive-grid-cell-wrapper" data-label="Worker *">
                    <select
                      value={row.worker_id}
                      onChange={e => onWorkerChange(row._id, e.target.value)}
                      style={inputStyle}
                    >
                      <option value="">Select worker</option>
                      {workers.map(w => (
                        <option key={w.worker_id} value={w.worker_id}>{w.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Work Days *">
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      placeholder="e.g. 1 or 26"
                      value={row.work_days}
                      onChange={e => updateRow(row._id, 'work_days', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Daily Rate (₹)">
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate"
                      value={row.daily_rate}
                      onChange={e => updateRow(row._id, 'daily_rate', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="responsive-grid-cell-wrapper" data-label="Total Cost">
                    <div style={{ ...inputStyle, background: 'var(--bg-secondary)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                      {fmt(calcTotal())}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => removeRow(row._id)}
                      disabled={rows.length === 1}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: rows.length === 1 ? '#2a2a45' : '#ef4444',
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
                border: '1px dashed #7c3aed',
                borderRadius: 8,
                color: '#8b5cf6',
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
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 14,
              color: '#94a3b8',
            }}>
              <span>{rows.length} row{rows.length > 1 ? 's' : ''}</span>
              <span>Total Labour Cost: <strong style={{ color: '#f1f5f9' }}>₹{totalCost.toLocaleString('en-IN')}</strong></span>
            </div>

            {/* Footer buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #2a2a45', borderRadius: 8, color: '#94a3b8', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleBulkSubmit}
                disabled={submitting}
                style={{ padding: '10px 24px', background: '#7c3aed', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Saving...' : `Submit All (${rows.length})`}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this record" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </div>
  );
}
