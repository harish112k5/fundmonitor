import React, { useState, useEffect } from 'react';
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
        toast.success('Investor registered');
        setStep(2);
      } else if (step === 2) {
        // Assign Project
        if (!projectId) return toast.error('Please select a project');
        await API.post(`/investors/${investorId}/assign-project`, { project_id: projectId });
        toast.success('Project assigned');
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
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Investor Onboarding</h1>
          <p>4-Step wizard to onboard a new investor</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          {[1,2,3,4].map(s => (
            <div key={s} style={{ 
              width: '30px', height: '30px', borderRadius: '50%', 
              background: step >= s ? 'var(--primary)' : 'var(--border-color)',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {s}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div>
            <h3>Step 1: Basic Information</h3>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-input" name="investor_type" value={formData.investor_type} onChange={handleChange}>
                <option>Individual</option><option>Organization</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input className="form-input" type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">PAN ID</label>
              <input className="form-input" name="pan_id" value={formData.pan_id} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3>Step 2: Project Assignment</h3>
            <div className="form-group">
              <label className="form-label">Select Project *</label>
              <select className="form-input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">-- Select Project --</option>
                {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3>Step 3: Investment Proposal</h3>
            <div className="form-group">
              <label className="form-label">Proposed Amount (₹) *</label>
              <input className="form-input" type="number" name="proposed_amount" value={formData.proposed_amount} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Expected ROI (%)</label>
              <input className="form-input" type="number" name="expected_roi_percent" value={formData.expected_roi_percent} onChange={handleChange} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h3>Step 4: Funding Schedule</h3>
            <p>Total Commitment: ₹{formData.proposed_amount}</p>
            <div className="form-group">
              <label className="form-label">Number of Installments (Monthly)</label>
              <input className="form-input" type="number" min="1" max="120" name="installments" value={formData.installments} onChange={handleChange} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              This will automatically generate equal monthly installments starting next month.
            </p>
          </div>
        )}

        {step === 5 && (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <h2>✅ Onboarding Complete</h2>
            <p>The investor has been fully setup with commitment schedules.</p>
            <button className="btn btn-secondary" onClick={() => window.location.href='/investors'}>Go to Dashboard</button>
          </div>
        )}

        {step < 5 && (
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleNext} disabled={loading}>
              {loading ? 'Processing...' : (step === 4 ? 'Finish Onboarding' : 'Next Step')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

