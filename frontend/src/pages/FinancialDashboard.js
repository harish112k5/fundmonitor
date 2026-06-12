import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const PIE_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function FinancialDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

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
      Promise.all([
        API.get(`/finance/dashboard/${selectedProject}`),
        API.get('/dashboard/recent') // We will use this to get recent transactions
      ])
      .then(([dashboardRes, recentRes]) => {
        setData(dashboardRes.data);
        if (recentRes.data && recentRes.data.recentExpenses) {
          // Filter for selected project if possible, though /recent might return overall
          setRecentTransactions(recentRes.data.recentExpenses.filter(e => e.project_id === parseInt(selectedProject)).slice(0, 10));
        }
      })
      .catch(() => toast.error('Failed to load financial data'))
      .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !data) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  const kpiCards = data ? [
    { label: 'Total Revenue (Paid)', value: fmt(data.metrics.totalRevenue), sub: `Pending: ${fmt(data.metrics.pendingRevenue)}`, color: '#10B981', icon: '💰' },
    { label: 'Total Costs', value: fmt(data.metrics.totalCosts), sub: 'All expenses & usage', color: '#EF4444', icon: '📊' },
    { label: 'Net Profit', value: fmt(data.metrics.netProfit), sub: 'Revenue − Costs', color: data.metrics.netProfit >= 0 ? '#10B981' : '#EF4444', icon: '📈' },
    { label: 'ROI', value: `${data.metrics.roi}%`, sub: `Total Funding: ${fmt(data.metrics.totalFunding)}`, color: '#7C3AED', icon: '🎯' },
    { label: 'IRR', value: `${data.metrics.irr}%`, sub: 'Est. over project lifetime', color: '#F59E0B', icon: '📉' },
  ] : [];

  return (
    <div style={{
      backgroundColor: 'var(--bg-page)',
      minHeight: '100vh',
      padding: '24px',
      color: 'var(--text-primary)'
    }}>

      {/* PAGE HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'nowrap'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Financial Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Financial health and profitability metrics
          </p>
        </div>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{
            padding: '9px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-input)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            minWidth: '200px',
            flexShrink: 0
          }}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
        </select>
      </div>

      {data && (
        <>
          {/* ROW 1: KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {kpiCards.map((card, i) => (
              <div key={i} style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${card.color}`,
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {card.label}
                  </span>
                  <span style={{ fontSize: '20px' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: card.color }}>{card.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          {/* ROW 2: CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            
            {/* Trend Chart */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Monthly Revenue vs Costs</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(value) => '₹' + (value/100000).toFixed(1) + 'L'} />
                    <Tooltip 
                      formatter={(value) => fmt(value)} 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                    <Bar dataKey="cost" fill="#EF4444" name="Costs" radius={[4,4,0,0]} />
                    <Bar dataKey="revenue" fill="#10B981" name="Revenue" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Pie */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Cost Breakdown</h3>
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
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => fmt(value)} 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
                    />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>

          {/* ROW 3: RECENT TRANSACTIONS TABLE */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Recent Transactions</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Category</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Type</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length > 0 ? recentTransactions.map((tx, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{new Date(tx.expense_date || tx.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{tx.category_name || 'Expense'}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ backgroundColor: '#EF444422', color: '#EF4444', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>Expense</span>
                      </td>
                      <td style={{ padding: '12px 10px', color: '#EF4444', fontWeight: '600' }}>- {fmt(tx.amount)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" style={{ padding: '12px 10px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent transactions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </div>
  );
}
