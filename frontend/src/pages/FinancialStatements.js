import React, { useEffect, useState } from 'react';
import API from '../api';
import { formatCurrency } from '../utils/currencyFormat';
import toast from 'react-hot-toast';
import { HiOutlineDocumentText } from 'react-icons/hi';

export default function FinancialStatements() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [statements, setStatements] = useState(null);

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
      API.get(`/finance/statements/${selectedProject}`)
        .then(res => setStatements(res.data))
        .catch(() => toast.error('Failed to load statements'))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !statements) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const income = statements?.pnl.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0) || 0;
  const expenses = statements?.pnl.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0) || 0;
  const netProfit = income - expenses;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Statements</h1>
          <p>Profit & Loss Account and Trial Balance</p>
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

      {statements && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Income Statement (P&L) */}
          <div className="redesign-card">
            <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <HiOutlineDocumentText /> Profit & Loss Statement (P&L)
            </h3>
            
            <h4 style={{ color: '#10b981', marginBottom: '8px' }}>REVENUE</h4>
            <table style={{ width: '100%', marginBottom: '24px' }}>
              <tbody>
                {statements.pnl.filter(i => i.type === 'income').map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{item.item}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '2px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>Total Revenue</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(income)}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>EXPENSES</h4>
            <table style={{ width: '100%', marginBottom: '24px' }}>
              <tbody>
                {statements.pnl.filter(i => i.type === 'expense').map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{item.item}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '2px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>Total Expenses</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>{formatCurrency(expenses)}</td>
                </tr>
              </tbody>
            </table>

            <table style={{ width: '100%', marginTop: '24px', background: 'var(--bg-input)', borderRadius: '8px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.1rem' }}>Net Profit / (Loss)</td>
                  <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                    {formatCurrency(netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
