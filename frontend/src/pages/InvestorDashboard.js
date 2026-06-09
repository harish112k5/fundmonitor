import React, { useEffect, useState } from 'react';
import API from '../api';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function InvestorDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Default to investor 1 for demo purposes if no ID
  const investorId = id || 1;

  const loadData = () => {
    setLoading(true);
    API.get(`/investors/${investorId}/dashboard`)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [investorId]);

  const handleMarkReceived = async (schedule) => {
    const receivedDate = window.prompt('Enter the date the amount was received (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!receivedDate) return;
    
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

  if (loading && !data) {
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  if (!data) return <div style={{ padding: '40px', color: 'var(--text-primary)' }}>No data available</div>;

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Investor Portfolio</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            Investor #{investorId} • Performance & Funding Overview
          </p>
        </div>
        <div style={{ padding: '8px 16px', backgroundColor: '#3B82F622', color: '#3B82F6', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
          PLATINUM TIER
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #3B82F6', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Committed</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#3B82F6' }}>{fmt(data.overview.total_committed)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #10B981', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Funded</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#10B981' }}>{fmt(data.overview.total_received)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #EF4444', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Outstanding Balance</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#EF4444' }}>{fmt(data.overview.outstanding_balance)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #7C3AED', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Returned</div>
          <div style={{ fontSize: '26px', fontWeight: '700', color: '#7C3AED' }}>{fmt(data.overview.total_returned)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* ROW 2: ACTIVE INVESTMENTS TABLE */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Active Investments</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Project</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Committed</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Funded</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Funding Progress</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{p.project_name}</td>
                    <td style={{ padding: '16px 10px', color: 'var(--text-primary)' }}>{fmt(p.total_committed_amount)}</td>
                    <td style={{ padding: '16px 10px', color: '#10B981', fontWeight: '600' }}>{fmt(p.project_received)}</td>
                    <td style={{ padding: '16px 10px', minWidth: '150px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--bg-input)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(p.progress, 100)}%`, backgroundColor: p.progress >= 100 ? '#10B981' : '#3B82F6', borderRadius: '3px' }} />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: '600' }}>{p.progress.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.projects.length === 0 && (
                  <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No active investments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROW 3: UPCOMING OBLIGATIONS */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Upcoming Obligations</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.upcoming_obligations.map((obl, idx) => (
              <div key={idx} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{obl.project_name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Inst. #{obl.installment_number} • Due: {new Date(obl.scheduled_due_date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#EF4444' }}>{fmt(obl.scheduled_amount)}</div>
                </div>
                
                <button 
                  onClick={() => handleMarkReceived(obl)}
                  disabled={processingId === obl.schedule_id}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: '600', cursor: processingId === obl.schedule_id ? 'not-allowed' : 'pointer' }}
                >
                  {processingId === obl.schedule_id ? 'Processing...' : 'Mark Received'}
                </button>
              </div>
            ))}
            {data.upcoming_obligations.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No upcoming obligations</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
