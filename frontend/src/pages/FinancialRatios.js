import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const GaugeCard = ({ title, value, max, color, isCurrency = false, suffix = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', borderTop: `4px solid ${color}`, textAlign: 'center' }}>
      <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '600' }}>{title}</h4>
      <div style={{ position: 'relative', width: '120px', height: '60px', margin: '0 auto 10px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', borderRadius: '50%', border: '10px solid var(--border)', borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: 'rotate(-45deg)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '120px', borderRadius: '50%', border: `10px solid ${color}`, borderBottomColor: 'transparent', borderRightColor: 'transparent', transform: `rotate(${ -45 + (pct * 1.8) }deg)`, transition: 'transform 1s ease-out' }} />
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: color }}>
        {isCurrency ? fmt(value) : value.toFixed(2)}{suffix}
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
        if (res.data.length > 0) setSelectedProject(res.data[0].project_id || res.data[0].id);
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

  if (loading && !ratios) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Financial Ratios</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Liquidity, Profitability, and Valuation</p>
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

      {ratios && (
        <>
          {/* ROW 1: LIQUIDITY */}
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Liquidity Ratios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <GaugeCard title="Current Ratio" value={ratios.liquidity.currentRatio} max={5} color="#3B82F6" suffix="x" />
            <GaugeCard title="Cash Ratio" value={ratios.liquidity.cashRatio} max={5} color="#10B981" suffix="x" />
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)', borderTop: `4px solid #F59E0B`, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '13px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: '600' }}>Net Working Capital</h4>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#F59E0B' }}>
                {fmt(ratios.liquidity.netWorkingCapital)}
              </div>
            </div>
          </div>

          {/* ROW 2: PROFITABILITY */}
          <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Profitability Ratios</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {[{ label: 'Gross Profit Rate', val: ratios.profitability.grossProfitRate, color: '#10B981' },
              { label: 'Return on Sales (ROS)', val: ratios.profitability.returnOnSales, color: '#3B82F6' },
              { label: 'Return on Assets (ROA)', val: ratios.profitability.returnOnAssets, color: '#F59E0B' },
              { label: 'Return on Equity (ROE)', val: ratios.profitability.returnOnEquity, color: '#7C3AED' }
            ].map((p, i) => (
              <div key={i} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${p.color}`, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>{p.label}</div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: p.color }}>{p.val.toFixed(2)}%</div>
              </div>
            ))}
          </div>

          {/* ROW 3: LEVERAGE & VALUATION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Leverage (Debt vs Equity)</h3>
              <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={[
                    { name: 'Debt Ratio', value: ratios.leverage.debtRatio },
                    { name: 'Equity Ratio', value: ratios.leverage.equityRatio },
                    { name: 'Debt-to-Equity', value: ratios.leverage.debtToEquity }
                  ]} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>Valuation Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Earnings Per Share (EPS)</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981' }}>{fmt(ratios.valuation.eps)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>P/E Ratio</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#3B82F6' }}>{ratios.valuation.peRatio.toFixed(2)}x</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Market Price</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(ratios.valuation.marketPrice)}</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-input)', padding: '20px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '8px' }}>Shares Outstanding</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>{(ratios.valuation.shares).toLocaleString()}</div>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
