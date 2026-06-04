import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currencyFormat';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function FinancialForecast() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState([]);

  // Generate form state
  const [type, setType] = useState('revenue');
  const [period, setPeriod] = useState('');
  const [amount, setAmount] = useState('');
  const [scenario, setScenario] = useState('realistic');

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

  const loadForecasts = () => {
    if (!selectedProject) return;
    setLoading(true);
    API.get(`/finance/forecast/${selectedProject}/${type}`)
      .then(res => setForecasts(res.data.forecasts))
      .catch(() => toast.error('Failed to load forecasts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadForecasts();
    // eslint-disable-next-line
  }, [selectedProject, type]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/finance/forecast/generate', {
        projectId: selectedProject,
        type,
        period,
        amount,
        scenario
      });
      toast.success('Forecast generated successfully!');
      setPeriod('');
      setAmount('');
      loadForecasts();
    } catch (err) {
      toast.error('Failed to generate forecast');
    }
  };

  const chartData = forecasts.map(f => ({
    period: f.forecast_period,
    amount: parseFloat(f.amount),
    scenario: f.scenario
  }));

  if (loading && forecasts.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Financial Forecasting</h1>
          <p>Time series predictions and scenario analysis</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Forecast Generator */}
        <div className="redesign-card">
          <h3 style={{ marginBottom: '16px' }}>Add Forecast Data</h3>
          <form onSubmit={handleGenerate}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Forecast Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="revenue">Revenue</option>
                <option value="cost">Cost</option>
                <option value="cash_flow">Cash Flow</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Scenario</label>
              <select className="form-select" value={scenario} onChange={e => setScenario(e.target.value)}>
                <option value="optimistic">Optimistic</option>
                <option value="realistic">Realistic</option>
                <option value="pessimistic">Pessimistic</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Period (e.g. 2026-Q1 or 2026-06)</label>
              <input 
                type="text" 
                className="form-input" 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Forecasted Amount</label>
              <input 
                type="number" 
                className="form-input" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Add Forecast
            </button>
          </form>
        </div>

        {/* Forecast Chart */}
        <div className="redesign-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3>{type.replace('_', ' ').toUpperCase()} Forecast</h3>
          </div>
          
          {forecasts.length > 0 ? (
            <div style={{ width: '100%', height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="period" stroke="var(--text-secondary)" />
                  <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => '₹' + (val/1000).toFixed(0) + 'k'} />
                  <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" activeDot={{ r: 8 }} name="Forecast Amount" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
              No forecast data available for {type}. Add some data to see the chart.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
