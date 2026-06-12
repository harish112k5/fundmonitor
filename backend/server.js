const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test DB connection
const db = require('./db');
db.query('SELECT 1')
  .then(() => console.log('✅ MySQL Connected'))
  .catch(err => console.error('❌ MySQL Connection Error:', err.message));

// Auth routes (public — no token needed)
app.use('/api/auth', require('./routes/auth'));

const { authMiddleware } = require('./middleware/auth');
app.use('/api', authMiddleware);


// All other API routes
app.use('/api/roles', require('./routes/roles'));
app.use('/api/users', require('./routes/users'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/machines', require('./routes/machines'));
app.use('/api/worker-roles', require('./routes/workerRoles'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/material-usage', require('./routes/materialUsage'));
app.use('/api/manpower-usage', require('./routes/manpowerUsage'));
app.use('/api/machine-usage', require('./routes/machineUsage'));
app.use('/api/investors', require('./routes/investors'));
app.use('/api/financiers', require('./routes/financiers'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/interest-payments', require('./routes/interestPayments'));
app.use('/api/expense-categories', require('./routes/expenseCategories'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/project-progress', require('./routes/projectProgress'));
app.use('/api/project-team', require('./routes/projectTeam'));
app.use('/api/audit-log', require('./routes/auditLog'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/recycle-bin', require('./routes/recycleBin'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/import', require('./routes/import'));
app.use('/api/finance', require('./routes/finance'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Budget vs Actual module
app.use('/api/budget-actual',     require('./routes/budgetActual'));

// ─────────────────────── Error handler ───────────────────────────────

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📋 API endpoints available at /api/*`);
});