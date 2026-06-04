import React, { useState, useEffect } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/currencyFormat';

export default function TaxCompliance() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [taxes, setTaxes] = useState([]);

  // Form State
  const [taxType, setTaxType] = useState('GST');
  const [period, setPeriod] = useState('');
  const [amountDue, setAmountDue] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('pending');
  const [notes, setNotes] = useState('');

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

  const loadTaxes = () => {
    if (!selectedProject) return;
    setLoading(true);
    API.get(`/finance/tax/${selectedProject}`)
      .then(res => setTaxes(res.data.taxes))
      .catch(() => toast.error('Failed to load tax records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTaxes();
    // eslint-disable-next-line
  }, [selectedProject]);

  const handleAddTax = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/finance/tax/${selectedProject}`, {
        tax_type: taxType,
        period,
        amount_due: amountDue,
        amount_paid: amountPaid || 0,
        due_date: dueDate,
        status,
        notes
      });
      toast.success('Tax record added successfully!');
      setTaxType('GST');
      setPeriod('');
      setAmountDue('');
      setAmountPaid('');
      setDueDate('');
      setStatus('pending');
      setNotes('');
      loadTaxes();
    } catch (err) {
      toast.error('Failed to add tax record');
    }
  };

  if (loading && taxes.length === 0) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Tax Compliance</h1>
          <p>Track tax liabilities, GST/VAT, and statutory filings</p>
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
        
        {/* Add Tax Record */}
        <div className="redesign-card">
          <h3 style={{ marginBottom: '16px' }}>Add Tax Record</h3>
          <form onSubmit={handleAddTax}>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Tax Type</label>
              <input 
                type="text" 
                className="form-input" 
                value={taxType} 
                onChange={e => setTaxType(e.target.value)}
                placeholder="e.g. GST, TDS, Income Tax"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Filing Period</label>
              <input 
                type="text" 
                className="form-input" 
                value={period} 
                onChange={e => setPeriod(e.target.value)}
                placeholder="e.g. Q1 2026 or April 2026"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Amount Due</label>
              <input 
                type="number" 
                className="form-input" 
                value={amountDue} 
                onChange={e => setAmountDue(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Amount Paid (Optional)</label>
              <input 
                type="number" 
                className="form-input" 
                value={amountPaid} 
                onChange={e => setAmountPaid(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Due Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={dueDate} 
                onChange={e => setDueDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label>Notes</label>
              <textarea 
                className="form-input" 
                value={notes} 
                onChange={e => setNotes(e.target.value)}
                rows="2"
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Add Record
            </button>
          </form>
        </div>

        {/* Tax Records Table */}
        <div className="redesign-card" style={{ overflowX: 'auto' }}>
          <h3 style={{ marginBottom: '16px' }}>Compliance Status</h3>
          {taxes.length > 0 ? (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tax Type</th>
                  <th>Period</th>
                  <th>Due Date</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map(tax => (
                  <tr key={tax.id}>
                    <td>{tax.tax_type}</td>
                    <td>{tax.period}</td>
                    <td>{new Date(tax.due_date).toLocaleDateString()}</td>
                    <td>{formatCurrency(tax.amount_due)}</td>
                    <td>{formatCurrency(tax.amount_paid)}</td>
                    <td>
                      <span className={`badge ${tax.status === 'paid' ? 'badge-success' : tax.status === 'overdue' ? 'badge-danger' : 'badge-warning'}`}>
                        {tax.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
              No tax compliance records found.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
