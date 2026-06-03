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
  const [fullStatements, setFullStatements] = useState(null);
  const [activeTab, setActiveTab] = useState('pnl');

  useEffect(() => {
    API.get('/projects')
      .then(res => {
        setProjects(res.data);
        if (res.data.length > 0) setSelectedProject(res.data[0].project_id);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      setLoading(true);
      Promise.all([
        API.get(`/finance/statements/${selectedProject}`),
        API.get(`/finance/statements/full/${selectedProject}`)
      ])
        .then(([pnlRes, fullRes]) => {
          setStatements(pnlRes.data);
          setFullStatements(fullRes.data);
        })
        .catch(() => toast.error('Failed to load statements'))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && (!statements || !fullStatements)) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  const income = statements?.pnl.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0) || 0;
  const expenses = statements?.pnl.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0) || 0;
  const netProfit = income - expenses;

  const bs = fullStatements?.balanceSheet;
  const cf = fullStatements?.cashFlow;

  const totalAssets = bs?.assets.current.reduce((s,i) => s + i.amount, 0) + bs?.assets.nonCurrent.reduce((s,i) => s + i.amount, 0);
  const totalLiab = bs?.liabilities.current.reduce((s,i) => s + i.amount, 0);
  const totalEquity = bs?.equity.reduce((s,i) => s + i.amount, 0);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Statements & Reports</h1>
          <p>Comprehensive Income, Balance Sheet, and Cash Flow</p>
        </div>
        <select 
          className="form-select" 
          value={selectedProject} 
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{ minWidth: '250px', background: 'var(--bg-input)' }}
        >
          {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button className={`btn ${activeTab === 'pnl' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('pnl')}>Income Statement</button>
        <button className={`btn ${activeTab === 'bs' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('bs')}>Balance Sheet</button>
        <button className={`btn ${activeTab === 'cf' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('cf')}>Cash Flow</button>
      </div>

      {statements && activeTab === 'pnl' && (
        <div className="redesign-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <HiOutlineDocumentText /> Profit & Loss Statement
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
                <td style={{ padding: '16px', fontWeight: 700, fontSize: '1.1rem' }}>Net Income / (Loss)</td>
                <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: netProfit >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {fullStatements && activeTab === 'bs' && (
        <div className="redesign-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <HiOutlineDocumentText /> Balance Sheet
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
            <div>
              <h4 style={{ color: '#3b82f6', marginBottom: '8px' }}>ASSETS</h4>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Current Assets</div>
              <table style={{ width: '100%', marginBottom: '16px' }}>
                <tbody>
                  {bs.assets.current.map((item, i) => (
                    <tr key={i}><td style={{ padding: '4px 0' }}>{item.name}</td><td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Non-Current Assets</div>
              <table style={{ width: '100%', marginBottom: '16px' }}>
                <tbody>
                  {bs.assets.nonCurrent.map((item, i) => (
                    <tr key={i}><td style={{ padding: '4px 0' }}>{item.name}</td><td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid var(--border-subtle)', paddingTop: '8px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Assets</span><span>{formatCurrency(totalAssets)}</span>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>LIABILITIES & EQUITY</h4>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Current Liabilities</div>
              <table style={{ width: '100%', marginBottom: '16px' }}>
                <tbody>
                  {bs.liabilities.current.map((item, i) => (
                    <tr key={i}><td style={{ padding: '4px 0' }}>{item.name}</td><td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Shareholders' Equity</div>
              <table style={{ width: '100%', marginBottom: '16px' }}>
                <tbody>
                  {bs.equity.map((item, i) => (
                    <tr key={i}><td style={{ padding: '4px 0' }}>{item.name}</td><td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '2px solid var(--border-subtle)', paddingTop: '8px', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                <span>Total Liabilities & Equity</span><span>{formatCurrency(totalLiab + totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {fullStatements && activeTab === 'cf' && (
        <div className="redesign-card">
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <HiOutlineDocumentText /> Statement of Cash Flows
          </h3>
          
          {['operating', 'investing', 'financing'].map(category => {
            const sum = cf[category].reduce((s, i) => s + i.amount, 0);
            return (
              <div key={category} style={{ marginBottom: '24px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'capitalize' }}>Cash flows from {category} activities</h4>
                <table style={{ width: '100%', marginBottom: '8px' }}>
                  <tbody>
                    {cf[category].map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 0', color: 'var(--text-secondary)' }}>{item.name}</td>
                        <td style={{ textAlign: 'right', color: item.amount < 0 ? '#ef4444' : 'inherit' }}>
                          {item.amount < 0 ? `(${formatCurrency(Math.abs(item.amount))})` : formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Net cash from {category} activities</span>
                  <span style={{ color: sum < 0 ? '#ef4444' : 'inherit' }}>
                    {sum < 0 ? `(${formatCurrency(Math.abs(sum))})` : formatCurrency(sum)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
