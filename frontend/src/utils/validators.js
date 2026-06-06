// ── Phone ──────────────────────────────────────────────
// Indian mobile: 10 digits, starts with 6-9
export const isValidPhone = (v) => /^[6-9]\d{9}$/.test(v);
export const formatPhoneInput = (v) => v.replace(/\D/g, '').slice(0, 10);

// ── PAN ────────────────────────────────────────────────
// Format: ABCDE1234F — 5 uppercase letters, 4 digits, 1 uppercase letter
export const isValidPAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
export const formatPANInput = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

// ── GST ────────────────────────────────────────────────
// Format: 22ABCDE1234F1Z5 — 15 chars
export const isValidGST = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
export const formatGSTInput = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);

// ── Email ───────────────────────────────────────────────
export const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ── Amount ─────────────────────────────────────────────
// Positive number only, up to 2 decimals
export const isValidAmount = (v) => /^\d+(\.\d{0,2})?$/.test(v) && parseFloat(v) > 0;
export const formatAmountInput = (v) => v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

// ── Interest Rate ──────────────────────────────────────
// 0.01 to 100
export const isValidRate = (v) => {
  const n = parseFloat(v);
  return !isNaN(n) && n >= 0 && n <= 100;
};

// ── Tenure ─────────────────────────────────────────────
// 1 to 600 months (50 years max)
export const isValidTenure = (v) => {
  const n = parseInt(v);
  return !isNaN(n) && n >= 1 && n <= 600;
};

// ── Master validator — returns { valid: bool, errors: {} } ──
export function validateInvestorForm(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Full name is required';
  if (form.phone && !isValidPhone(form.phone)) errors.phone = 'Enter valid 10-digit mobile number';
  if (form.email && !isValidEmail(form.email)) errors.email = 'Enter valid email address';
  if (form.pan && !isValidPAN(form.pan)) errors.pan = 'PAN format: ABCDE1234F';
  if (form.gst && !isValidGST(form.gst)) errors.gst = 'GST format: 22ABCDE1234F1Z5';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateFinancierForm(form) {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Name is required';
  if (form.phone && !isValidPhone(form.phone)) errors.phone = 'Enter valid 10-digit mobile number';
  if (form.email && !isValidEmail(form.email)) errors.email = 'Enter valid email address';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateInvestmentForm(form) {
  const errors = {};
  if (!form.project_id) errors.project_id = 'Select a project';
  if (!form.investor_id) errors.investor_id = 'Select an investor';
  if (!form.amount || !isValidAmount(String(form.amount))) errors.amount = 'Enter valid amount (positive number)';
  if (!form.investment_date) errors.investment_date = 'Select investment date';
  if (form.expected_return && !isValidAmount(String(form.expected_return))) errors.expected_return = 'Enter valid amount';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateLoanForm(form) {
  const errors = {};
  if (!form.project_id) errors.project_id = 'Select a project';
  if (!form.financier_id) errors.financier_id = 'Select a financier';
  if (!form.principal || !isValidAmount(String(form.principal))) errors.principal = 'Enter valid principal amount';
  if (form.interest_rate === '' || form.interest_rate === undefined || !isValidRate(form.interest_rate)) errors.interest_rate = 'Enter rate between 0 and 100';
  if (!isValidTenure(form.tenure_months)) errors.tenure_months = 'Enter tenure between 1 and 600 months';
  if (!form.start_date) errors.start_date = 'Select start date';
  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateInterestPaymentForm(form) {
  const errors = {};
  if (!form.loan_id) errors.loan_id = 'Select a loan';
  if (!form.amount || !isValidAmount(String(form.amount))) errors.amount = 'Enter valid payment amount';
  if (!form.due_date) errors.due_date = 'Select due date';
  return { valid: Object.keys(errors).length === 0, errors };
}
