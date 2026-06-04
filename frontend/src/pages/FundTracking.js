import React, { useState, useEffect } from 'react';
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
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Record Fund Receipt</h1>
          <p>Record incoming funds and trigger allocation logic (FIFO, Manual, Priority)</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.location.href='/investors'}>
          Back to Investors
        </button>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Investor *</label>
            <select className="form-input" name="investor_id" value={formData.investor_id} onChange={handleChange} required>
              <option value="">-- Select Investor --</option>
              {investors.map(i => <option key={i.investor_id} value={i.investor_id}>{i.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Project *</label>
            <select className="form-input" name="project_id" value={formData.project_id} onChange={handleChange} required disabled={!formData.investor_id}>
              <option value="">-- Select Project --</option>
              {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Received Amount (₹) *</label>
              <input className="form-input" type="number" step="0.01" name="received_amount" value={formData.received_amount} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date Received *</label>
              <input className="form-input" type="date" name="received_date" value={formData.received_date} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-input" name="payment_method" value={formData.payment_method} onChange={handleChange}>
                <option>Bank Transfer</option>
                <option>Cheque</option>
                <option>Online</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Transaction Reference</label>
              <input className="form-input" name="transaction_reference" value={formData.transaction_reference} onChange={handleChange} placeholder="e.g. TXN-12345" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Allocation Method *</label>
            <select className="form-input" name="allocation_method" value={formData.allocation_method} onChange={handleChange}>
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="Manual">Manual Allocation (Requires specific IDs in API)</option>
              <option value="Priority">Priority-Based Allocation</option>
            </select>
            <small style={{ color: 'var(--text-secondary)' }}>
              Note: FIFO will automatically apply funds to the oldest pending installments first.
            </small>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'right' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : 'Record Receipt & Allocate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
