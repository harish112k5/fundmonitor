import React, { useEffect, useState, useCallback } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import Modal from '../components/Modal';
import DeleteConfirm from '../components/DeleteConfirm';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus, HiOutlineSearch, HiOutlineRefresh, HiOutlineX,
  HiOutlinePencil, HiOutlineTrash, HiOutlineEye, HiOutlineCurrencyRupee,
  HiOutlineChartBar,
} from 'react-icons/hi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── Colors ───────────────────────────────────────────────────────────────────
const AMBER = '#F59E0B';
const GREEN = '#16A34A';
const RED   = '#DC2626';
const BLUE  = '#0284C7';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt    = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

// ─── Status metadata ──────────────────────────────────────────────────────────
const STATUS_META = {
  'Planned':     { bg: 'rgba(2,132,199,0.15)',  color: '#38BDF8' },
  'In Progress': { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B' },
  'Completed':   { bg: 'rgba(22,163,74,0.15)',  color: '#4ADE80' },
  'On Hold':     { bg: 'rgba(220,38,38,0.12)',  color: '#F87171' },
};

const CATEGORIES = [
  'Foundation', 'Structure', 'Masonry', 'Roofing', 'Plumbing',
  'Electrical', 'Flooring', 'Painting', 'Finishing', 'Excavation', 'Civil Work', 'Other'
];

// ─── Resource type config ─────────────────────────────────────────────────────
const RES_TYPES = [
  { key: 'Material',  label: 'Materials',  color: '#8B5CF6', icon: '🧱' },
  { key: 'Manpower',  label: 'Manpower',   color: '#0284C7', icon: '👷' },
  { key: 'Machinery', label: 'Machinery',  color: '#F59E0B', icon: '🚜' },
];

// ─── Mini components ──────────────────────────────────────────────────────────
function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META['Planned'];
  return (
    <span style={{
      background: m.bg, color: m.color,
      fontSize: 10, fontWeight: 700, padding: '3px 8px',
      borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap'
    }}>{status}</span>
  );
}

function ProgressRing({ pct, size = 42 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash  = (Math.min(100, pct || 0) / 100) * circ;
  const color = pct >= 100 ? GREEN : pct > 50 ? AMBER : BLUE;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2A2A2A" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 9, fontWeight: 700, color
      }}>{Math.round(pct || 0)}%</div>
    </div>
  );
}

function UsageBar({ budget, actual }) {
  const b = parseFloat(budget) || 0;
  const a = parseFloat(actual) || 0;
  if (b === 0) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>;
  const pct  = Math.min(120, (a / b) * 100);
  const over = a > b;
  return (
    <div>
      <div style={{ background: '#2A2A2A', borderRadius: 3, height: 5, overflow: 'hidden', position: 'relative' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 3, transition: 'width 0.5s',
          background: a === 0 ? '#374151' : over ? RED : GREEN }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
        {a === 0 ? 'No actual yet' : over
          ? <span style={{ color: '#F87171' }}>+{fmtPct((a-b)/b*100)} over</span>
          : <span style={{ color: '#4ADE80' }}>{fmtPct(pct)} used</span>}
      </div>
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const emptyForm = {
  project_id: '', activity_name: '', activity_category: '',
  description: '', planned_budget: '', start_date: '', end_date: '', status: 'Planned',
};
const emptyAlloc = {
  resource_type: 'Material', resource_name: '', planned_quantity: '', planned_unit: 'unit', planned_unit_cost: ''
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function BudgetActual() {
  const [activities, setActivities] = useState([]);
  const [kpis, setKpis]             = useState({ totalBudget: 0, totalActual: 0, totalProfit: 0, overallMargin: 0 });
  const [projects, setProjects]     = useState([]);
  const [materials, setMaterials]   = useState([]);
  const [machines, setMachines]     = useState([]);
  const [workerRoles, setWorkerRoles] = useState([]);
  const [loading, setLoading]       = useState(true);

  // Filters
  const [search, setSearch]                 = useState('');
  const [filterProject, setFilterProject]   = useState('');
  const [filterStatus, setFilterStatus]     = useState('');

  // Modals
  const [showForm, setShowForm]     = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Form state
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(emptyForm);
  const [allocations, setAllocations] = useState([]);

  // Actual modal state
  const [selectedAct, setSelectedAct]       = useState(null);
  const [plannedAllocs, setPlannedAllocs]   = useState([]);
  const [actualEntries, setActualEntries]   = useState({ Material: '', Manpower: '', Machinery: '' });
  const [actualMeta, setActualMeta]         = useState({
    completion_percentage: 0, status: 'In Progress',
    notes: '', entry_date: new Date().toISOString().slice(0, 10)
  });

  // Detail
  const [detail, setDetail]   = useState(null);
  const [history, setHistory] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);

  // ── Load masters once ────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      API.get('/projects'), API.get('/materials'),
      API.get('/machines'), API.get('/worker-roles'),
    ]).then(([p, m, mc, wr]) => {
      setProjects(p.data); setMaterials(m.data);
      setMachines(mc.data); setWorkerRoles(wr.data);
    }).catch(() => {});
  }, []);

  // ── Load activities + KPIs ───────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterProject) params.set('project_id', filterProject);
    if (filterStatus)  params.set('status', filterStatus);
    if (search)        params.set('search', search);
    Promise.all([
      API.get(`/budget-actual/activities?${params}`),
      API.get('/budget-actual/dashboard'),
    ]).then(([acts, dash]) => {
      setActivities(acts.data);
      setKpis(dash.data.kpis || {});
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  }, [filterProject, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  // ── Allocation helpers ────────────────────────────────────────────────────
  const totalAllocBudget = allocations.reduce(
    (s, a) => s + (parseFloat(a.planned_quantity) || 0) * (parseFloat(a.planned_unit_cost) || 0), 0
  );
  const addAlloc = () => setAllocations([...allocations, { ...emptyAlloc }]);
  const removeAlloc = (i) => setAllocations(allocations.filter((_, idx) => idx !== i));
  const updateAlloc = (i, field, val) => {
    const next = [...allocations];
    next[i] = { ...next[i], [field]: val };
    setAllocations(next);
  };

  // ── Create / Edit ─────────────────────────────────────────────────────────
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setAllocations([]); setShowForm(true); };

  const openEdit = async (act) => {
    setEditingId(act.activity_id);
    setForm({
      project_id: act.project_id, activity_name: act.activity_name,
      activity_category: act.activity_category || '', description: act.description || '',
      planned_budget: act.planned_budget, start_date: act.start_date ? act.start_date.slice(0, 10) : '',
      end_date: act.end_date ? act.end_date.slice(0, 10) : '', status: act.status,
    });
    try {
      const r = await API.get(`/budget-actual/activities/${act.activity_id}/allocations`);
      setAllocations(r.data);
    } catch { setAllocations([]); }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.project_id)      { toast.error('Select a project'); return; }
    if (!form.activity_name)   { toast.error('Activity name is required'); return; }
    const budget = parseFloat(form.planned_budget) || totalAllocBudget;
    if (budget <= 0)           { toast.error('Enter a planned budget or add resource allocations'); return; }
    setSaving(true);
    try {
      const payload = { ...form, planned_budget: budget, allocations };
      if (editingId) {
        await API.put(`/budget-actual/activities/${editingId}`, payload);
        toast.success('Activity updated');
      } else {
        await API.post('/budget-actual/activities', payload);
        toast.success('Activity created');
      }
      setShowForm(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  // ── Update Actual modal ───────────────────────────────────────────────────
  const openActual = async (act) => {
    setSelectedAct(act);
    setActualEntries({ Material: '', Manpower: '', Machinery: '' });
    setActualMeta({
      completion_percentage: act.progress_percentage || 0,
      status: act.status === 'Planned' ? 'In Progress' : act.status,
      notes: '', entry_date: new Date().toISOString().slice(0, 10),
    });
    setPlannedAllocs([]);
    setShowActual(true);
    try {
      const r = await API.get(`/budget-actual/activities/${act.activity_id}/allocations`);
      setPlannedAllocs(r.data);
    } catch {}
  };

  // Compute planned totals per resource type
  const plannedByType = (type) =>
    plannedAllocs.filter(a => a.resource_type === type)
      .reduce((s, a) => s + parseFloat(a.planned_total_cost || 0), 0);

  const totalActualEntered = Object.values(actualEntries).reduce((s, v) => s + (parseFloat(v) || 0), 0);

  const handleActualSave = async () => {
    if (totalActualEntered <= 0) {
      toast.error('Enter at least one actual cost amount'); return;
    }
    setSaving(true);
    // Build resource_usage from entries
    const resource_usage = Object.entries(actualEntries)
      .filter(([, val]) => parseFloat(val) > 0)
      .map(([type, val]) => ({
        resource_type: type, resource_name: `${type} (Direct Entry)`,
        actual_quantity: 1, actual_unit_cost: parseFloat(val),
        actual_total_cost: parseFloat(val),
      }));
    try {
      await API.post(`/budget-actual/activities/${selectedAct.activity_id}/progress`, {
        ...actualMeta, resource_usage,
        actual_work_hours: 0,
        actual_completion_percentage: actualMeta.completion_percentage,
        actual_status: actualMeta.status,
        progress_date: actualMeta.entry_date,
      });
      toast.success('Actual costs saved!');
      setShowActual(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  // ── Detail view ───────────────────────────────────────────────────────────
  const openDetail = async (act) => {
    setSelectedAct(act); setDetail(null); setHistory([]);
    setShowDetail(true);
    try {
      const [det, hist] = await Promise.all([
        API.get(`/budget-actual/activities/${act.activity_id}`),
        API.get(`/budget-actual/activities/${act.activity_id}/history`),
      ]);
      setDetail(det.data); setHistory(hist.data || []);
    } catch {}
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await API.delete(`/budget-actual/activities/${deleteTarget.activity_id}`);
      toast.success('Deleted'); setShowDelete(false); load();
    } catch { toast.error('Delete failed'); }
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = activities.slice(0, 8).map(a => ({
    name: a.activity_name.length > 10 ? a.activity_name.slice(0, 10) + '…' : a.activity_name,
    Budget: parseFloat(a.planned_budget) || 0,
    Actual: parseFloat(a.actual_cost) || 0,
  }));
  const withActual = activities.filter(a => parseFloat(a.actual_cost) > 0);
  const pieData = [
    { name: 'Under Budget', value: withActual.filter(a => parseFloat(a.profit_loss) > 0).length },
    { name: 'Over Budget',  value: withActual.filter(a => parseFloat(a.profit_loss) <= 0).length },
  ].filter(d => d.value > 0);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      <AnimatedItem delay={0}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="page-header">
          <div className="page-header-left">
            <h1>Budget vs Actual</h1>
            <p>Plan budgets by resource type, then track actual costs to measure profitability</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> New Activity</button>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────────────── */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', marginBottom: 24 }}>
          {[
            { label: 'Total Budget',  value: fmt(kpis.totalBudget),  icon: '💰', color: AMBER, sub: `${activities.length} activities` },
            { label: 'Total Actual',  value: fmt(kpis.totalActual),  icon: '📊', color: BLUE,  sub: `${withActual.length} with actual` },
            { label: 'Total Profit',  value: kpis.totalActual > 0 ? fmt(kpis.totalProfit) : '—',
              icon: kpis.totalProfit >= 0 ? '✅' : '⚠️',
              color: kpis.totalActual > 0 ? (kpis.totalProfit >= 0 ? GREEN : RED) : 'var(--text-muted)',
              sub: kpis.totalActual > 0 ? (kpis.totalProfit >= 0 ? 'Under budget' : 'Over budget') : 'No data yet' },
            { label: 'Profit Margin', value: kpis.totalActual > 0 ? fmtPct(kpis.overallMargin) : '—',
              icon: '📈', color: kpis.totalActual > 0 ? AMBER : 'var(--text-muted)', sub: 'Overall' },
          ].map((c, i) => (
            <div key={c.label} className="stat-card" style={{ animationDelay: `${i*0.08}s` }}>
              <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>{c.icon}</div>
              <div className="stat-info">
                <div className="stat-label">{c.label}</div>
                <div className="stat-value" style={{ fontSize: 20, color: c.color }}>{c.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center',
          background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 8, padding: '10px 14px'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 14 }} />
            <input placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', background: '#2A2A2A', border: '1px solid #374151', borderRadius: 6,
                padding: '7px 12px 7px 32px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <select className="form-select" value={filterProject} onChange={e => setFilterProject(e.target.value)}
            style={{ minWidth: 150, fontSize: 13, height: 34 }}>
            <option value="">All Projects</option>
            {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
          </select>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ minWidth: 130, fontSize: 13, height: 34 }}>
            <option value="">All Status</option>
            {['Planned','In Progress','Completed','On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterProject || filterStatus) && (
            <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterProject(''); setFilterStatus(''); }}>
              <HiOutlineX /> Clear
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={load}><HiOutlineRefresh /></button>
        </div>

        {/* ── Table ────────────────────────────────────────────────────── */}
        <div className="table-container" style={{ marginBottom: 24 }}>
          {loading ? (
            <div style={{ padding: 56, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} /> Loading…
            </div>
          ) : activities.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🏗️</div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>No activities yet.</p>
              <button className="btn btn-primary" onClick={openCreate}><HiOutlinePlus /> Create First Activity</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: 160 }}>Activity</th>
                    <th>Project</th>
                    <th style={{ textAlign: 'right' }}>Budget</th>
                    <th style={{ textAlign: 'right' }}>Actual</th>
                    <th style={{ textAlign: 'right' }}>Profit/Loss</th>
                    <th style={{ textAlign: 'right' }}>Margin</th>
                    <th style={{ minWidth: 100 }}>Usage</th>
                    <th style={{ textAlign: 'center' }}>Progress</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center', minWidth: 140 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(act => {
                    const profit  = parseFloat(act.profit_loss) || 0;
                    const hasData = parseFloat(act.actual_cost) > 0;
                    return (
                      <tr key={act.activity_id}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        style={{ transition: 'background 0.15s' }}
                      >
                        <td>
                          <button onClick={() => openDetail(act)} style={{
                            background: 'none', border: 'none', color: AMBER, fontWeight: 700,
                            fontSize: 13, cursor: 'pointer', padding: 0, textAlign: 'left'
                          }}>{act.activity_name}</button>
                          {act.activity_category && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{act.activity_category}</div>
                          )}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 130 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.project_name}</div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{fmt(act.planned_budget)}</td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          {hasData ? (
                            <span style={{ fontWeight: 600, color: parseFloat(act.actual_cost) > parseFloat(act.planned_budget) ? RED : 'var(--text-primary)' }}>
                              {fmt(act.actual_cost)}
                            </span>
                          ) : (
                            <button onClick={() => openActual(act)} style={{
                              background: 'rgba(2,132,199,0.1)', border: '1px dashed #0284C7', borderRadius: 5,
                              color: '#38BDF8', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '3px 8px'
                            }}>+ Enter Actual</button>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          {hasData ? <span style={{ fontWeight: 700, color: profit >= 0 ? GREEN : RED }}>{profit >= 0 ? '+' : ''}{fmt(profit)}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td style={{ textAlign: 'right', fontSize: 13 }}>
                          {hasData ? <span style={{ fontWeight: 600, color: profit >= 0 ? GREEN : RED }}>{fmtPct(act.profit_margin)}</span>
                            : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td><UsageBar budget={act.planned_budget} actual={act.actual_cost} /></td>
                        <td style={{ textAlign: 'center' }}><ProgressRing pct={act.progress_percentage || 0} /></td>
                        <td><Badge status={act.status} /></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button title={hasData ? 'Update Actual' : 'Enter Actual'} onClick={() => openActual(act)} style={{
                              background: hasData ? 'rgba(22,163,74,0.12)' : 'rgba(245,158,11,0.12)',
                              border: `1px solid ${hasData ? 'rgba(22,163,74,0.3)' : 'rgba(245,158,11,0.3)'}`,
                              borderRadius: 6, color: hasData ? '#4ADE80' : AMBER,
                              cursor: 'pointer', padding: '5px 8px', fontSize: 12, fontWeight: 600,
                              display: 'flex', alignItems: 'center', gap: 3
                            }}>
                              <HiOutlineCurrencyRupee />
                              <span style={{ fontSize: 10 }}>{hasData ? 'Update' : 'Actual'}</span>
                            </button>
                            <button className="btn-icon" title="View" onClick={() => openDetail(act)} style={{ fontSize: 13 }}><HiOutlineEye /></button>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(act)} style={{ fontSize: 13 }}><HiOutlinePencil /></button>
                            <button className="btn-icon" title="Delete" style={{ fontSize: 13, color: RED }}
                              onClick={() => { setDeleteTarget(act); setShowDelete(true); }}><HiOutlineTrash /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Charts ───────────────────────────────────────────────────── */}
        {activities.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 10, padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Budget vs Actual</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>Top {Math.min(8, activities.length)} activities</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={3} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
                    tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                    axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v, n) => [fmt(v), n]}
                    contentStyle={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: 8, fontSize: 12 }}
                    cursor={{ fill: 'rgba(245,158,11,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Bar dataKey="Budget" name="Budget" fill={AMBER} radius={[4,4,0,0]} maxBarSize={24} />
                  <Bar dataKey="Actual"  name="Actual"  fill={BLUE}  radius={[4,4,0,0]} maxBarSize={24} minPointSize={3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Budget Status</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                {withActual.length > 0 ? `${withActual.length} with actual data` : 'No actual data yet'}
              </div>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" outerRadius={68} innerRadius={30}
                      dataKey="value" nameKey="name" paddingAngle={3}
                      label={({ percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.name === 'Under Budget' ? GREEN : RED} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                      formatter={v => <span style={{ color: 'var(--text-secondary)' }}>{v}</span>} />
                    <Tooltip contentStyle={{ background: '#1A1A1A', border: '1px solid #2D2D2D', borderRadius: 8, fontSize: 12 }}
                      formatter={(v, name) => [`${v} activities`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 160, gap: 10, border: '1px dashed #2D2D2D', borderRadius: 8 }}>
                  <HiOutlineChartBar style={{ fontSize: 32, color: '#374151' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                    Enter actual costs to see budget status
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </AnimatedItem>

      {/* ═══════════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)}
        title={editingId ? 'Edit Activity' : 'Create Activity'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create Activity'}
          </button>
        </>}
      >
        {/* Basic Info */}
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>Activity Details</SectionTitle>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Activity Name <Req /></label>
              <input className="form-input" placeholder="e.g. Foundation Excavation"
                value={form.activity_name} onChange={e => setForm({ ...form, activity_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.activity_category}
                onChange={e => setForm({ ...form, activity_category: e.target.value })}>
                <option value="">Select</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label">Project <Req /></label>
              <select className="form-select" value={form.project_id}
                onChange={e => setForm({ ...form, project_id: e.target.value })}>
                <option value="">Select project</option>
                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {['Planned','In Progress','Completed','On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Resource Allocation */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionTitle noMargin>Resource Allocation
              <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                Budget auto-calculated from allocations
              </span>
            </SectionTitle>
            <button className="btn btn-secondary btn-sm" onClick={addAlloc}><HiOutlinePlus /> Add Resource</button>
          </div>

          {allocations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '18px 0', color: 'var(--text-muted)', fontSize: 12,
              border: '1px dashed #2D2D2D', borderRadius: 8, marginBottom: 12 }}>
              No resources added. Click "Add Resource" to add Materials, Manpower, or Machinery.<br />
              Or enter the budget amount manually below.
            </div>
          )}

          {allocations.map((alloc, i) => {
            const rowTotal = (parseFloat(alloc.planned_quantity)||0) * (parseFloat(alloc.planned_unit_cost)||0);
            return (
              <div key={i} style={{
                background: '#181818', border: '1px solid #2D2D2D', borderRadius: 8,
                padding: '12px 14px', marginBottom: 8,
                borderLeft: `3px solid ${RES_TYPES.find(r=>r.key===alloc.resource_type)?.color||AMBER}`
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {/* Type */}
                  <div style={{ minWidth: 110 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Type</label>
                    <select className="form-select" style={{ fontSize: 12 }} value={alloc.resource_type}
                      onChange={e => updateAlloc(i, 'resource_type', e.target.value)}>
                      {RES_TYPES.map(r => <option key={r.key} value={r.key}>{r.icon} {r.label}</option>)}
                    </select>
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 130 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Resource Name</label>
                    {alloc.resource_type === 'Material' ? (
                      <select className="form-select" style={{ fontSize: 12 }} value={alloc.resource_name}
                        onChange={e => updateAlloc(i, 'resource_name', e.target.value)}>
                        <option value="">Select material</option>
                        {materials.map(m => <option key={m.material_id} value={m.material_name}>{m.material_name}</option>)}
                      </select>
                    ) : alloc.resource_type === 'Machinery' ? (
                      <select className="form-select" style={{ fontSize: 12 }} value={alloc.resource_name}
                        onChange={e => updateAlloc(i, 'resource_name', e.target.value)}>
                        <option value="">Select machine</option>
                        {machines.map(m => <option key={m.machine_id} value={m.machine_name}>{m.machine_name}</option>)}
                      </select>
                    ) : (
                      <select className="form-select" style={{ fontSize: 12 }} value={alloc.resource_name}
                        onChange={e => updateAlloc(i, 'resource_name', e.target.value)}>
                        <option value="">Select role</option>
                        {workerRoles.map(r => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
                      </select>
                    )}
                  </div>
                  {/* Qty */}
                  <div style={{ width: 80 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Qty / Hrs</label>
                    <input className="form-input" type="number" placeholder="0" style={{ fontSize: 12 }}
                      value={alloc.planned_quantity} onChange={e => updateAlloc(i, 'planned_quantity', e.target.value)} />
                  </div>
                  {/* Unit */}
                  <div style={{ width: 72 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Unit</label>
                    <input className="form-input" style={{ fontSize: 12 }} placeholder="unit"
                      value={alloc.planned_unit} onChange={e => updateAlloc(i, 'planned_unit', e.target.value)} />
                  </div>
                  {/* Unit cost */}
                  <div style={{ width: 96 }}>
                    <label className="form-label" style={{ fontSize: 10 }}>Unit Cost (₹)</label>
                    <input className="form-input" type="number" placeholder="0" style={{ fontSize: 12 }}
                      value={alloc.planned_unit_cost} onChange={e => updateAlloc(i, 'planned_unit_cost', e.target.value)} />
                  </div>
                  {/* Total */}
                  <div style={{ minWidth: 80, textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Total</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: AMBER }}>{fmt(rowTotal)}</div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => removeAlloc(i)}><HiOutlineX /></button>
                </div>
              </div>
            );
          })}

          {/* Budget summary / override */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, padding: '10px 14px',
            background: '#181818', borderRadius: 8, border: '1px solid #2D2D2D' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {allocations.length > 0 ? 'Total from allocations' : 'Manual budget entry'}
              </div>
              {allocations.length > 0 && (
                <div style={{ fontSize: 18, fontWeight: 800, color: AMBER }}>{fmt(totalAllocBudget)}</div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: 11 }}>
                Planned Budget (₹) {allocations.length > 0 && <span style={{ color: 'var(--text-muted)' }}>— override</span>}
              </label>
              <input className="form-input" type="number" min={0}
                placeholder={allocations.length > 0 ? String(Math.round(totalAllocBudget)) : '0'}
                value={form.planned_budget}
                onChange={e => setForm({ ...form, planned_budget: e.target.value })}
                style={{ fontWeight: 700, color: AMBER }} />
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          UPDATE ACTUAL MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={showActual} onClose={() => setShowActual(false)}
        title="Update Actual Costs"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowActual(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleActualSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Actual Costs'}
          </button>
        </>}
      >
        {selectedAct && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Activity info bar */}
            <div style={{ background: '#181818', borderRadius: 8, padding: '10px 14px',
              borderLeft: `3px solid ${AMBER}`, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{selectedAct.activity_name}</span>
              {' · '}{selectedAct.project_name}
              {selectedAct.activity_category && ` · ${selectedAct.activity_category}`}
            </div>

            {/* ── Budget vs Actual side-by-side breakdown ── */}
            <div>
              <SectionTitle>Budget vs Actual by Resource Type</SectionTitle>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #2D2D2D' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#1A1A1A',
                  padding: '8px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <div>Resource Type</div>
                  <div style={{ textAlign: 'right' }}>Planned Budget</div>
                  <div style={{ textAlign: 'right' }}>Actual Spent (₹)</div>
                  <div style={{ textAlign: 'right' }}>Variance</div>
                </div>

                {RES_TYPES.map(rt => {
                  const planned = plannedByType(rt.key);
                  const actual  = parseFloat(actualEntries[rt.key]) || 0;
                  const diff    = planned - actual;
                  const hasPlan = planned > 0;
                  return (
                    <div key={rt.key} style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                      alignItems: 'center', padding: '12px 16px',
                      borderTop: '1px solid #2D2D2D',
                      background: actualEntries[rt.key] ? 'rgba(2,132,199,0.03)' : 'transparent'
                    }}>
                      {/* Type label */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 14,
                          background: `${rt.color}18`, border: `1px solid ${rt.color}33` }}>
                          {rt.icon}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-primary)' }}>{rt.label}</div>
                          {hasPlan && (
                            <div style={{ fontSize: 10, color: rt.color }}>
                              {plannedAllocs.filter(a => a.resource_type === rt.key).length} item(s)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Planned */}
                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14,
                        color: hasPlan ? AMBER : 'var(--text-muted)' }}>
                        {hasPlan ? fmt(planned) : <span style={{ fontSize: 11 }}>Not allocated</span>}
                      </div>

                      {/* Actual input */}
                      <div style={{ paddingLeft: 12 }}>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                            fontSize: 12, fontWeight: 700, color: BLUE }}>₹</span>
                          <input type="number" min={0} placeholder="0"
                            value={actualEntries[rt.key]}
                            onChange={e => setActualEntries({ ...actualEntries, [rt.key]: e.target.value })}
                            style={{
                              width: '100%', background: '#1E1E1E', border: '1px solid #374151',
                              borderRadius: 6, padding: '7px 10px 7px 24px', color: BLUE,
                              fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box',
                              borderColor: actualEntries[rt.key] ? '#0284C7' : '#374151'
                            }} />
                        </div>
                      </div>

                      {/* Variance */}
                      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 600 }}>
                        {actual > 0 && hasPlan ? (
                          <span style={{ color: diff >= 0 ? GREEN : RED }}>
                            {diff >= 0 ? '+' : ''}{fmt(diff)}
                          </span>
                        ) : actual > 0 ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>No budget set</span>
                        ) : (
                          <span style={{ color: '#374151' }}>—</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  alignItems: 'center', padding: '12px 16px',
                  borderTop: '2px solid #374151', background: '#1A1A1A' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>TOTAL</div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 14, color: AMBER }}>
                    {fmt(selectedAct.planned_budget)}
                  </div>
                  <div style={{ paddingLeft: 12, fontWeight: 800, fontSize: 14, color: BLUE }}>
                    {fmt(totalActualEntered)}
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 14 }}>
                    {totalActualEntered > 0 ? (
                      <span style={{ color: (parseFloat(selectedAct.planned_budget) - totalActualEntered) >= 0 ? GREEN : RED }}>
                        {(parseFloat(selectedAct.planned_budget) - totalActualEntered) >= 0 ? '+' : ''}
                        {fmt(parseFloat(selectedAct.planned_budget) - totalActualEntered)}
                      </span>
                    ) : <span style={{ color: '#374151' }}>—</span>}
                  </div>
                </div>
              </div>

              {/* Live variance badge */}
              {totalActualEntered > 0 && (() => {
                const budget = parseFloat(selectedAct.planned_budget) || 0;
                const diff   = budget - totalActualEntered;
                const pct    = budget > 0 ? Math.abs(diff / budget * 100).toFixed(1) : 0;
                return (
                  <div style={{
                    marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: diff >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                    border: `1px solid ${diff >= 0 ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}`,
                    color: diff >= 0 ? '#4ADE80' : '#F87171',
                    display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span>{diff >= 0 ? '✅ Under budget by ' : '⚠️ Over budget by '}{fmt(Math.abs(diff))}</span>
                    <span style={{ opacity: 0.8 }}>Margin: {diff >= 0 ? '+' : '-'}{pct}%</span>
                  </div>
                );
              })()}
            </div>

            {/* Completion & Status */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Work Completion %</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="range" min={0} max={100} step={5}
                    value={actualMeta.completion_percentage}
                    onChange={e => setActualMeta({ ...actualMeta, completion_percentage: e.target.value })}
                    style={{ flex: 1, accentColor: AMBER }} />
                  <div style={{ background: '#2A2A2A', border: '1px solid #374151', borderRadius: 6,
                    padding: '5px 10px', minWidth: 48, textAlign: 'center',
                    fontSize: 13, fontWeight: 700, color: AMBER }}>
                    {actualMeta.completion_percentage}%
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Work Status</label>
                <select className="form-select" value={actualMeta.status}
                  onChange={e => setActualMeta({ ...actualMeta, status: e.target.value })}>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Planned">Planned</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Entry Date</label>
                <input className="form-input" type="date" value={actualMeta.entry_date}
                  onChange={e => setActualMeta({ ...actualMeta, entry_date: e.target.value })} />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                <input className="form-input" placeholder="e.g. Extra cement due to spillage..."
                  value={actualMeta.notes}
                  onChange={e => setActualMeta({ ...actualMeta, notes: e.target.value })} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          DETAIL VIEW
      ══════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)}
        title={selectedAct?.activity_name || 'Activity Detail'}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setShowDetail(false)}>Close</button>
          {selectedAct && <>
            <button className="btn btn-secondary"
              onClick={() => { setShowDetail(false); openActual(selectedAct); }}>
              <HiOutlineCurrencyRupee /> Update Actual
            </button>
            <button className="btn btn-primary"
              onClick={() => { setShowDetail(false); openEdit(selectedAct); }}>
              <HiOutlinePencil /> Edit
            </button>
          </>}
        </>}
      >
        {!detail ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'Planned Budget', value: fmt(detail.activity.planned_budget), color: AMBER },
                { label: 'Actual Cost',    value: parseFloat(detail.activity.actual_cost) > 0 ? fmt(detail.activity.actual_cost) : '—', color: BLUE },
                { label: 'Profit / Loss',  value: parseFloat(detail.activity.actual_cost) > 0 ? fmt(detail.activity.profit_loss) : '—',
                  color: parseFloat(detail.activity.profit_loss) >= 0 ? GREEN : RED },
              ].map(k => (
                <div key={k.label} style={{ background: '#1A1A1A', borderRadius: 8, padding: '12px 14px', borderTop: `3px solid ${k.color}22` }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Resource breakdown (planned) */}
            {detail.allocations?.length > 0 && (
              <div>
                <SectionTitle>Planned Resource Allocation</SectionTitle>
                <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #2D2D2D' }}>
                  {['Material','Manpower','Machinery'].map(type => {
                    const items = detail.allocations.filter(a => a.resource_type === type);
                    if (items.length === 0) return null;
                    const rt = RES_TYPES.find(r => r.key === type);
                    return (
                      <div key={type}>
                        <div style={{ padding: '6px 14px', background: '#1A1A1A', fontSize: 11, fontWeight: 700,
                          color: rt.color, borderTop: '1px solid #2D2D2D' }}>
                          {rt.icon} {rt.label}
                        </div>
                        {items.map((a, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                            padding: '8px 14px', fontSize: 12, borderTop: '1px solid #1F1F1F' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{a.resource_name || '—'}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{a.planned_quantity} {a.planned_unit}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{fmt(a.planned_unit_cost)}/unit</span>
                            <span style={{ fontWeight: 700, color: AMBER }}>{fmt(a.planned_total_cost)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progress history */}
            {history.length > 0 && (
              <div>
                <SectionTitle>Update History ({history.length})</SectionTitle>
                <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.map(h => (
                    <div key={h.progress_id} style={{ background: '#1A1A1A', borderRadius: 6, padding: '8px 12px',
                      borderLeft: `3px solid ${AMBER}`, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.actual_completion_percentage}% complete</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{h.progress_date?.slice(0,10)}</span>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Status: <span style={{ color: 'var(--text-secondary)' }}>{h.actual_status}</span>
                        {h.recorded_by_name && ` · by ${h.recorded_by_name}`}
                        {h.notes && <div style={{ marginTop: 2, fontStyle: 'italic' }}>"{h.notes}"</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <DeleteConfirm isOpen={showDelete} onClose={() => setShowDelete(false)} onConfirm={handleDelete}
        message={`Delete "${deleteTarget?.activity_name}"? This cannot be undone.`} />
    </PageWrapper>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SectionTitle({ children, noMargin }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
      color: 'var(--text-muted)', marginBottom: noMargin ? 0 : 10,
      paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)'
    }}>{children}</div>
  );
}
function Req() {
  return <span style={{ color: '#DC2626', marginLeft: 2 }}>*</span>;
}
