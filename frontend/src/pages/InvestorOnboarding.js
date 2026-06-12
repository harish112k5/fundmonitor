import React, { useState, useEffect } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import toast from 'react-hot-toast';

export default function InvestorOnboarding() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  
  // State for IDs created during the process
  const [investorId, setInvestorId] = useState(null);
  const [projectId, setProjectId] = useState('');
  const [commitmentId, setCommitmentId] = useState(null);

  // Form Data
  const [formData, setFormData] = useState({
    investor_type: 'Individual',
    name: '',
    email: '',
    phone: '',
    pan_id: '',
    proposed_amount: '',
    expected_roi_percent: 15,
    installments: 1
  });

  useEffect(() => {
    API.get('/projects').then(res => setProjects(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        // Register Investor
        const res = await API.post('/investors/register', formData);
        setInvestorId(res.data.investor_id);
        toast.success('Investor registered successfully');
        setStep(2);
      } else if (step === 2) {
        // Assign Project
        if (!projectId) return toast.error('Please select a project');
        await API.post(`/investors/${investorId}/assign-project`, { project_id: projectId });
        toast.success('Project assigned successfully');
        setStep(3);
      } else if (step === 3) {
        // Propose Investment & Auto-Accept for Demo
        const propRes = await API.post('/investors/proposals/create', {
          investor_id: investorId,
          project_id: projectId,
          proposed_amount: formData.proposed_amount,
          expected_roi_percent: formData.expected_roi_percent,
        });
        
        // Auto-accept it to create commitment
        await API.post(`/investors/proposals/${propRes.data.proposal_id}/response`, {
          response_action: 'Accept'
        });
        
        // Fetch commitment ID (simplified)
        const commRes = await API.get(`/investors/commitments/investor/${investorId}`);
        if (commRes.data.length > 0) {
          setCommitmentId(commRes.data[commRes.data.length - 1].commitment_id);
          toast.success('Proposal accepted and Commitment created');
          setStep(4);
        }
      } else if (step === 4) {
        // Create Schedule
        const amountPerInst = parseFloat(formData.proposed_amount) / formData.installments;
        const schedules = [];
        let date = new Date();
        for (let i = 1; i <= formData.installments; i++) {
          date.setMonth(date.getMonth() + 1);
          schedules.push({
            installment_number: i,
            scheduled_amount: amountPerInst,
            scheduled_due_date: date.toISOString().split('T')[0]
          });
        }
        await API.post(`/investors/commitments/${commitmentId}/schedule`, { schedules });
        toast.success('Funding Schedule created! Onboarding Complete.');
        setStep(5);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', padding: '24px', color: 'var(--text-primary)' }}>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>Investor Onboarding</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>4-Step wizard to onboard a new investor</p>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', backgroundColor: 'var(--border)', zIndex: 0, transform: 'translateY(-50%)' }}></div>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ 
              width: '40px', height: '40px', borderRadius: '50%', 
              backgroundColor: step >= s ? '#3B82F6' : 'var(--bg-input)',
              border: `2px solid ${step >= s ? '#3B82F6' : 'var(--border)'}`,
              color: step >= s ? '#FFF' : 'var(--text-secondary)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '16px', zIndex: 1,
              transition: 'all 0.3s'
            }}>
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>Step 1: Basic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Type</label>
                <select name="investor_type" value={formData.investor_type} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                  <option>Individual</option><option>Organization</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Name *</label>
                <input name="name" value={formData.name} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>PAN / Tax ID</label>
                <input name="pan_id" value={formData.pan_id} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>Step 2: Project Assignment</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Select Project *</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }}>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>Step 3: Investment Proposal</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Proposed Amount (₹) *</label>
                <input type="number" name="proposed_amount" value={formData.proposed_amount} onChange={handleChange} required style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Expected ROI (%)</label>
                <input type="number" name="expected_roi_percent" value={formData.expected_roi_percent} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.5s' }}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>Step 4: Funding Schedule</h3>
            <div style={{ backgroundColor: '#10B98122', border: '1px solid #10B981', color: '#10B981', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '600' }}>
              Total Commitment: ₹{parseFloat(formData.proposed_amount || 0).toLocaleString('en-IN')}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>Number of Installments (Monthly)</label>
              <input type="number" min="1" max="120" name="installments" value={formData.installments} onChange={handleChange} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }} />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              This will automatically generate equal monthly installments starting next month.
            </p>
          </div>
        )}

        {/* SUCCESS */}
        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.5s' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Onboarding Complete!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>The investor has been successfully registered and schedules created.</p>
            <button onClick={() => window.location.href='/finance/investor-dashboard'} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>
              Go to Dashboard
            </button>
          </div>
        )}

        {step < 5 && (
          <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <button onClick={handleNext} disabled={loading} style={{ padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#3B82F6', color: 'var(--text-primary)', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}>
              {loading ? 'Processing...' : (step === 4 ? 'Finish Setup' : 'Next Step →')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
