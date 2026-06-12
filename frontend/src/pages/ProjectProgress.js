import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';


const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const initialForm = { project_id: '', month: '', year: new Date().getFullYear().toString(), progress_percentage: '', remarks: '', recorded_by: '' };

export default function ProjectProgress() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/project-progress'), API.get('/projects')])
      .then(([d, p]) => { setData(d.data); setProjects(p.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/project-progress/${editing.id}`, form); toast.success('Updated'); }
      else { await API.post('/project-progress', form); toast.success('Progress recorded'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, month: row.month.toString(), year: row.year.toString(),
      progress_percentage: row.progress_percentage, remarks: row.remarks || '', recorded_by: row.recorded_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/project-progress/${deleteTarget.id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Period', accessor: 'month', render: r => `${months[r.month - 1]} ${r.year}` },
    { header: 'Progress', accessor: 'progress_percentage', render: r => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 100, height: 6, background: 'var(--border-subtle)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${r.progress_percentage}%`, height: '100%', background: 'var(--accent-gradient)', borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-accent)' }}>{r.progress_percentage}%</span>
      </div>
    )},
    { header: 'Remarks', accessor: 'remarks', render: r => r.remarks ? r.remarks.substring(0, 40) : '—' },
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left"><h1>Project Progress</h1><p>Monthly progress tracking</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search..." emptyIcon="📊" emptyTitle="No progress records" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Progress' : 'Log Progress'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-group"><label className="form-label">Project *</label>
          <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
            <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Month *</label>
            <select className="form-select" name="month" value={form.month} onChange={handleChange}>
              <option value="">Select</option>{months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Year *</label>
            <input className="form-input" type="number" name="year" value={form.year} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label className="form-label">Progress % *</label>
          <input className="form-input" type="number" min="0" max="100" step="0.01" name="progress_percentage" value={form.progress_percentage} onChange={handleChange} placeholder="0-100" /></div>
        <div className="form-group"><label className="form-label">Remarks</label>
          <textarea className="form-textarea" name="remarks" value={form.remarks} onChange={handleChange} /></div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this record" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
