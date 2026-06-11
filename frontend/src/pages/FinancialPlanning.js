import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function FinancialPlanning() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    API.get('/projects')
      .then(res => {
        setProjects(res.data);
        if (res.data.length > 0) {
          setSelectedProject(res.data[0].project_id || res.data[0].id);
        }
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      Promise.all([
        API.get(`/dashboard/financial-summary?project_id=${selectedProject}`),
        API.get(`/investments/project/${selectedProject}`),
        API.get(`/loans/project/${selectedProject}`)
      ])
      .then(([dashRes, invRes, loanRes]) => {
        setDashboardData(dashRes.data);
        setInvestments(invRes.data || []);
        setLoans(loanRes.data || []);
      })
      .catch(() => {
        // Fallback if the specific project endpoints fail, try global endpoints and filter
        Promise.all([
          API.get('/investments'),
          API.get('/loans')
        ]).then(([invAll, loanAll]) => {
          setInvestments(invAll.data.filter(i => i.project_id == selectedProject) || []);
          setLoans(loanAll.data.filter(l => l.project_id == selectedProject) || []);
        }).catch(() => toast.error('Failed to load fund details'));
      })
      .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !dashboardData) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  // Calculate logic
  const totalInvestments = investments.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0);
  const totalLoans = loans.reduce((sum, l) => sum + parseFloat(l.principal || 0), 0);
  const totalAvailable = totalInvestments + totalLoans;
  
  const used = dashboardData ? dashboardData.total_cost : 0;
  const remaining = totalAvailable - used;
  const utilPct = totalAvailable > 0 ? (used / totalAvailable) * 100 : 0;

  let cashFlowStatus = 'HEALTHY';
  let cashFlowColor = '#10B981';
  if (remaining < 0) {
    cashFlowStatus = 'DEFICIT — Immediate action needed';
    cashFlowColor = '#EF4444';
  } else if (remaining < totalAvailable * 0.15) {
    cashFlowStatus = 'LOW — Less than 15% remaining';
    cashFlowColor = '#F59E0B';
  }

  // Chart Data
  const pieData = [
    { name: 'Investors', value: totalInvestments },
    { name: 'Loans', value: totalLoans }
  ].filter(d => d.value > 0);
  const PIE_COLORS = ['#7C3AED', '#3B82F6'];

  const allocData = dashboardData ? [{
    name: 'Allocation',
    materials: dashboardData.material_cost || 0,
    labour: dashboardData.manpower_cost || 0,
    equipment: dashboardData.machine_cost || 0,
    expenses: dashboardData.expense_cost || 0
  }] : [];

  // Table Data
  const fundFlows = [
    ...investments.map(i => ({
      id: `inv-${i.id}`, source: `Investor #${i.investor_id}`, type: 'Investment', amount: parseFloat(i.amount || 0), usedFor: 'General Operations', status: i.status || 'Active'
    })),
    ...loans.map(l => ({
      id: `loan-${l.id}`, source: `Financier #${l.financier_id}`, type: 'Loan', amount: parseFloat(l.principal || 0), usedFor: 'Capital Expenditure', status: 'Active'
    }))
  ].sort((a,b) => b.amount - a.amount);

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Financial Planning</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Fund allocation and sourcing</p>
        </div>
        <select
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-input)', color: 'var(--text-primary)',
            fontSize: '14px', minWidth: '200px', flexShrink: 0
          }}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
        </select>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #3B82F6', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'transform 0.15s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Total Funds Available</span>
            <span style={{ fontSize: '20px' }}>💰</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#3B82F6' }}>{fmt(totalAvailable)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Investors & Loans</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #EF4444', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Funds Used</span>
            <span style={{ fontSize: '20px' }}>📉</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#EF4444' }}>{fmt(used)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total actual cost spent</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `4px solid ${cashFlowColor}`, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Funds Remaining</span>
            <span style={{ fontSize: '20px' }}>⚖️</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: cashFlowColor }}>{fmt(remaining)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{cashFlowStatus}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #7C3AED', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Utilization %</span>
            <span style={{ fontSize: '20px' }}>📊</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#7C3AED' }}>{utilPct.toFixed(1)}%</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Of total funds available</div>
        </div>
      </div>

      {/* ROW 2: CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Pie Chart: Fund Sources */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Fund Sources</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => fmt(value)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Bar Chart: Fund Allocation */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Fund Allocation (Used)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={allocData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(value) => '₹' + (value/100000).toFixed(0) + 'L'} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} width={80} />
                <RechartsTooltip formatter={(value) => fmt(value)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                <Bar dataKey="materials" stackId="a" fill="#7C3AED" name="Materials" radius={[0,0,0,0]} />
                <Bar dataKey="labour" stackId="a" fill="#10B981" name="Labour" radius={[0,0,0,0]} />
                <Bar dataKey="equipment" stackId="a" fill="#F59E0B" name="Equipment" radius={[0,0,0,0]} />
                <Bar dataKey="expenses" stackId="a" fill="#EF4444" name="Expenses" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 3: FUND FLOW TABLE */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Fund Flow Overview</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Source</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Used For</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {fundFlows.length > 0 ? fundFlows.map(flow => (
                <tr key={flow.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{flow.source}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ backgroundColor: flow.type === 'Investment' ? '#7C3AED22' : '#3B82F622', color: flow.type === 'Investment' ? '#7C3AED' : '#3B82F6', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
                      {flow.type}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{fmt(flow.amount)}</td>
                  <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{flow.usedFor}</td>
                  <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{flow.status}</td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No funds found for this project</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
