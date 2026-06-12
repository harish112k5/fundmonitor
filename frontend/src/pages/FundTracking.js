import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';

export default function FundTracking() {
  const [investors, setInvestors] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    investor_id: '',
    project_id: '',
    received_amount: '',
    received_date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    transaction_reference: '',
    allocation_method: 'FIFO',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/investors').then(res => setInvestors(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (formData.investor_id) {
      API.get(`/investors/${formData.investor_id}/projects`).then(res => {
        setProjects(res.data);
        if (res.data.length === 1) setFormData(f => ({ ...f, project_id: res.data[0].project_id }));
      }).catch(console.error);
    } else {
      setProjects([]);
      setFormData(f => ({ ...f, project_id: '' }));
    }
  }, [formData.investor_id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.investor_id || !formData.project_id || !formData.received_amount) {
      return toast.error('Please fill required fields');
    }

    setLoading(true);
    try {
      await API.post('/investors/fund-receipt/record', formData);
      toast.success('Fund receipt recorded and allocated successfully!');
      setFormData({
        investor_id: '', project_id: '', received_amount: '', 
        received_date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer', transaction_reference: '', allocation_method: 'FIFO'
      });
      setProjects([]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <div style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Record Fund Receipt</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Log incoming funds and trigger allocation logic</p>
        </div>
        <button onClick={() => window.location.href='/finance/investor-dashboard'} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>
          Back to Dashboard
        </button>
      </div>

      <div style={{ width: '100%', maxWidth: '700px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Investor *</label>
            <select name="investor_id" value={formData.investor_id} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
              <option value="">-- Select Investor --</option>
              {investors.map(i => <option key={i.investor_id} value={i.investor_id}>{i.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Project *</label>
            <select name="project_id" value={formData.project_id} onChange={handleChange} required disabled={!formData.investor_id} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: formData.investor_id ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Received Amount (₹) *</label>
              <input type="number" step="0.01" name="received_amount" value={formData.received_amount} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Date Received *</label>
              <input type="date" name="received_date" value={formData.received_date} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Payment Method</label>
              <select name="payment_method" value={formData.payment_method} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <option>Bank Transfer</option>
                <option>Cheque</option>
                <option>Online</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Transaction Reference</label>
              <input name="transaction_reference" value={formData.transaction_reference} onChange={handleChange} placeholder="e.g. TXN-12345" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#3B82F611', border: '1px solid #3B82F644', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#3B82F6', fontWeight: '600' }}>Allocation Method *</label>
            <select name="allocation_method" value={formData.allocation_method} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #3B82F644', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', marginBottom: '8px' }}>
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="Manual">Manual Allocation</option>
              <option value="Priority">Priority-Based Allocation</option>
            </select>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Note: FIFO will automatically apply funds to the oldest pending installments first.
            </p>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: 'var(--text-primary)', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '15px', marginTop: '16px', transition: 'background-color 0.2s' }}>
            {loading ? 'Processing...' : 'Record Receipt & Allocate'}
          </button>

        </form>
      </div>

    </div>
  );
}
