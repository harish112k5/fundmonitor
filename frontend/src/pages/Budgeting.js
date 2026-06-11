import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Budgeting() {
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [projectsData, setProjectsData] = useState([]);

  useEffect(() => {
    API.get('/projects')
      .then(res => {
        setProjectsList(res.data);
      })
      .catch(() => toast.error('Failed to load projects'));
  }, []);

  useEffect(() => {
    setLoading(true);
    API.get('/dashboard/budget-comparison')
      .then(res => setProjectsData(res.data))
      .catch(() => toast.error('Failed to load budget data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading && projectsData.length === 0) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  // Filter projects if one is selected
  const displayProjects = selectedProject 
    ? projectsData.filter(p => p.project_id === parseInt(selectedProject) || p.project_id === selectedProject)
    : projectsData;

  const totalBudget = displayProjects.reduce((sum, p) => sum + (p.billable || 0), 0);
  const totalActual = displayProjects.reduce((sum, p) => sum + (p.actual || 0), 0);
  const totalVariance = totalBudget - totalActual;

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
            Budgeting & Analysis
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Budget vs Actual cost comparison
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
          {projectsList.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
        </select>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #3B82F6',
          borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Total Budget</span>
            <span style={{ fontSize: '20px' }}>💼</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#3B82F6' }}>{fmt(totalBudget)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Estimated budget allocated</div>
        </div>
        
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #EF4444',
          borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Total Actual Spent</span>
            <span style={{ fontSize: '20px' }}>📉</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#EF4444' }}>{fmt(totalActual)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total cost incurred</div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: `4px solid ${totalVariance >= 0 ? '#10B981' : '#EF4444'}`,
          borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Total Variance</span>
            <span style={{ fontSize: '20px' }}>⚖️</span>
          </div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: totalVariance >= 0 ? '#10B981' : '#EF4444' }}>
            {totalVariance >= 0 ? '+' : ''}{fmt(totalVariance)}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Budget minus Actual</div>
        </div>
      </div>

      {/* ROW 2: PROJECT BUDGET TABLE */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Project Budget Analysis</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Project Name</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Budget</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Actual</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Variance</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>% Used</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.map(p => {
                const actual = p.actual || 0;
                const budget = p.billable || 0;
                const variance = budget - actual;
                const pct = budget > 0 ? Math.min(100, (actual / budget) * 100) : (actual > 0 ? 100 : 0);
                const status = actual > budget ? 'Over Budget' : actual > budget * 0.85 ? 'At Risk' : 'On Track';
                const statusColor = actual > budget ? '#EF4444' : actual > budget * 0.85 ? '#F59E0B' : '#10B981';

                return (
                  <tr key={p.project_id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{p.project_name}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{fmt(budget)}</td>
                    <td style={{ padding: '12px 10px', color: '#EF4444', fontWeight: '600' }}>{fmt(actual)}</td>
                    <td style={{ padding: '12px 10px', color: variance >= 0 ? '#10B981' : '#EF4444', fontWeight: '600' }}>
                      {variance >= 0 ? '+' : ''}{fmt(variance)}
                    </td>
                    <td style={{ padding: '12px 10px', minWidth: '140px' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{pct.toFixed(1)}%</div>
                      <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: statusColor, borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ backgroundColor: statusColor + '22', color: statusColor, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {displayProjects.length === 0 && (
                <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No budget data available</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 3: BAR CHART */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Budget vs Actual Spend</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer>
            <BarChart data={displayProjects} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="project_name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
              <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} tickFormatter={(value) => '₹' + (value/100000).toFixed(1) + 'L'} />
              <Tooltip 
                formatter={(value) => fmt(value)} 
                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} 
              />
              <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }} />
              <Bar dataKey="billable" fill="#3B82F6" name="Budget" radius={[4,4,0,0]} />
              <Bar dataKey="actual" fill="#EF4444" name="Actual Spend" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
