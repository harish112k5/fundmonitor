import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';

const initialForm = {
  project_name: '', location: '', start_date: '', end_date: '',
  estimated_budget: '', status: 'ongoing', created_by: ''
};

export default function Projects() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/projects'), API.get('/users')])
      .then(([d, u]) => { setData(d.data); setUsers(u.data); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) {
        await API.put(`/projects/${editing.project_id}`, form);
        toast.success('Project updated');
      } else {
        await API.post('/projects', form);
        toast.success('Project created');
      }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving');
    }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_name: row.project_name, location: row.location || '',
      start_date: row.start_date ? row.start_date.split('T')[0] : '',
      end_date: row.end_date ? row.end_date.split('T')[0] : '',
      estimated_budget: row.estimated_budget || '', status: row.status,
      created_by: row.created_by
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/projects/${deleteTarget.project_id}`);
      toast.success('Project moved to Recycle Bin');
      setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed to move to Recycle Bin'); }
  };

  const fmt = (n) => n ? new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n) : '—';

  const columns = [
    { header: 'ID', accessor: 'project_id', style: { width: 60 } },
    { header: 'Project Name', accessor: 'project_name', render: r => (
      <Link
        to={`/projects/${r.project_id}`}
        style={{
          fontWeight: 600,
          color: '#F59E0B',
          textDecoration: 'none',
          transition: 'color 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; e.currentTarget.style.color = '#FCD34D'; }}
        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; e.currentTarget.style.color = '#F59E0B'; }}
      >
        {r.project_name}
      </Link>
    )},
    { header: 'Location', accessor: 'location', render: r => r.location || '—' },
    { header: 'Budget', accessor: 'estimated_budget', render: r => (
      <span style={{ fontFamily: "'Roboto Mono', monospace", fontWeight: '500' }}>{fmt(r.estimated_budget)}</span>
    )},
    { header: 'Status', accessor: 'status', render: r => (
      <span className={`badge badge-${r.status}`}>{r.status?.replace('_', ' ')}</span>
    )},
    { header: 'Start', accessor: 'start_date', render: r => r.start_date || '—' },
    { header: 'Created By', accessor: 'created_by_name', render: r => r.created_by_name || '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (data.length === 0 && (user?.role_id === 3 || user?.role_id === 4)) {
    return (
      <PageWrapper>
        <AnimatedItem delay={0} style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
          <h3 style={{ fontFamily: "'Oswald', sans-serif", color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase' }}>No Projects Assigned Yet</h3>
          <p>Your admin will assign you to a project shortly. Check back soon.</p>
          <button onClick={load} className="btn btn-secondary" style={{ margin: '24px auto 0' }}>Refresh</button>
        </AnimatedItem>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
        <div className="page-header">
          <div className="page-header-left">
            <div>
              <h1>Projects</h1>
              <p>Manage your construction projects</p>
            </div>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem delay={0.1}>
        <DataTable
          columns={columns} data={data}
          onEdit={handleEdit}
          onDelete={(r) => { setDeleteTarget(r); setShowDelete(true); }}
          searchPlaceholder="Search projects..."
          emptyIcon="🏗" emptyTitle="No projects yet"
          addButton={
            <button className="btn-premium" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
              <HiOutlinePlus /> Add Project
            </button>
          }
        />
      </AnimatedItem>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}
        title={editing ? 'Edit Project' : 'New Project'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Project Name *</label>
          <input className="form-input" name="project_name" value={form.project_name} onChange={handleChange} placeholder="Enter project name" />
        </div>
        <div className="form-group">
          <label className="form-label">Location</label>
          <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="Project location" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" name="start_date" value={form.start_date} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input className="form-input" type="date" name="end_date" value={form.end_date} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Budget (₹)</label>
            <input className="form-input" type="number" name="estimated_budget" value={form.estimated_budget} onChange={handleChange} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" name="status" value={form.status} onChange={handleChange}>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Created By</label>
          <select className="form-select" name="created_by" value={form.created_by} onChange={handleChange}>
            <option value="">Select user</option>
            {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
          </select>
        </div>
      </Modal>

      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Move to Recycle Bin">
        <DeleteConfirm
          itemName={deleteTarget?.project_name}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          customTitle={`Move ${deleteTarget?.project_name} to Recycle Bin?`}
          customText="This project will be hidden from all views but can be restored later."
          customButtonText="Move to Bin"
        />
      </Modal>
    </PageWrapper>
  );
}
