export const formatINR = (val) => {
  if (val === null || val === undefined) return '₹0';
  return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

export const statusColor = (status) => {
  const map = {
    Active: '#10B981', Closed: '#64748B', Overdue: '#EF4444',
    Paid: '#10B981', Pending: '#F59E0B', Defaulted: '#EF4444',
    'Partial Exit': '#F59E0B', Exited: '#64748B'
  };
  return map[status] || '#94A3B8';
};

export const statusBadge = (status) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  backgroundColor: statusColor(status) + '22',
  color: statusColor(status)
});
