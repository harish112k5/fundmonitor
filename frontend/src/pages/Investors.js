import React, { useEffect, useState } from 'react';
import API from '../api';
import DataTable from '../components/DataTable';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineEye } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function Investors() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
    API.get('/investors/admin/tracking').then(r => setData(r.data))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const columns = [
    { header: 'ID', accessor: 'investor_id', style: { width: 60 } },
    { header: 'Name', accessor: 'name', render: r => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span> },
    { header: 'Type', accessor: 'investor_type' },
    { header: 'KYC', accessor: 'kyc_status', render: r => (
      <span style={{ color: r.kyc_status === 'Verified' ? 'var(--success)' : 'var(--warning)' }}>{r.kyc_status}</span>
    )},
    { header: 'Committed', accessor: 'total_committed', render: r => `₹${Number(r.total_committed).toLocaleString('en-IN')}` },
    { header: 'Received', accessor: 'total_received', render: r => `₹${Number(r.total_received).toLocaleString('en-IN')}` },
    { header: 'Progress', accessor: 'progress', render: r => (
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ flex: 1, background: 'var(--border-color)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(r.progress, 100)}%`, background: r.progress >= 100 ? 'var(--success)' : 'var(--primary)', height: '100%' }} />
        </div>
        <span style={{ fontSize: '0.8rem' }}>{r.progress.toFixed(0)}%</span>
      </div>
    )},
    { header: 'Actions', accessor: 'actions', render: r => (
        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem' }} onClick={() => navigate(`/investor-dashboard/${r.investor_id}`)}>
          <HiOutlineEye /> View
        </button>
    ) }
  ];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Investors Tracking</h1>
          <p>Admin dashboard to monitor all investors and funding</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/investor-onboarding')}>
            <HiOutlinePlus /> Onboard Investor
          </button>
        </div>
      </div>
      
      {/* Top metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Investors</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.length}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Committed</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>₹{data.reduce((sum, i) => sum + i.total_committed, 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Received</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{data.reduce((sum, i) => sum + i.total_received, 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <DataTable columns={columns} data={data} searchPlaceholder="Search investors..." emptyIcon="💰" emptyTitle="No investors" />
    </div>
  );
}
