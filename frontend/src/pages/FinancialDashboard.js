import React, { useEffect, useState } from 'react';
import API from '../api';
import { formatCurrency } from '../utils/currencyFormat';
import toast from 'react-hot-toast';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineCash, HiOutlineChartPie } from 'react-icons/hi';

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

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Dashboard</h1>
          <p>Key financial metrics and profitability</p>
        </div>
        <div>
          <select 
            className="form-select" 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{ minWidth: '250px', background: 'var(--bg-input)' }}
          >
            {projects.map(p => (
              <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
            ))}
          </select>
        </div>
      </div>

      {data && (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', display: 'grid', gap: '20px', marginBottom: '24px' }}>
            <div className="redesign-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3>Total Revenue (Paid)</h3>
              <div className="card-value-text">{formatCurrency(data.metrics.totalRevenue)}</div>
              <p className="card-sub-text">Pending: {formatCurrency(data.metrics.pendingRevenue)}</p>
            </div>
            
            <div className="redesign-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h3>Total Costs</h3>
              <div className="card-value-text">{formatCurrency(data.metrics.totalCosts)}</div>
              <p className="card-sub-text">All expenses & usage</p>
            </div>

            <div className="redesign-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h3>Net Profit</h3>
              <div className="card-value-text" style={{ color: data.metrics.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                {formatCurrency(data.metrics.netProfit)}
              </div>
              <p className="card-sub-text">Revenue - Costs</p>
            </div>

            <div className="redesign-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <h3>ROI (Return on Investment)</h3>
              <div className="card-value-text">{data.metrics.roi}%</div>
              <p className="card-sub-text">Total Funding: {formatCurrency(data.metrics.totalFunding)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            
            {/* Trend Chart */}
            <div className="redesign-card">
              <h3 style={{ marginBottom: '16px' }}><HiOutlineTrendingUp /> Monthly Cash Flow & Profit Trend</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={data.trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" tickFormatter={(value) => '₹' + (value/100000).toFixed(1) + 'L'} />
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" strokeWidth={2} />
                    <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Costs" strokeWidth={2} />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Net Profit" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Pie */}
            <div className="redesign-card">
              <h3 style={{ marginBottom: '16px' }}><HiOutlineChartPie /> Cost Breakdown</h3>
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
                    <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                    <Legend />
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
