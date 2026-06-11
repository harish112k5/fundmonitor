import { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import api from '../api';
import toast from 'react-hot-toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const PIE_COLORS = ['#7C3AED', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export default function InvestorDashboard() {
  const [investors, setInvestors] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both in parallel
      const [invRes, investRes] = await Promise.all([
        api.get('/investors'),
        api.get('/investments')
      ]);
      setInvestors(invRes.data || []);
      setInvestments(investRes.data || []);
    } catch (err) {
      console.error('InvestorDashboard fetch error:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to load data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Calculated KPIs ──────────────────────────────────
  const totalInvestors   = investors.length;
  const totalDeployed    = investors.reduce((s, i) => s + parseFloat(i.total_invested || 0), 0);
  const totalRepaid      = investors.reduce((s, i) => s + parseFloat(i.total_repaid || 0), 0);
  const totalPending     = investors.reduce((s, i) => s + parseFloat(i.pending_return || 0), 0);

  // ── Pie chart data ───────────────────────────────────
  const pieData = investors
    .filter(i => parseFloat(i.total_invested) > 0)
    .map(i => ({
      name: i.name,
      value: parseFloat(i.total_invested)
    }));

  // ── Timeline data (investments by month) ────────────
  const timelineMap = {};
  investments.forEach(inv => {
    const month = inv.investment_date?.slice(0, 7) || 'Unknown';
    timelineMap[month] = (timelineMap[month] || 0) + parseFloat(inv.amount || 0);
  });
  const timelineData = Object.entries(timelineMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .reduce((acc, [month, amount]) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
      acc.push({ month, amount, cumulative: prev + amount });
      return acc;
    }, []);

  // ── KPI cards config ─────────────────────────────────
  const kpis = [
    { label: 'Total Investors',   value: totalInvestors,  color: '#7C3AED', icon: '👥', isMoney: false, sub: 'Registered profiles' },
    { label: 'Total Deployed',    value: totalDeployed,   color: '#10B981', icon: '💰', isMoney: true,  sub: 'Funds invested' },
    { label: 'Total Repaid',      value: totalRepaid,     color: '#3B82F6', icon: '✅', isMoney: true,  sub: 'Returns paid' },
    { label: 'Pending Returns',   value: totalPending,    color: '#F59E0B', icon: '⏳', isMoney: true,  sub: 'Outstanding' },
  ];

  // ── Loading state ─────────────────────────────────────
  if (loading) {
    return (
      <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Loading investor data...</div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────
  if (error) {
    return (
      <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px' }}>
        <div style={{ backgroundColor: '#EF444422', border: '1px solid #EF4444', borderRadius: '12px', padding: '24px', maxWidth: '500px', margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#EF4444', margin: '0 0 8px' }}>Failed to Load Data</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button onClick={fetchData}
            style={{ backgroundColor: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: '600' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            Investor Dashboard
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Portfolio overview and return tracking
          </p>
        </div>
        <button onClick={fetchData}
          style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', flexShrink: 0 }}>
          ↻ Refresh
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {kpis.map((c, i) => (
          <div key={i} style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${c.color}`,
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {c.label}
              </span>
              <span style={{ fontSize: '20px' }}>{c.icon}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '700', color: c.color }}>
              {c.isMoney ? fmt(c.value) : c.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* No investors message */}
      {investors.length === 0 && (
        <div style={{
          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '60px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px' }}>No Investors Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Add investors from the Investors page to see portfolio data here.</p>
        </div>
      )}

      {investors.length > 0 && (
        <>
          {/* CHARTS ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>

            {/* Pie Chart — Investment Distribution */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
                🍩 Investment Distribution by Investor
              </h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No investment data to display
                </div>
              )}
            </div>

            {/* Line Chart — Cumulative Investment Timeline */}
            <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
                📈 Cumulative Investment Timeline
              </h3>
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <YAxis tickFormatter={v => '₹' + (v/100000).toFixed(0) + 'L'} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'var(--border)' }} />
                    <Tooltip formatter={(v) => fmt(v)} contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                    <Line dataKey="cumulative" stroke="#7C3AED" strokeWidth={2} dot={{ r: 4 }} name="Cumulative" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  No timeline data to display
                </div>
              )}
            </div>
          </div>

          {/* INVESTOR PORTFOLIO TABLE */}
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '600' }}>
              📋 Investor Portfolio
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '750px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Investor', 'Type', 'Projects', 'Total Invested', 'Total Repaid', 'Pending Return', 'ROI'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investors.map(inv => {
                    const invested = parseFloat(inv.total_invested || 0);
                    const repaid = parseFloat(inv.total_repaid || 0);
                    const roi = invested > 0 ? ((repaid - invested) / invested * 100) : 0;
                    return (
                      <tr key={inv.investor_id || inv.id} style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{inv.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inv.email}</div>
                        </td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px' }}>{inv.type}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--text-primary)', textAlign: 'center' }}>{inv.project_count}</td>
                        <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '600' }}>{fmt(invested)}</td>
                        <td style={{ padding: '12px 10px', color: '#3B82F6', fontWeight: '600' }}>{fmt(repaid)}</td>
                        <td style={{ padding: '12px 10px', color: '#F59E0B', fontWeight: '600' }}>{fmt(inv.pending_return)}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{
                            backgroundColor: roi > 0 ? '#10B98122' : roi < 0 ? '#EF444422' : '#94A3B822',
                            color: roi > 0 ? '#10B981' : roi < 0 ? '#EF4444' : '#94A3B8',
                            borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: '600'
                          }}>
                            {roi === 0 ? 'In Progress' : (roi > 0 ? '+' : '') + roi.toFixed(2) + '%'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
