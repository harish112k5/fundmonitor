import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currencyFormat';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function FinancialForecast() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/projects'),
      API.get('/dashboard/budget-comparison')
    ])
    .then(([projRes, budgetRes]) => {
      setProjects(projRes.data);
      if (projRes.data.length > 0) {
        setSelectedProject(projRes.data[0].project_id || projRes.data[0].id);
      }
      setProjectsData(budgetRes.data);
    })
    .catch(() => toast.error('Failed to load forecasting data'))
    .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  // Find selected project details
  const currentProject = projects.find(p => (p.project_id || p.id) == selectedProject);
  const currentBudgetData = projectsData.find(p => p.project_id == selectedProject);

  // Forecast calculations
  let monthlyBurnRate = 0;
  let monthsSinceStart = 0;
  let monthsRemaining = 0;
  let projectedEndDateStr = 'N/A';
  let riskLevel = 'LOW — On schedule';
  let riskColor = '#10B981';
  let chartData = [];
  
  if (currentProject && currentBudgetData) {
    const startDate = new Date(currentProject.start_date);
    const endDate = new Date(currentProject.end_date);
    const today = new Date();
    
    // Days since start (min 1 to avoid infinity)
    const daysSinceStart = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
    monthsSinceStart = daysSinceStart / 30;
    
    monthlyBurnRate = currentBudgetData.actual / Math.max(1, monthsSinceStart);
    
    const remainingBudget = Math.max(0, currentBudgetData.billable - currentBudgetData.actual);
    monthsRemaining = monthlyBurnRate > 0 ? remainingBudget / monthlyBurnRate : 0;
    
    const projectedEnd = new Date(today.getTime() + (monthsRemaining * 30 * 24 * 60 * 60 * 1000));
    projectedEndDateStr = projectedEnd.toLocaleDateString();

    const diffDays = Math.floor((projectedEnd - endDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      riskLevel = "HIGH — Project will exceed timeline";
      riskColor = "#EF4444";
    } else if (diffDays > -30) {
      riskLevel = "MEDIUM — Close to deadline";
      riskColor = "#F59E0B";
    }

    // Generate Chart Data
    let cumulative = 0;
    for(let i=1; i<=Math.floor(monthsSinceStart); i++) {
      cumulative += monthlyBurnRate;
      chartData.push({ month: `Past M${i}`, actual: cumulative, projected: null });
    }
    
    // Future projection (next 6 months)
    let projCumulative = currentBudgetData.actual;
    chartData.push({ month: 'Now', actual: projCumulative, projected: projCumulative });
    
    for(let i=1; i<=6; i++) {
      projCumulative += monthlyBurnRate;
      chartData.push({ month: `Future M${i}`, actual: null, projected: projCumulative });
    }
  }

  // Compute table data for all projects
  const tableData = projects.map(p => {
    const bData = projectsData.find(bd => bd.project_id == (p.project_id || p.id)) || { actual: 0, billable: 0 };
    const sDate = new Date(p.start_date);
    const eDate = new Date(p.end_date);
    const t = new Date();
    const dSince = Math.max(1, Math.floor((t - sDate) / (1000 * 60 * 60 * 24)));
    const mSince = dSince / 30;
    const brate = bData.actual / Math.max(1, mSince);
    const rem = Math.max(0, bData.billable - bData.actual);
    const mRem = brate > 0 ? rem / brate : 0;
    const pEnd = new Date(t.getTime() + (mRem * 30 * 24 * 60 * 60 * 1000));
    const dDiff = Math.floor((pEnd - eDate) / (1000 * 60 * 60 * 24));
    
    let rLevel = "LOW";
    let rColor = "#10B981";
    if (dDiff > 0) { rLevel = "HIGH"; rColor = "#EF4444"; }
    else if (dDiff > -30) { rLevel = "MEDIUM"; rColor = "#F59E0B"; }

    return {
      id: p.project_id || p.id,
      name: p.project_name || p.name,
      burnRate: brate,
      budgetLeft: rem,
      projectedEnd: pEnd.toLocaleDateString(),
      risk: rLevel,
      riskColor: rColor
    };
  });

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Financial Forecast
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Burn rate and timeline predictions
          </p>
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
          {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
        </select>
      </div>

      {currentProject && (
        <>
          {/* ROW 1: KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #7C3AED', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', transition: 'transform 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Monthly Burn Rate</span>
                <span style={{ fontSize: '20px' }}>🔥</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#7C3AED' }}>{fmt(monthlyBurnRate)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Average monthly spend</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `4px solid ${riskColor}`, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Projected End Date</span>
                <span style={{ fontSize: '20px' }}>📅</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: riskColor }}>{projectedEndDateStr}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Based on current burn rate</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #3B82F6', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Months Remaining</span>
                <span style={{ fontSize: '20px' }}>⏳</span>
              </div>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#3B82F6' }}>{monthsRemaining.toFixed(1)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Before budget is exhausted</div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `4px solid ${riskColor}`, borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Risk Level</span>
                <span style={{ fontSize: '20px' }}>⚠️</span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: riskColor, marginTop: '10px' }}>{riskLevel}</div>
            </div>
          </div>

          {/* ROW 2: LINE CHART */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Actual vs Projected Spending (Cumulative)</h3>
            <div style={{ width: '100%', height: 350 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(value) => '₹' + (value/100000).toFixed(1) + 'L'} />
                  <Tooltip formatter={(value) => fmt(value)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                  <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
                  <Line dataKey="actual" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} name="Actual" connectNulls />
                  <Line dataKey="projected" stroke="#F59E0B" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} name="Projected" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ROW 3: FORECAST TABLE */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Forecast Summary per Project</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Project</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Burn Rate</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Budget Left</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Projected End</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map(row => (
                    <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{row.name}</td>
                      <td style={{ padding: '12px 10px', color: '#EF4444', fontWeight: '600' }}>{fmt(row.burnRate)} / mo</td>
                      <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{fmt(row.budgetLeft)}</td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{row.projectedEnd}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ backgroundColor: row.riskColor + '22', color: row.riskColor, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600' }}>
                          {row.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
