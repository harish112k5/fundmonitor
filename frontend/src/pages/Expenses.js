import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import { HiOutlinePlus } from 'react-icons/hi';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const initialForm = { project_id: '', category_id: '', amount: '', description: '', expense_date: '', recorded_by: '' };

const COLORS = ['#F59E0B', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

export default function Expenses() {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(initialForm);

  const load = () => {
    Promise.all([API.get('/expenses'), API.get('/projects'), API.get('/expense-categories'), API.get('/users')])
      .then(([d, p, c, u]) => { setData(d.data?.data || d.data); setProjects(p.data?.data || p.data); setCategories(c.data?.data || c.data); setUsers(u.data?.data || u.data); })
      .catch(() => toast.error('Failed')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    try {
      if (editing) { await API.put(`/expenses/${editing.expense_id}`, form); toast.success('Updated'); }
      else { await API.post('/expenses', form); toast.success('Expense recorded'); }
      setShowModal(false); setEditing(null); setForm(initialForm); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleEdit = (row) => {
    setEditing(row);
    setForm({
      project_id: row.project_id, category_id: row.category_id, amount: row.amount,
      description: row.description || '',
      expense_date: row.expense_date ? row.expense_date.split('T')[0] : '',
      recorded_by: row.recorded_by || ''
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/expenses/${deleteTarget.expense_id}`);
      toast.success('Deleted'); setShowDelete(false); setDeleteTarget(null); load();
    } catch { toast.error('Failed'); }
  };

  const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

  // --- DATA PREP for Charts ---
  const categoryTotals = data.reduce((acc, exp) => {
    const catName = exp.category_name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + parseFloat(exp.amount || 0);
    return acc;
  }, {});
  const pieData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  const monthlyTotals = data.reduce((acc, exp) => {
    const month = exp.expense_date?.slice(0, 7); // YYYY-MM
    if (month) {
      acc[month] = (acc[month] || 0) + parseFloat(exp.amount || 0);
    }
    return acc;
  }, {});
  const barData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  const totalExpenses = data.reduce((s, e) => s + parseFloat(e.amount || 0), 0);
  const currentMonth = new Date().toISOString().slice(0, 7);

  const columns = [
    { header: 'ID', accessor: 'expense_id', style: { width: 60 } },
    { header: 'Project', accessor: 'project_name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.project_name}</span> },
    { header: 'Category', accessor: 'category_name', render: r => <span className="badge badge-draft">{r.category_name}</span> },
    { header: 'Amount', accessor: 'amount', render: r => <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{fmt(r.amount)}</span> },
    { header: 'Description', accessor: 'description', render: r => r.description ? r.description.substring(0, 40) : '—' },
    { header: 'Date', accessor: 'expense_date' },
    { header: 'Recorded By', accessor: 'recorded_by_name', render: r => r.recorded_by_name || '—' },
  ];

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
      <div className="page-header">
        <div className="page-header-left"><h1>Expenses</h1><p>Track project expenses</p></div>
      </div>

      {/* ========== CHARTS SECTION ========== */}
      <div style={{ marginBottom: 24 }}>

        {/* Summary Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}>
          {[
            { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: '#ef4444', icon: '💰' },
            { label: 'This Month', value: `₹${(monthlyTotals[currentMonth] || 0).toLocaleString('en-IN')}`, color: '#f59e0b', icon: '📅' },
            { label: 'Categories', value: Object.keys(categoryTotals).length, color: '#F59E0B', icon: '📊' },
            { label: 'Total Records', value: data.length, color: '#3b82f6', icon: '📋' },
          ].map(card => (
            <div key={card.label} style={{
              background: 'var(--glass-bg)',
              border: 'var(--glass-border)',
              borderLeft: `3px solid ${card.color}`,
              borderRadius: 10,
              padding: '14px 18px',
              backdropFilter: 'blur(20px)',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{card.icon}</span>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{card.label}</p>
              </div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        {data.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

            {/* Pie Chart */}
            <div style={{
              background: 'var(--glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 12,
              padding: '20px',
              backdropFilter: 'blur(20px)',
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                📈 Category Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: 'var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div style={{
              background: 'var(--glass-bg)',
              border: 'var(--glass-border)',
              borderRadius: 12,
              padding: '20px',
              backdropFilter: 'blur(20px)',
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                📊 Monthly Trend (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                    contentStyle={{
                      background: 'var(--bg-secondary)',
                      border: 'var(--glass-border)',
                      borderRadius: 8,
                      color: 'var(--text-primary)',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="total" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}
      </div>
      {/* ========== END CHARTS SECTION ========== */}

      <DataTable columns={columns} data={data} onEdit={handleEdit}
        onDelete={r => { setDeleteTarget(r); setShowDelete(true); }}
        searchPlaceholder="Search expenses..." emptyIcon="💸" emptyTitle="No expenses"
        addButton={
          <button className="btn btn-primary" onClick={() => { setEditing(null); setForm(initialForm); setShowModal(true); }}>
            <HiOutlinePlus /> Add Expense
          </button>
        }
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Expense' : 'New Expense'}
        footer={<><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Update' : 'Save'}</button></>}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Project *</label>
            <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange}>
              <option value="">Select</option>{projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Category *</label>
            <select className="form-select" name="category_id" value={form.category_id} onChange={handleChange}>
              <option value="">Select</option>{categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
            </select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" name="amount" value={form.amount} onChange={handleChange} /></div>
          <div className="form-group"><label className="form-label">Date *</label>
            <input className="form-input" type="date" name="expense_date" value={form.expense_date} onChange={handleChange} /></div>
        </div>
        <div className="form-group"><label className="form-label">Description</label>
          <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} /></div>
        <div className="form-group"><label className="form-label">Recorded By</label>
          <select className="form-select" name="recorded_by" value={form.recorded_by} onChange={handleChange}>
            <option value="">Select</option>{users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
          </select></div>
      </Modal>
      <Modal isOpen={showDelete} onClose={() => setShowDelete(false)} title="Confirm Delete">
        <DeleteConfirm itemName="this expense" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      </Modal>
    </AnimatedItem>
    </PageWrapper>
  );
}
