import React, { useEffect, useState } from 'react';
import API from '../api';
import { formatCurrency } from '../utils/currencyFormat';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineCash } from 'react-icons/hi';
import Modal from '../components/Modal';

export default function Budgeting() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState({ master: null, details: [], analysis: [] });
  
  const [showModal, setShowModal] = useState(false);
  const [newBudget, setNewBudget] = useState({ budget_name: '', total_amount: '' });
  const [details, setDetails] = useState([
    { category: 'Materials', allocated_amount: '' },
    { category: 'Labor', allocated_amount: '' },
    { category: 'Equipment', allocated_amount: '' },
    { category: 'Other Expenses', allocated_amount: '' }
  ]);

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

  const loadBudget = () => {
    if (selectedProject) {
      setLoading(true);
      API.get(`/finance/budget/${selectedProject}`)
        .then(res => setBudgetData(res.data))
        .catch(() => toast.error('Failed to load budget'))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadBudget();
  }, [selectedProject]);

  const handleCreateBudget = async () => {
    try {
      const payload = {
        ...newBudget,
        details: details.filter(d => d.allocated_amount > 0)
      };
      await API.post(`/finance/budget/${selectedProject}`, payload);
      toast.success('Budget created successfully');
      setShowModal(false);
      loadBudget();
    } catch (err) {
      toast.error('Failed to create budget');
    }
  };

  if (loading && !budgetData.master) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Budget vs Actual</h1>
          <p>Monitor project spending against planned budgets</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
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
          
          {!budgetData.master && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <HiOutlinePlus /> Create Master Budget
            </button>
          )}
        </div>
      </div>

      {!budgetData.master ? (
        <div className="empty-state" style={{ marginTop: '40px', padding: '60px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
          <HiOutlineCash size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3>No Budget Defined</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Create a master budget to track expenses against allocations.</p>
          <button className="btn btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowModal(true)}>
            Create Budget Now
          </button>
        </div>
      ) : (
        <>
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', display: 'grid', gap: '20px', marginBottom: '24px' }}>
            <div className="redesign-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <h3>Total Master Budget</h3>
              <div className="card-value-text">{formatCurrency(budgetData.master.total_amount)}</div>
              <p className="card-sub-text">Status: {budgetData.master.status.toUpperCase()}</p>
            </div>
            
            <div className="redesign-card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <h3>Total Actual Spent</h3>
              <div className="card-value-text">
                {formatCurrency(budgetData.analysis.reduce((sum, item) => sum + item.actual, 0))}
              </div>
              <p className="card-sub-text">Across all monitored categories</p>
            </div>
            
            <div className="redesign-card" style={{ borderLeft: '4px solid #10b981' }}>
              <h3>Remaining Budget</h3>
              <div className="card-value-text">
                {formatCurrency(budgetData.master.total_amount - budgetData.analysis.reduce((sum, item) => sum + item.actual, 0))}
              </div>
              <p className="card-sub-text">Available for future use</p>
            </div>
          </div>

          <div className="redesign-card">
            <h3 style={{ marginBottom: '20px' }}>Budget Variance Analysis</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>CATEGORY</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>ALLOCATED BUDGET</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>ACTUAL SPENT</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>VARIANCE</th>
                    <th style={{ padding: '12px', color: 'var(--text-muted)' }}>UTILIZATION</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.analysis.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{row.category}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.budgeted)}</td>
                      <td style={{ padding: '12px' }}>{formatCurrency(row.actual)}</td>
                      <td style={{ padding: '12px', color: row.variance < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                        {row.variance < 0 ? '-' : '+'}{formatCurrency(Math.abs(row.variance))}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${Math.min(row.usedPercentage, 100)}%`,
                                background: row.usedPercentage > 100 ? '#ef4444' : row.usedPercentage > 85 ? '#f59e0b' : '#10b981'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '12px' }}>{row.usedPercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Master Budget" style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ padding: '0 24px 24px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Budget Name</label>
            <input 
              className="form-input" 
              value={newBudget.budget_name} 
              onChange={e => setNewBudget({...newBudget, budget_name: e.target.value})} 
              placeholder="e.g. FY 2025 Phase 1 Budget"
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Total Amount (₹)</label>
            <input 
              type="number"
              className="form-input" 
              value={newBudget.total_amount} 
              onChange={e => setNewBudget({...newBudget, total_amount: e.target.value})} 
              placeholder="Total Budget Allocation"
            />
          </div>

          <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Department Allocations</h4>
          {details.map((d, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <input className="form-input" value={d.category} readOnly style={{ flex: 1, background: 'var(--bg-input)' }} />
              <input 
                type="number"
                className="form-input" 
                placeholder="Amount (₹)"
                value={d.allocated_amount} 
                onChange={e => {
                  const newDetails = [...details];
                  newDetails[index].allocated_amount = e.target.value;
                  setDetails(newDetails);
                }} 
                style={{ flex: 1 }} 
              />
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateBudget}>Save Budget</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
