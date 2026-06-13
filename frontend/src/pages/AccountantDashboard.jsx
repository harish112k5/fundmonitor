import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineDocumentText,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineCash,
  HiOutlineExclamationCircle
} from 'react-icons/hi';
import AnimatedKPICard from '../components/AnimatedKPICard';

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [billsRes, expRes] = await Promise.all([
          API.get('/billing'),
          API.get('/expenses')
        ]);
        
        const bills = billsRes.data || [];
        const expenses = expRes.data || [];

        // Calculate simple metrics
        const totalBilled = bills.reduce((sum, b) => sum + Number(b.billable_amount || b.amount || 0), 0);
        const totalReceived = bills.reduce((sum, b) => sum + Number(b.received_amount || 0), 0);
        const pendingBills = bills.filter(b => b.billing_stage !== 'PAYMENT_RECEIVED' && b.status !== 'Paid');
        
        const thisMonth = new Date().toISOString().slice(0, 7);
        const thisMonthExp = expenses
          .filter(e => e.expense_date?.startsWith(thisMonth))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        setStats({
          totalBilled,
          totalReceived,
          pendingAmount: totalBilled - totalReceived,
          pendingCount: pendingBills.length,
          thisMonthExp
        });
      } catch (err) {
        console.error('Failed to load accountant stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (n) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 8
  };

  const actionStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
    borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 16,
    cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text-primary)'
  };

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, margin: 0 }}>Accounting Command Center</h1>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: 14 }}>System-wide financial overview</p>
          </div>
        </div>

        {loading ? (
          <SkeletonTable rows={5} />
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <AnimatedKPICard index={1} label="Total Billed" value={stats?.totalBilled} isMoney={true} icon={HiOutlineDocumentText} accentColor="#10B981" />
              <AnimatedKPICard index={2} label="Pending Receivables" value={stats?.pendingAmount} isMoney={true} icon={HiOutlineExclamationCircle} accentColor="#EF4444" subtitle={`${stats?.pendingCount || 0} invoices pending`} />
              <AnimatedKPICard index={3} label="Month Expenses" value={stats?.thisMonthExp} isMoney={true} icon={HiOutlineCurrencyDollar} accentColor="#F59E0B" />
              <AnimatedKPICard index={4} label="Total Received" value={stats?.totalReceived} isMoney={true} icon={HiOutlineCash} accentColor="var(--accent)" />
            </div>

            {/* Quick Actions */}
            <h2 style={{ color: 'var(--text-primary)', fontSize: 18, marginBottom: 16 }}>Quick Navigation</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={actionStyle} onClick={() => navigate('/billing')}
                   onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-accent)'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div style={{ background: 'var(--accent-glow)', color: 'var(--text-accent)', padding: 16, borderRadius: '50%' }}>
                  <HiOutlineDocumentText size={32} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Client Billing</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Manage invoices and payment stages</div>
                </div>
              </div>

              <div style={actionStyle} onClick={() => navigate('/expenses')}
                   onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-accent)'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: 16, borderRadius: '50%' }}>
                  <HiOutlineCurrencyDollar size={32} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Site Expenses</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Track indirect and direct site expenses</div>
                </div>
              </div>

              <div style={actionStyle} onClick={() => navigate('/budget-comparison')}
                   onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-accent)'}
                   onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: 16, borderRadius: '50%' }}>
                  <HiOutlineChartBar size={32} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Budget Analysis</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Compare estimated vs actual costs</div>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatedItem>
    </PageWrapper>
  );
}
