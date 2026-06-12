/**
 * Universal formatters for the frontend application
 */

// Format numbers as Indian Rupees
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format numbers as Indian Rupees without decimals
export const formatCurrencyCompact = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format Date as DD-MM-YYYY
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Get a color based on status string
export const getStatusColor = (status) => {
  if (!status) return '#94A3B8';
  
  const s = status.toLowerCase();
  if (['active', 'paid', 'approved', 'completed', 'certified'].includes(s)) return '#10B981';
  if (['pending', 'submitted', 'in progress', 'partial exit', 'partially_paid'].includes(s)) return '#F59E0B';
  if (['rejected', 'overdue', 'defaulted', 'cancelled', 'deleted'].includes(s)) return '#EF4444';
  if (['closed', 'exited', 'billable'].includes(s)) return '#64748B';
  
  return '#94A3B8'; // Default grey
};

// Return style object for a status badge
export const getStatusBadgeStyle = (status) => ({
  display: 'inline-block',
  padding: '4px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '600',
  backgroundColor: getStatusColor(status) + '22',
  color: getStatusColor(status),
  textTransform: 'capitalize'
});
