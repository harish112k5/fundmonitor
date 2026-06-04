import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function InvestorDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // If no ID is provided, assume we want to view investor 1 for demo purposes
  const investorId = id || 1;

  const loadData = () => {
    API.get(`/investors/${investorId}/dashboard`)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [investorId]);

  const handleMarkReceived = async (schedule) => {
    const receivedDate = window.prompt('Enter the date the amount was received (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!receivedDate) return; // User cancelled
    
    setProcessingId(schedule.schedule_id);
    
    try {
      await API.post('/investors/fund-receipt/record', {
        investor_id: investorId,
        project_id: schedule.project_id,
        received_amount: schedule.scheduled_amount,
        received_date: receivedDate,
        payment_method: 'Online',
        allocation_method: 'Manual',
        manual_allocations: [{ schedule_id: schedule.schedule_id, amount: schedule.scheduled_amount }]
      });
      toast.success('Installment marked as received!');
      loadData();
    } catch (err) {
      toast.error('Failed to mark received');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReturnFunds = async () => {
    const amountStr = window.prompt('Enter amount to return to investor (₹):');
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return toast.error('Invalid amount');

    const returnDate = window.prompt('Enter return date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!returnDate) return;

    try {
      // Return from the first project for demo, or a specific one if needed.
      const projectId = data.projects.length > 0 ? data.projects[0].project_id : 1;
      await API.post('/investors/returns/record', {
        investor_id: investorId,
        project_id: projectId,
        amount,
        return_date: returnDate,
        notes: 'Manual return'
      });
      toast.success('Funds returned successfully!');
      loadData();
    } catch (err) {
      toast.error('Failed to record return');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Investor Portfolio Dashboard</h1>
          <p>Overview of your investments and funding progress</p>
        </div>
      </div>

      {/* Portfolio Overview */}
      <h2 style={{ marginBottom: '1rem' }}>Portfolio Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Committed</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{data.overview.total_committed.toLocaleString('en-IN')}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Funded</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{data.overview.total_received.toLocaleString('en-IN')}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Returned</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{data.overview.total_returned.toLocaleString('en-IN')}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Outstanding Balance</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>₹{data.overview.outstanding_balance.toLocaleString('en-IN')}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Funding Progress</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, background: 'var(--border-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(data.overview.funding_progress, 100)}%`, background: 'var(--primary)', height: '100%' }} />
            </div>
            <span style={{ fontWeight: 'bold' }}>{data.overview.funding_progress.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Project Specific View */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Project Investments</h2>
        <button className="btn btn-primary" onClick={handleReturnFunds}>Return Funds to Investor</button>
      </div>
      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {data.projects.map((p, idx) => (
          <div key={idx} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>{p.project_name}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Project ID: {p.project_id}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><strong>Committed:</strong> ₹{p.total_committed_amount.toLocaleString('en-IN')}</p>
              <p><strong>Funded:</strong> <span style={{ color: 'var(--success)' }}>₹{p.project_received.toLocaleString('en-IN')}</span></p>
              <div style={{ width: '150px', background: 'var(--border-color)', height: '6px', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(p.progress, 100)}%`, background: p.progress >= 100 ? 'var(--success)' : 'var(--primary)', height: '100%' }} />
              </div>
            </div>
          </div>
        ))}
        {data.projects.length === 0 && <p>No project investments found.</p>}
      </div>

      {/* Upcoming Obligations */}
      <h2 style={{ marginBottom: '1rem' }}>Upcoming Installments</h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Project</th>
              <th style={{ padding: '1rem' }}>Installment #</th>
              <th style={{ padding: '1rem' }}>Due Date</th>
              <th style={{ padding: '1rem' }}>Amount</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.upcoming_obligations.map((obl, idx) => (
              <tr key={idx} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem' }}>{obl.project_name}</td>
                <td style={{ padding: '1rem' }}>{obl.installment_number}</td>
                <td style={{ padding: '1rem' }}>{new Date(obl.scheduled_due_date).toLocaleDateString('en-IN')}</td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>₹{parseFloat(obl.scheduled_amount).toLocaleString('en-IN')}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem',
                    background: obl.status === 'Partially Received' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: obl.status === 'Partially Received' ? '#eab308' : '#ef4444'
                  }}>
                    {obl.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    onClick={() => handleMarkReceived(obl)}
                    disabled={processingId === obl.schedule_id}
                  >
                    {processingId === obl.schedule_id ? 'Processing...' : '✔ Mark Received'}
                  </button>
                </td>
              </tr>
            ))}
            {data.upcoming_obligations.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No upcoming obligations</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
