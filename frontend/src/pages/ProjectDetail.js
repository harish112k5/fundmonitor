import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import API from '../api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineOfficeBuilding,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineCash,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineUserGroup,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatINR = (value) => {
  if (value == null) return '—';
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  return `₹${value.toLocaleString('en-IN')}`;
};

const fmt = (n) =>
  n != null && n !== ''
    ? new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(n)
    : '—';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status?.replace('_', ' ')}</span>;
}

function ProgressBar({ pct }) {
  const p = Math.min(Math.max(pct || 0, 0), 100);
  const color = p >= 80 ? 'var(--success)' : p >= 40 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Completion</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{p}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color = 'var(--accent-start, #6366f1)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}22`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color, fontSize: '1.1rem', flexShrink: 0
      }}>
        <Icon />
      </div>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm, 10px)'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: color || 'var(--text-primary)' }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ columns, rows, emptyMsg }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', padding: '12px 0' }}>{emptyMsg || 'No records found.'}</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} style={c.style}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabGroup({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-subtle)', marginBottom: 20 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '10px 18px',
            fontSize: '0.84rem', fontWeight: 600, borderBottom: `2px solid ${active === t.id ? 'var(--accent-start, #6366f1)' : 'transparent'}`,
            color: active === t.id ? 'var(--accent-start, #6366f1)' : 'var(--text-muted)',
            transition: 'color 0.15s', marginBottom: -1
          }}
        >
          {t.label} {t.count != null ? <span style={{ opacity: 0.7, fontSize: '0.75rem' }}>({t.count})</span> : null}
        </button>
      ))}
    </div>
  );
}

// ─── Finance Card ───────────────────────────────────────────────────────────
function FinanceCard({ label, value, sub, icon: Icon, color = '#6366f1', highlight }) {
  return (
    <div style={{
      padding: '16px 20px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${highlight ? color + '55' : 'var(--border-subtle)'}`,
      borderRadius: 'var(--radius-sm, 10px)',
      display: 'flex', gap: 14, alignItems: 'flex-start'
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, fontSize: '1.2rem', flexShrink: 0
      }}>
        <Icon />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: highlight || 'var(--text-primary)', marginTop: 2 }}>{value}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams();
  const { isManager } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');

  // Master lists for dropdowns
  const [masterMaterials, setMasterMaterials] = useState([]);
  const [masterWorkers, setMasterWorkers] = useState([]);
  const [masterMachines, setMasterMachines] = useState([]);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'materials', 'manpower', 'machines'
  const [editingRow, setEditingRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Forms state
  const [formMaterial, setFormMaterial] = useState({ material_id: '', quantity: '', unit_price: '', usage_date: '' });
  const [formManpower, setFormManpower] = useState({ worker_id: '', work_days: '', daily_rate: '', work_date: '' });
  const [formMachine, setFormMachine] = useState({ machine_id: '', usage_hours: '', hourly_rate: '', usage_date: '' });

  const loadProjectDetails = () => {
    API.get(`/projects/${id}/details`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load project'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjectDetails();
    Promise.all([
      API.get('/materials').catch(() => ({ data: [] })),
      API.get('/workers').catch(() => ({ data: [] })),
      API.get('/machines').catch(() => ({ data: [] }))
    ]).then(([mat, work, mach]) => {
      setMasterMaterials(mat.data);
      setMasterWorkers(work.data);
      setMasterMachines(mach.data);
    });
  }, [id]);

  const openAddModal = (type) => {
    setEditingRow(null);
    if (type === 'materials') setFormMaterial({ material_id: '', quantity: '', unit_price: '', usage_date: '' });
    if (type === 'manpower') setFormManpower({ worker_id: '', work_days: '', daily_rate: '', work_date: '' });
    if (type === 'machines') setFormMachine({ machine_id: '', usage_hours: '', hourly_rate: '', usage_date: '' });
    setActiveModal(type);
  };

  const openEditModal = (type, row) => {
    setEditingRow(row);
    if (type === 'materials') setFormMaterial({ material_id: row.material_id || '', quantity: row.quantity || '', unit_price: row.unit_price || '', usage_date: row.usage_date?.split('T')[0] || '' });
    if (type === 'manpower') setFormManpower({ worker_id: row.worker_id || '', work_days: row.work_days || '', daily_rate: row.daily_rate || '', work_date: row.work_date?.split('T')[0] || '' });
    if (type === 'machines') setFormMachine({ machine_id: row.machine_id || '', usage_hours: row.usage_hours || '', hourly_rate: row.hourly_rate || '', usage_date: row.usage_date?.split('T')[0] || '' });
    setActiveModal(type);
  };

  const handleChangeMaterial = (e) => {
    const val = e.target.value;
    if (e.target.name === 'material_id') {
      const found = masterMaterials.find(m => m.material_id == val);
      setFormMaterial({ ...formMaterial, material_id: val, unit_price: found?.unit_price || formMaterial.unit_price });
    } else {
      setFormMaterial({ ...formMaterial, [e.target.name]: val });
    }
  };
  const handleChangeManpower = (e) => {
    const val = e.target.value;
    if (e.target.name === 'worker_id') {
      const found = masterWorkers.find(m => m.worker_id == val);
      setFormManpower({ ...formManpower, worker_id: val, daily_rate: found?.daily_rate || formManpower.daily_rate });
    } else {
      setFormManpower({ ...formManpower, [e.target.name]: val });
    }
  };
  const handleChangeMachine = (e) => {
    const val = e.target.value;
    if (e.target.name === 'machine_id') {
      const found = masterMachines.find(m => m.machine_id == val);
      setFormMachine({ ...formMachine, machine_id: val, hourly_rate: found?.hourly_rate || formMachine.hourly_rate });
    } else {
      setFormMachine({ ...formMachine, [e.target.name]: val });
    }
  };

  const handleResourceSubmit = async (type) => {
    try {
      let endpoint = '';
      let payload = { project_id: id };
      let editId = null;

      if (type === 'materials') {
        endpoint = '/material-usage';
        payload = { ...payload, ...formMaterial };
        editId = editingRow?.id;
      } else if (type === 'manpower') {
        endpoint = '/manpower-usage';
        payload = { ...payload, ...formManpower };
        editId = editingRow?.id;
      } else if (type === 'machines') {
        endpoint = '/machine-usage';
        payload = { ...payload, ...formMachine };
        editId = editingRow?.id;
      }

      if (editingRow) {
        await API.put(`${endpoint}/${editId}`, payload);
        toast.success('Record updated');
      } else {
        await API.post(endpoint, payload);
        toast.success('Record added');
      }
      setActiveModal(null);
      loadProjectDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    }
  };

  const handleResourceDelete = async () => {
    try {
      const type = deleteTarget.type;
      const endpoint = type === 'materials' ? '/material-usage' 
                     : type === 'manpower' ? '/manpower-usage' 
                     : '/machine-usage';
      
      await API.delete(`${endpoint}/${deleteTarget.row.id}`);
      toast.success('Record deleted');
      setDeleteTarget(null);
      loadProjectDetails();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  // ── Data Processing for Analytics (Hooks MUST be above returns) ──
  const costBreakdown = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Materials', value: parseFloat(data.financials.material_cost) || 0, fill: '#3b82f6' },
      { name: 'Manpower', value: parseFloat(data.financials.manpower_cost) || 0, fill: '#f97316' },
      { name: 'Machines', value: parseFloat(data.financials.machine_cost) || 0, fill: '#a855f7' },
      { name: 'Expenses', value: parseFloat(data.financials.expense_cost) || 0, fill: '#f43f5e' }
    ].filter(i => i.value > 0);
  }, [data]);

  const billingBreakdown = useMemo(() => {
    if (!data) return [];
    let paid = 0, pending = 0, overdue = 0;
    data.billing.forEach(b => {
      if (b.status === 'paid') paid++;
      else if (b.due_date && new Date(b.due_date) < new Date()) overdue++;
      else pending++;
    });
    return [
      { name: 'Paid', value: paid, fill: '#10b981' },
      { name: 'Pending', value: pending, fill: '#eab308' },
      { name: 'Overdue', value: overdue, fill: '#ef4444' }
    ].filter(i => i.value > 0);
  }, [data]);

  const monthlyTrend = useMemo(() => {
    if (!data) return [];
    const map = {};
    const add = (dateStr, type, amt) => {
      if (!dateStr || !amt) return;
      const d = new Date(dateStr);
      const m = `${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
      if (!map[m]) map[m] = { month: m, materials: 0, manpower: 0, machines: 0, expenses: 0, timestamp: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      map[m][type] += parseFloat(amt);
    };
    data.material_usage.forEach(r => add(r.usage_date, 'materials', r.total_cost));
    data.manpower_usage.forEach(r => add(r.work_date, 'manpower', r.total_cost));
    data.machine_usage.forEach(r => add(r.usage_date, 'machines', r.total_cost));
    data.expenses.forEach(r => add(r.expense_date, 'expenses', r.amount));
    return Object.values(map).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // ── Early Returns ──
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (error || !data) {
    return (
      <div className="animate-in" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚫</div>
        <h2 style={{ color: 'var(--danger)' }}>Project Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error || 'Unknown error'}</p>
        <Link to="/projects" className="btn btn-secondary">← Back to Projects</Link>
      </div>
    );
  }

  const { project, progress, financials, material_usage, manpower_usage, machine_usage, team, billing, expenses } = data;
  const isOverBudget = financials.budget_variance < 0;

  // ── Chart Variables ──
  const budgetData = [
    { name: 'Estimated Budget', value: parseFloat(project.estimated_budget) || 0, fill: '#3b82f6' },
    { name: 'Actual Cost', value: financials.actual_cost, fill: isOverBudget ? '#ef4444' : '#10b981' }
  ];

  const fundingData = [
    { name: 'Investments', value: financials.total_investments, fill: '#10b981' },
    { name: 'Loans', value: financials.total_loans, fill: '#3b82f6' },
    { name: 'Expenses', value: financials.expense_cost, fill: '#f59e0b' }
  ].filter(i => i.value > 0);

  const chartCardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '20px'
  };

  // ── Main Page Tabs ──
  const mainTabs = [
    { id: 'analytics', label: '📊 Analytics', count: null },
    { id: 'materials', label: '🧱 Materials', count: material_usage.length },
    { id: 'manpower', label: '👷 Manpower', count: manpower_usage.length },
    { id: 'machines', label: '🚜 Machines', count: machine_usage.length },
  ];

  return (
    <div className="animate-in">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div className="page-header-left">
          <Link
            to="/projects"
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontSize: '0.82rem' }}
          >
            <HiOutlineArrowLeft /> Back to Projects
          </Link>
          <h1 style={{ margin: 0 }}>{project.project_name}</h1>
          <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {project.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <HiOutlineLocationMarker /> {project.location}
              </span>
            )}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* ── SECTION 1: Project Overview ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <SectionHeader icon={HiOutlineOfficeBuilding} title="Project Overview" />
        <InfoGrid items={[
          { label: 'Project ID', value: `#${project.project_id}` },
          { label: 'Location', value: project.location || '—' },
          { label: 'Start Date', value: fmtDate(project.start_date) },
          { label: 'End Date', value: fmtDate(project.end_date) },
          { label: 'Estimated Budget', value: fmt(project.estimated_budget), color: 'var(--accent-start, #6366f1)' },
          { label: 'Created By', value: project.created_by_name || '—' },
          { label: 'Created At', value: fmtDate(project.created_at) },
          { label: 'Status', value: project.status?.replace('_', ' ') || '—' },
        ]} />
        {progress && (
          <div style={{ marginTop: 20, maxWidth: 360 }}>
            <ProgressBar pct={progress.progress_percentage} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
              Latest: {progress.month}/{progress.year}
            </div>
            {progress.remarks && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 6 }}>
                📝 {progress.remarks}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── SECTION 2: Financial Summary (hidden for viewers) ── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 20 }}>
          <SectionHeader icon={HiOutlineCurrencyDollar} title="Financial Summary" color="#10b981" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 16 }}>
            <FinanceCard label="Estimated Budget" value={fmt(project.estimated_budget)} icon={HiOutlineChartBar} color="#6366f1" />
            <FinanceCard label="Actual Cost" value={fmt(financials.actual_cost)} icon={HiOutlineCash} color="#f59e0b" />
            <FinanceCard
              label="Budget Variance"
              value={fmt(Math.abs(financials.budget_variance))}
              sub={isOverBudget ? '⚠ Over budget' : '✓ Under budget'}
              icon={HiOutlineChartBar}
              color={isOverBudget ? '#ef4444' : '#10b981'}
              highlight={isOverBudget ? '#ef4444' : null}
            />
            <FinanceCard label="Total Investments" value={fmt(financials.total_investments)} icon={HiOutlineCurrencyDollar} color="#10b981" />
            <FinanceCard label="Total Loans" value={fmt(financials.total_loans)} icon={HiOutlineCash} color="#3b82f6" />
            <FinanceCard label="Pending Interest" value={fmt(financials.pending_interest)} icon={HiOutlineDocumentText} color={financials.pending_interest > 0 ? '#ef4444' : '#6b7280'} />
            <FinanceCard
              label="Total Billed"
              value={fmt(financials.total_billed)}
              sub={`${financials.pending_invoices} invoice${financials.pending_invoices !== 1 ? 's' : ''} pending`}
              icon={HiOutlineDocumentText}
              color="#a78bfa"
            />
            <FinanceCard label="Total Expenses" value={fmt(financials.expense_cost)} icon={HiOutlineClipboardList} color="#f59e0b" />
          </div>

          {/* Cost breakdown mini row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: '🧱 Materials', val: financials.material_cost },
              { label: '👷 Manpower', val: financials.manpower_cost },
              { label: '🚜 Machines', val: financials.machine_cost },
            ].map(({ label, val }) => (
              <div key={label} style={{
                textAlign: 'center', padding: '10px 12px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 8
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 4 }}>{fmt(val)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabbed View: Analytics & Resources ── */}
      <TabGroup tabs={mainTabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'analytics' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 20 }}>
          
          {/* Chart 1: Budget vs Actual */}
          <div style={chartCardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Budget vs Actual Cost</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isOverBudget ? (
                <span style={{ color: '#ef4444' }}>{formatINR(Math.abs(financials.budget_variance))} Over Budget</span>
              ) : (
                <span style={{ color: '#10b981' }}>{formatINR(financials.budget_variance)} Under Budget</span>
              )}
            </p>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatINR} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => formatINR(val)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={true}>
                    {budgetData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cost Breakdown */}
          <div style={chartCardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Cost Breakdown</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Distribution of actual project expenses</p>
            <div style={{ height: 250 }}>
              {costBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie data={costBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="rgba(0,0,0,0.5)" strokeWidth={2} isAnimationActive={true}>
                      {costBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => formatINR(val)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available yet</div>
              )}
            </div>
          </div>

          {/* Chart 3: Monthly Cost Trend */}
          <div style={{ ...chartCardStyle, gridColumn: '1 / -1' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Monthly Cost Trend</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Expenditure progression over time</p>
            <div style={{ height: 320 }}>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatINR} />
                    <Tooltip contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => formatINR(val)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: 15 }} />
                    <Line type="monotone" dataKey="materials" name="Materials" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                    <Line type="monotone" dataKey="manpower" name="Manpower" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                    <Line type="monotone" dataKey="machines" name="Machines" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                    <Line type="monotone" dataKey="expenses" name="Other Expenses" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available yet</div>
              )}
            </div>
          </div>

          {/* Chart 4: Resource Utilization (Stacked) */}
          <div style={chartCardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Resource Utilization Split</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly 3M distribution</p>
            <div style={{ height: 260 }}>
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatINR} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => formatINR(val)} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', paddingTop: 10 }} />
                    <Bar dataKey="materials" name="Materials" stackId="a" fill="#3b82f6" isAnimationActive={true} />
                    <Bar dataKey="manpower" name="Manpower" stackId="a" fill="#f97316" isAnimationActive={true} />
                    <Bar dataKey="machines" name="Machines" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} isAnimationActive={true} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available yet</div>
              )}
            </div>
          </div>

          {/* Chart 5: Funding vs Expense */}
          <div style={chartCardStyle}>
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Funding Sources vs Burn</h3>
            <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total investments, loans and expenses</p>
            <div style={{ height: 260 }}>
              {fundingData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fundingData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatINR} />
                    <YAxis dataKey="name" type="category" stroke="#a0aec0" fontSize={12} tickLine={false} axisLine={false} width={80} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => formatINR(val)} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30} isAnimationActive={true}>
                      {fundingData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available yet</div>
              )}
            </div>
          </div>

          {/* Chart 6: Billing Status (Manager+ only) */}
          {isManager && (
            <div style={{ ...chartCardStyle }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#fff' }}>Billing Status Breakdown</h3>
              <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invoice statuses by count</p>
              <div style={{ height: 260, position: 'relative' }}>
                {billingBreakdown.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                        <Pie data={billingBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="rgba(0,0,0,0.5)" strokeWidth={2} isAnimationActive={true} labelLine={false}>
                          {billingBreakdown.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e1e2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }} formatter={(val) => [val, 'Invoices']} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', top: '43%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{billing.length}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Total</div>
                    </div>
                  </>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No billing data available</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 3: Resource Usage ── */}
      {['materials', 'manpower', 'machines'].includes(activeTab) && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: `#f59e0b22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', fontSize: '1.1rem'
              }}>
                <HiOutlineCube />
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Usage Details</h2>
            </div>
            <button className="btn-premium btn-sm" onClick={() => openAddModal(activeTab)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HiOutlinePlus /> Add {activeTab === 'materials' ? 'Material' : activeTab === 'manpower' ? 'Manpower' : 'Machine'}
            </button>
          </div>

        {activeTab === 'materials' && (
          <SimpleTable
            emptyMsg="No material usage recorded for this project."
            columns={[
              { key: 'material_name', label: 'Material', render: r => <strong style={{ color: 'var(--text-primary)' }}>{r.material_name}</strong> },
              { key: 'quantity', label: 'Qty', render: r => r.quantity ?? '—' },
              { key: 'unit', label: 'Unit' },
              { key: 'unit_price', label: 'Unit Price', render: r => fmt(r.unit_price) },
              { key: 'total_cost', label: 'Total Cost', render: r => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(r.total_cost)}</span> },
              { key: 'usage_date', label: 'Date', render: r => fmtDate(r.usage_date) },
              { key: 'actions', label: 'Actions', render: r => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-icon" onClick={() => openEditModal('materials', r)} title="Edit"><HiOutlinePencil /></button>
                  <button className="btn-icon" onClick={() => setDeleteTarget({ type: 'materials', row: r })} title="Delete"><HiOutlineTrash color="var(--danger)" /></button>
                </div>
              )}
            ]}
            rows={material_usage}
          />
        )}

        {activeTab === 'manpower' && (
          <SimpleTable
            emptyMsg="No manpower usage recorded for this project."
            columns={[
              { key: 'worker_name', label: 'Worker', render: r => <strong style={{ color: 'var(--text-primary)' }}>{r.worker_name}</strong> },
              { key: 'work_days', label: 'Days' },
              { key: 'daily_rate', label: 'Daily Rate', render: r => fmt(r.daily_rate) },
              { key: 'total_cost', label: 'Total Cost', render: r => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(r.total_cost)}</span> },
              { key: 'work_date', label: 'Date', render: r => fmtDate(r.work_date) },
              { key: 'actions', label: 'Actions', render: r => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-icon" onClick={() => openEditModal('manpower', r)} title="Edit"><HiOutlinePencil /></button>
                  <button className="btn-icon" onClick={() => setDeleteTarget({ type: 'manpower', row: r })} title="Delete"><HiOutlineTrash color="var(--danger)" /></button>
                </div>
              )}
            ]}
            rows={manpower_usage}
          />
        )}

        {activeTab === 'machines' && (
          <SimpleTable
            emptyMsg="No machine usage recorded for this project."
            columns={[
              { key: 'machine_name', label: 'Machine', render: r => <strong style={{ color: 'var(--text-primary)' }}>{r.machine_name}</strong> },
              { key: 'usage_hours', label: 'Hours' },
              { key: 'hourly_rate', label: 'Hourly Rate', render: r => fmt(r.hourly_rate) },
              { key: 'total_cost', label: 'Total Cost', render: r => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(r.total_cost)}</span> },
              { key: 'usage_date', label: 'Date', render: r => fmtDate(r.usage_date) },
              { key: 'actions', label: 'Actions', render: r => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-icon" onClick={() => openEditModal('machines', r)} title="Edit"><HiOutlinePencil /></button>
                  <button className="btn-icon" onClick={() => setDeleteTarget({ type: 'machines', row: r })} title="Delete"><HiOutlineTrash color="var(--danger)" /></button>
                </div>
              )}
            ]}
            rows={machine_usage}
          />
        )}
        </div>
      )}

      {/* ── SECTION 4: Team ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <SectionHeader icon={HiOutlineUserGroup} title="Project Team" color="#3b82f6" />
        <SimpleTable
          emptyMsg="No team members assigned to this project."
          columns={[
            { key: 'user_name', label: 'Name', render: r => <strong style={{ color: 'var(--text-primary)' }}>{r.user_name}</strong> },
            { key: 'role', label: 'Role', render: r => <span className={`badge badge-${r.role === 'admin' ? 'overdue' : r.role === 'manager' ? 'on_hold' : 'active'}`}>{r.role}</span> },
            { key: 'assigned_date', label: 'Assigned On', render: r => fmtDate(r.assigned_date) },
          ]}
          rows={team}
        />
      </div>

      {/* ── SECTION 5: Billing & Invoices ── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 20 }}>
          <SectionHeader icon={HiOutlineDocumentText} title="Billing & Invoices" color="#a78bfa" />
          <SimpleTable
            emptyMsg="No invoices raised for this project."
            columns={[
              { key: 'invoice_number', label: 'Invoice No', render: r => <code style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{r.invoice_number}</code> },
              { key: 'amount', label: 'Amount', render: r => <span style={{ fontWeight: 700 }}>{fmt(r.amount)}</span> },
              { key: 'status', label: 'Status', render: r => {
                const map = { paid: 'active', sent: 'on_hold', draft: 'draft', overdue: 'overdue' };
                return <span className={`badge badge-${map[r.status] || 'draft'}`}>{r.status}</span>;
              }},
              { key: 'due_date', label: 'Due Date', render: r => {
                const isOverdue = r.status !== 'paid' && r.due_date && new Date(r.due_date) < new Date();
                return <span style={{ color: isOverdue ? 'var(--danger)' : undefined }}>{fmtDate(r.due_date)}</span>;
              }},
            ]}
            rows={billing}
          />
        </div>
      )}

      {/* ── SECTION 6: Expenses ── */}
      {isManager && (
        <div className="card" style={{ marginBottom: 20 }}>
          <SectionHeader icon={HiOutlineClipboardList} title="Expenses" color="#f59e0b" />
          <SimpleTable
            emptyMsg="No expenses recorded for this project."
            columns={[
              { key: 'category_name', label: 'Category', render: r => <span className="badge badge-draft">{r.category_name}</span> },
              { key: 'description', label: 'Description', render: r => r.description || '—' },
              { key: 'amount', label: 'Amount', render: r => <span style={{ fontWeight: 700, color: 'var(--danger)' }}>{fmt(r.amount)}</span> },
              { key: 'expense_date', label: 'Date', render: r => fmtDate(r.expense_date) },
            ]}
            rows={expenses}
          />
        </div>
      )}
      {/* ── Modals for Adding/Editing Resources ── */}
      <Modal
        isOpen={activeModal === 'materials'}
        onClose={() => setActiveModal(null)}
        title={editingRow ? 'Edit Material Usage' : 'Add Material Usage'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-premium" onClick={() => handleResourceSubmit('materials')}>{editingRow ? 'Update' : 'Save'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Material *</label>
          {editingRow ? (
            <input className="form-input" disabled value={editingRow.material_name || ''} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} />
          ) : (
            <select className="form-select" name="material_id" value={formMaterial.material_id} onChange={handleChangeMaterial}>
              <option value="">Select a material</option>
              {masterMaterials.map(m => <option key={m.material_id} value={m.material_id}>{m.material_name}</option>)}
            </select>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Quantity *</label>
            <input className="form-input" type="number" name="quantity" value={formMaterial.quantity} onChange={handleChangeMaterial} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Price (₹) *</label>
            <input className="form-input" type="number" name="unit_price" value={formMaterial.unit_price} onChange={handleChangeMaterial} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" name="usage_date" value={formMaterial.usage_date} onChange={handleChangeMaterial} />
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'manpower'}
        onClose={() => setActiveModal(null)}
        title={editingRow ? 'Edit Manpower Usage' : 'Add Manpower Usage'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-premium" onClick={() => handleResourceSubmit('manpower')}>{editingRow ? 'Update' : 'Save'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Worker *</label>
          {editingRow ? (
            <input className="form-input" disabled value={editingRow.worker_name || ''} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} />
          ) : (
            <select className="form-select" name="worker_id" value={formManpower.worker_id} onChange={handleChangeManpower}>
              <option value="">Select a worker</option>
              {masterWorkers.map(w => <option key={w.worker_id} value={w.worker_id}>{w.name}</option>)}
            </select>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Work Days *</label>
            <input className="form-input" type="number" name="work_days" value={formManpower.work_days} onChange={handleChangeManpower} placeholder="1.0" />
          </div>
          <div className="form-group">
            <label className="form-label">Daily Rate (₹) *</label>
            <input className="form-input" type="number" name="daily_rate" value={formManpower.daily_rate} onChange={handleChangeManpower} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" name="work_date" value={formManpower.work_date} onChange={handleChangeManpower} />
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'machines'}
        onClose={() => setActiveModal(null)}
        title={editingRow ? 'Edit Machine Usage' : 'Add Machine Usage'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
          <button className="btn-premium" onClick={() => handleResourceSubmit('machines')}>{editingRow ? 'Update' : 'Save'}</button>
        </>}
      >
        <div className="form-group">
          <label className="form-label">Machine *</label>
          {editingRow ? (
            <input className="form-input" disabled value={editingRow.machine_name || ''} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }} />
          ) : (
            <select className="form-select" name="machine_id" value={formMachine.machine_id} onChange={handleChangeMachine}>
              <option value="">Select a machine</option>
              {masterMachines.map(m => <option key={m.machine_id} value={m.machine_id}>{m.machine_name}</option>)}
            </select>
          )}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Usage Hours *</label>
            <input className="form-input" type="number" name="usage_hours" value={formMachine.usage_hours} onChange={handleChangeMachine} placeholder="1.0" />
          </div>
          <div className="form-group">
            <label className="form-label">Hourly Rate (₹) *</label>
            <input className="form-input" type="number" name="hourly_rate" value={formMachine.hourly_rate} onChange={handleChangeMachine} placeholder="0" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" name="usage_date" value={formMachine.usage_date} onChange={handleChangeMachine} />
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Delete">
        <DeleteConfirm 
          itemName={
            deleteTarget?.type === 'materials' ? 'Material Usage' :
            deleteTarget?.type === 'manpower' ? 'Manpower Usage' :
            'Machine Usage'
          }
          onConfirm={handleResourceDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      </Modal>
    </div>
  );
}
