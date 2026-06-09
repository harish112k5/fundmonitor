import React, { useEffect, useState } from 'react';
import API from '../api';
import { formatCurrency } from '../utils/currencyFormat';
import toast from 'react-hot-toast';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

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
        if (res.data.length > 0) setSelectedProject(res.data[0].project_id || res.data[0].id);
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
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  const income = statements?.pnl.filter(i => i.type === 'income').reduce((sum, i) => sum + i.amount, 0) || 0;
  const expenses = statements?.pnl.filter(i => i.type === 'expense').reduce((sum, i) => sum + i.amount, 0) || 0;
  const netProfit = income - expenses;

  const bs = fullStatements?.balanceSheet;
  const cf = fullStatements?.cashFlow;

  const totalAssets = (bs?.assets.current.reduce((s,i) => s + i.amount, 0) || 0) + (bs?.assets.nonCurrent.reduce((s,i) => s + i.amount, 0) || 0);
  const totalLiab = bs?.liabilities.current.reduce((s,i) => s + i.amount, 0) || 0;
  const totalEquity = bs?.equity.reduce((s,i) => s + i.amount, 0) || 0;

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '12px 24px', fontSize: '14px', fontWeight: '600',
        backgroundColor: activeTab === id ? 'var(--bg-card)' : 'transparent',
        color: activeTab === id ? 'var(--text-primary)' : 'var(--text-secondary)',
        border: 'none', borderBottom: activeTab === id ? '3px solid #3B82F6' : '3px solid transparent',
        cursor: 'pointer', transition: 'all 0.2s', outline: 'none'
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Financial Statements</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Comprehensive Income, Balance Sheet & Cash Flow</p>
        </div>
        <select 
          value={selectedProject} 
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '9px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-input)', color: 'var(--text-primary)',
            fontSize: '14px', minWidth: '200px', flexShrink: 0
          }}
        >
          {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
        </select>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', backgroundColor: 'var(--bg-input)', borderRadius: '12px 12px 0 0', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <TabBtn id="pnl" label="Income Statement" />
        <TabBtn id="bs" label="Balance Sheet" />
        <TabBtn id="cf" label="Cash Flow" />
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        
        {/* INCOME STATEMENT */}
        {activeTab === 'pnl' && statements && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '20px', fontWeight: '700' }}>Profit & Loss Statement</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>For the selected project period</p>

            <h4 style={{ color: '#10B981', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>REVENUE</h4>
            <table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
              <tbody>
                {statements.pnl.filter(i => i.type === 'income').map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{item.item}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: '700', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }}>Total Revenue</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700', color: '#10B981', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }}>{fmt(income)}</td>
                </tr>
              </tbody>
            </table>

            <h4 style={{ color: '#EF4444', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>EXPENSES</h4>
            <table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
              <tbody>
                {statements.pnl.filter(i => i.type === 'expense').map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{item.item}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '500' }}>{fmt(item.amount)}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ padding: '12px 0', fontWeight: '700', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }}>Total Expenses</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: '700', color: '#EF4444', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--border)' }}>{fmt(expenses)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: '700' }}>Net Income / (Loss)</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: netProfit >= 0 ? '#10B981' : '#EF4444' }}>
                {netProfit >= 0 ? '' : '-'}{fmt(Math.abs(netProfit))}
              </span>
            </div>
          </div>
        )}

        {/* BALANCE SHEET */}
        {activeTab === 'bs' && fullStatements && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '20px', fontWeight: '700' }}>Balance Sheet</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>As of current date</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
              
              {/* ASSETS */}
              <div>
                <h3 style={{ color: '#3B82F6', marginBottom: '16px', borderBottom: '2px solid #3B82F6', paddingBottom: '8px' }}>ASSETS</h3>
                
                <h4 style={{ color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Current Assets</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {bs.assets.current.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 style={{ color: 'var(--text-secondary)', marginTop: '24px', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Non-Current Assets</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {bs.assets.nonCurrent.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '2px solid var(--border)', borderBottom: '4px double var(--border)', padding: '12px 0', fontWeight: '700', fontSize: '16px' }}>
                  <span>Total Assets</span>
                  <span style={{ color: '#3B82F6' }}>{fmt(totalAssets)}</span>
                </div>
              </div>

              {/* LIABILITIES & EQUITY */}
              <div>
                <h3 style={{ color: '#EF4444', marginBottom: '16px', borderBottom: '2px solid #EF4444', paddingBottom: '8px' }}>LIABILITIES & EQUITY</h3>
                
                <h4 style={{ color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Current Liabilities</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {bs.liabilities.current.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h4 style={{ color: 'var(--text-secondary)', marginTop: '24px', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase' }}>Shareholders' Equity</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {bs.equity.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: '8px 0', color: 'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right' }}>{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '2px solid var(--border)', borderBottom: '4px double var(--border)', padding: '12px 0', fontWeight: '700', fontSize: '16px' }}>
                  <span>Total Liabilities & Equity</span>
                  <span style={{ color: '#EF4444' }}>{fmt(totalLiab + totalEquity)}</span>
                </div>
              </div>
              
            </div>
          </div>
        )}

        {/* CASH FLOW */}
        {activeTab === 'cf' && fullStatements && (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', margin: '0 0 8px', fontSize: '20px', fontWeight: '700' }}>Statement of Cash Flows</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>For the selected project period</p>

            {['operating', 'investing', 'financing'].map((category, idx) => {
              const sum = cf[category].reduce((s, i) => s + i.amount, 0);
              const color = idx === 0 ? '#10B981' : idx === 1 ? '#3B82F6' : '#7C3AED';
              
              return (
                <div key={category} style={{ marginBottom: '32px' }}>
                  <h4 style={{ color: color, marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '8px', textTransform: 'uppercase' }}>
                    Cash flows from {category} activities
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      {cf[category].map((item, i) => (
                        <tr key={i}>
                          <td style={{ padding: '10px 0', color: 'var(--text-primary)' }}>{item.name}</td>
                          <td style={{ padding: '10px 0', textAlign: 'right', color: item.amount < 0 ? '#EF4444' : 'inherit' }}>
                            {item.amount < 0 ? `(${fmt(Math.abs(item.amount))})` : fmt(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', borderBottom: '2px solid var(--border)', padding: '12px 0', fontWeight: '700', backgroundColor: 'var(--bg-input)', paddingLeft: '16px', paddingRight: '16px', borderRadius: '4px', marginTop: '8px' }}>
                    <span>Net cash from {category} activities</span>
                    <span style={{ color: sum < 0 ? '#EF4444' : color }}>
                      {sum < 0 ? `(${fmt(Math.abs(sum))})` : fmt(sum)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
