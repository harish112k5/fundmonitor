import React, { useEffect, useState } from 'react';
import API from '../api';
import { formatCurrency } from '../utils/currencyFormat';
import toast from 'react-hot-toast';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

export default function FinancialDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    API.get('/projects')
      .then(res => {
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(res.data[0].project_id);
        }
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      API.get(`/finance/dashboard/${selectedProject}`)
        .then(res => setData(res.data))
        .catch(() => toast.error('Failed to load financial data'))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !data) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const kpiCards = data ? [
    { label: 'Total Revenue (Paid)', value: formatCurrency(data.metrics.totalRevenue), sub: `Pending: ${formatCurrency(data.metrics.pendingRevenue)}`, color: '#10B981', icon: '💰' },
    { label: 'Total Costs', value: formatCurrency(data.metrics.totalCosts), sub: 'All expenses & usage', color: '#EF4444', icon: '📊' },
    { label: 'Net Profit', value: formatCurrency(data.metrics.netProfit), sub: 'Revenue − Costs', color: data.metrics.netProfit >= 0 ? '#10B981' : '#EF4444', icon: '📈' },
    { label: 'ROI', value: `${data.metrics.roi}%`, sub: `Total Funding: ${formatCurrency(data.metrics.totalFunding)}`, color: '#7C3AED', icon: '🎯' },
    { label: 'IRR', value: `${data.metrics.irr}%`, sub: 'Est. over project lifetime', color: '#F59E0B', icon: '📉' },
  ] : [];

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Financial Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Key financial metrics and profitability</p>
        </div>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: '8px', minWidth: '200px',
            backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-input)',
            color: 'var(--text-primary)', fontSize: '14px', flexShrink: 0
          }}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
        </select>
      </div>

      {data && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {kpiCards.map((card, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${card.color}`,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: 'var(--shadow)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {card.label}
                  </span>
                  <span style={{ fontSize: '20px' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: card.color, marginBottom: '4px' }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* Trend Chart */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
                📈 Monthly Revenue vs Costs
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(value) => '₹' + (value/100000).toFixed(1) + 'L'} />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#ef4444" name="Costs" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Pie */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '12px', padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
                🍩 Cost Breakdown
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={data.costBreakdown.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.costBreakdown.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
}
