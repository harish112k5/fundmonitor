import { SkeletonTable } from '../components/SkeletonCard';
import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';


const initialForm = { project_id: '', user_id: '', role: 'site_engineer', joined_at: '' };

export default function ProjectTeam() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/project-team'), API.get('/projects'), API.get('/users')])
      .then(([d, p, u]) => { setData(d.data); setProjects(p.data); setUsers(u.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/project-team/${editing.id}`, form); toast.success('Updated'); }
      else { await API.post('/project-team', form); toast.success('Member added'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, user_id: row.user_id, role: row.role,
      joined_at: row.joined_at ? row.joined_at.split('T')[0] : ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/project-team/${deleteTarget.id}`);
      toast.success('Removed'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const roleLabels = { site_engineer: 'Site Engineer', project_manager: 'Project Manager', supervisor: 'Supervisor', accountant: 'Accountant', viewer: 'Viewer' };

  const columns = [
    { header: 'ID', accessor: 'id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Team Member', accessor: 'user_name', render: r => <span style={{ fontWeight: 500 }}>{r.user_name}</span> },
    { header: 'Email', accessor: 'email' },
    { header: 'Role', accessor: 'role', render: r => <span className="badge badge-completed">{roleLabels[r.role] || r.role}</span> },
    { header: 'Joined', accessor: 'joined_at', render: r => r.joined_at || '—' },
  ];

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left"><h1>Project Team</h1><p>Assign team members to projects</p></div>
      </div>
      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search team..." emptyIcon="👥" emptyTitle="No team assignments" />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Assignment' : 'Add Team Member'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Assign'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">User *</label>
            <select className="form-select" name="user_id" value={form.user_id} onChange={handleChange}>
              <option value="">Select</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Role *</label>
            <select className="form-select" name="role" value={form.role} onChange={handleChange}>
              <option value="site_engineer">Site Engineer</option>
              <option value="project_manager">Project Manager</option>
              <option value="supervisor">Supervisor</option>
              <option value="accountant">Accountant</option>
              <option value="viewer">Viewer</option>
            </select></div>
          <div className="form-group"><label className="form-label">Joined Date</label>
            <input className="form-input" type="date" name="joined_at" value={form.joined_at} onChange={handleChange} /></div>
        </div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName={deleteTarget?.user_name} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
