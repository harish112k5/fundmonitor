import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currencyFormat';

export default function FinancialPlanning() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState(null);

  // Form State
  const [targetRoi, setTargetRoi] = useState('');
  const [targetProfit, setTargetProfit] = useState('');
  const [targetRevenue, setTargetRevenue] = useState('');

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
      API.get(`/finance/plan/${selectedProject}/goals`)
        .then(res => {
          setGoals(res.data.goals);
          if (res.data.goals) {
            setTargetRoi(res.data.goals.target_roi || '');
            setTargetProfit(res.data.goals.target_profit_margin || '');
            setTargetRevenue(res.data.goals.target_revenue || '');
          } else {
            setTargetRoi('');
            setTargetProfit('');
            setTargetRevenue('');
          }
        })
        .catch(() => toast.error('Failed to load financial goals'))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    try {
      await API.post('/finance/plan/create-goal', {
        projectId: selectedProject,
        target_roi: targetRoi || 0,
        target_profit_margin: targetProfit || 0,
        target_revenue: targetRevenue || 0
      });
      toast.success('Financial goals saved successfully!');
      setGoals({ target_roi: targetRoi, target_profit_margin: targetProfit, target_revenue: targetRevenue });
    } catch (err) {
      toast.error('Failed to save financial goals');
    }
  };

  if (loading && !goals) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Planning</h1>
          <p>Set goals, plan capital, and run scenarios</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Goal Setting Form */}
        <div className="redesign-card">
          <h3 style={{ marginBottom: '16px' }}>Set Financial Goals</h3>
          <form onSubmit={handleSaveGoals}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Target ROI (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={targetRoi} 
                onChange={e => setTargetRoi(e.target.value)}
                placeholder="e.g. 15.5"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Target Profit Margin (%)</label>
              <input 
                type="number" 
                step="0.01"
                className="form-input" 
                value={targetProfit} 
                onChange={e => setTargetProfit(e.target.value)}
                placeholder="e.g. 20.0"
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Target Revenue (Total)</label>
              <input 
                type="number" 
                className="form-input" 
                value={targetRevenue} 
                onChange={e => setTargetRevenue(e.target.value)}
                placeholder="e.g. 5000000"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Goals
            </button>
          </form>
        </div>

        {/* Current Goals Display */}
        <div className="redesign-card">
          <h3 style={{ marginBottom: '16px' }}>Current Goals Overview</h3>
          {goals ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target ROI</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{goals.target_roi || '0'}%</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target Profit Margin</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{goals.target_profit_margin || '0'}%</div>
              </div>
              <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Target Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{formatCurrency(goals.target_revenue || 0)}</div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              No financial goals set for this project yet.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
