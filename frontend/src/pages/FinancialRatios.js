import React, { useEffect, useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

const RatioGauge = ({ value, label, target, max, color }) => {
  const data = [{ name: label, value: Math.min(value, max), fill: color }];
  return (
    <div className="redesign-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h4 style={{ color: 'var(--text-secondary)' }}>{label}</h4>
      <div style={{ width: '100%', height: 160 }}>
        <ResponsiveContainer>
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={data} startAngle={180} endAngle={0}>
            <PolarAngleAxis type="number" domain={[0, max]} angleAxisId={0} tick={false} />
            <RadialBar minAngle={15} background={{ fill: 'var(--border-subtle)' }} clockWise dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ marginTop: '-40px', fontSize: '1.5rem', fontWeight: 700, color }}>
        {value.toFixed(2)}{target > 100 ? '' : '%'}
      </div>
    </div>
  );
};

export default function FinancialRatios() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [ratios, setRatios] = useState(null);

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
      API.get(`/finance/ratios/${selectedProject}`)
        .then(res => setRatios(res.data))
        .catch(() => toast.error('Failed to load ratios'))
        .finally(() => setLoading(false));
    }
  }, [selectedProject]);

  if (loading && !ratios) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Ratios Dashboard</h1>
          <p>Valuation, Liquidity, Profitability, and Efficiency Metrics</p>
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

      {ratios && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Profitability Ratios */}
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Profitability Ratios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <RatioGauge value={ratios.profitability.grossProfitRate} label="Gross Profit Rate" max={100} color="#10b981" />
              <RatioGauge value={ratios.profitability.returnOnSales} label="Return on Sales (ROS)" max={100} color="#3b82f6" />
              <RatioGauge value={ratios.profitability.returnOnAssets} label="Return on Assets (ROA)" max={100} color="#f59e0b" />
              <RatioGauge value={ratios.profitability.returnOnEquity} label="Return on Equity (ROE)" max={100} color="#8b5cf6" />
            </div>
          </div>

          {/* Liquidity Ratios */}
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Liquidity Ratios</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <RatioGauge value={ratios.liquidity.currentRatio} label="Current Ratio" max={5} target={150} color="#10b981" />
              <RatioGauge value={ratios.liquidity.cashRatio} label="Cash Ratio" max={5} target={150} color="#3b82f6" />
              
              <div className="redesign-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: '4px solid #f59e0b' }}>
                <h4 style={{ color: 'var(--text-secondary)' }}>Net Working Capital</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '8px' }}>
                  ₹{(ratios.liquidity.netWorkingCapital).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Leverage & Efficiency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="redesign-card">
              <h3 style={{ marginBottom: '16px' }}>Leverage Ratios</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Debt Ratio', value: ratios.leverage.debtRatio },
                    { name: 'Equity Ratio', value: ratios.leverage.equityRatio },
                    { name: 'Debt-to-Equity', value: ratios.leverage.debtToEquity }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="redesign-card">
              <h3 style={{ marginBottom: '16px' }}>Valuation Ratios</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Earnings Per Share (EPS)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₹{ratios.valuation.eps.toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>P/E Ratio</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{ratios.valuation.peRatio.toFixed(2)}x</div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Market Price</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>₹{ratios.valuation.marketPrice}</div>
                </div>
                <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Shares Oustanding</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(ratios.valuation.shares).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

