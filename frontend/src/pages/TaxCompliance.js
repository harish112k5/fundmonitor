import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';

const fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

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
          setSelectedProject(res.data[0].project_id || res.data[0].id);
        }
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  const loadTaxes = () => {
    if (!selectedProject) return;
    setLoading(true);
    API.get(`/finance/tax/${selectedProject}`)
      .then(res => setTaxes(res.data.taxes || []))
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
    return <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>Loading...</div>;
  }

  const totalDue = taxes.reduce((s, t) => s + parseFloat(t.amount_due || 0), 0);
  const totalPaid = taxes.reduce((s, t) => s + parseFloat(t.amount_paid || 0), 0);
  const totalPending = Math.max(0, totalDue - totalPaid);

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Tax Compliance</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Track tax liabilities, GST/VAT, and statutory filings</p>
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

      {/* ROW 1: KPI CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #3B82F6', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Tax Liability</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#3B82F6' }}>{fmt(totalDue)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #10B981', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Paid</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#10B981' }}>{fmt(totalPaid)}</div>
        </div>
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '4px solid #EF4444', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>Total Pending</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#EF4444' }}>{fmt(totalPending)}</div>
        </div>
      </div>

      {/* ROW 2: LEFT/RIGHT SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* LEFT: FORM */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Add Tax Record</h3>
          <form onSubmit={handleAddTax} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Tax Type</label>
              <input type="text" value={taxType} onChange={e => setTaxType(e.target.value)} required placeholder="e.g. GST, TDS" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Filing Period</label>
              <input type="text" value={period} onChange={e => setPeriod(e.target.value)} required placeholder="e.g. Q1 2026" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Amount Due</label>
                <input type="number" value={amountDue} onChange={e => setAmountDue(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Amount Paid</label>
                <input type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', resize: 'none' }}></textarea>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: '#FFF', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>
              Add Record
            </button>
          </form>
        </div>

        {/* RIGHT: TABLE */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)', fontSize: '16px', fontWeight: '600' }}>Compliance Status</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Type</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Period</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Due Date</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Due</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Paid</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {taxes.length > 0 ? taxes.map(tax => (
                  <tr key={tax.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: '600' }}>{tax.tax_type}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>{tax.period}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>{new Date(tax.due_date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 10px', color: '#EF4444', fontWeight: '500' }}>{fmt(tax.amount_due)}</td>
                    <td style={{ padding: '12px 10px', color: '#10B981', fontWeight: '500' }}>{fmt(tax.amount_paid)}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ 
                        backgroundColor: tax.status === 'paid' ? '#10B98122' : tax.status === 'overdue' ? '#EF444422' : '#F59E0B22', 
                        color: tax.status === 'paid' ? '#10B981' : tax.status === 'overdue' ? '#EF4444' : '#F59E0B', 
                        borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' 
                      }}>
                        {tax.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
