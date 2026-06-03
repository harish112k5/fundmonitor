const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper to get total costs
async function getProjectCosts(projectId) {
  const [mat] = await pool.query('SELECT SUM(quantity * unit_price) as total FROM material_usage WHERE project_id = ?', [projectId]);
  const [man] = await pool.query('SELECT SUM(work_days * daily_rate) as total FROM manpower_usage WHERE project_id = ?', [projectId]);
  const [mac] = await pool.query('SELECT SUM(usage_hours * hourly_rate) as total FROM machine_usage WHERE project_id = ?', [projectId]);
  const [exp] = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE project_id = ?', [projectId]);

  return {
    material: parseFloat(mat[0].total || 0),
    manpower: parseFloat(man[0].total || 0),
    machine: parseFloat(mac[0].total || 0),
    other: parseFloat(exp[0].total || 0),
    total: parseFloat(mat[0].total || 0) + parseFloat(man[0].total || 0) + parseFloat(mac[0].total || 0) + parseFloat(exp[0].total || 0)
  };
}

// Helper to get revenues
async function getProjectRevenues(projectId) {
  const [rev] = await pool.query("SELECT SUM(amount) as total FROM billing WHERE project_id = ? AND status = 'paid'", [projectId]);
  const [pending] = await pool.query("SELECT SUM(amount) as total FROM billing WHERE project_id = ? AND status != 'paid'", [projectId]);
  
  return {
    paid: parseFloat(rev[0].total || 0),
    pending: parseFloat(pending[0].total || 0),
    total: parseFloat(rev[0].total || 0) + parseFloat(pending[0].total || 0)
  };
}

// Helper to get funding
async function getProjectFunding(projectId) {
  const [inv] = await pool.query('SELECT SUM(amount) as total FROM project_investments WHERE project_id = ?', [projectId]);
  const [loan] = await pool.query('SELECT SUM(principal) as total FROM project_loans WHERE project_id = ?', [projectId]);
  
  return {
    investments: parseFloat(inv[0].total || 0),
    loans: parseFloat(loan[0].total || 0),
    total: parseFloat(inv[0].total || 0) + parseFloat(loan[0].total || 0)
  };
}

// IRR Calculator function
function calculateIRR(cashFlows, guess = 0.1) {
  if (!cashFlows || cashFlows.length < 2) return 0;
  const maxTries = 100;
  const tolerance = 1e-5;
  let rate = guess;
  for (let i = 0; i < maxTries; i++) {
    let npv = 0;
    let npvDerivative = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      if (t > 0) {
        npvDerivative -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
      }
    }
    if (Math.abs(npvDerivative) < 1e-9) break;
    const newRate = rate - npv / npvDerivative;
    if (Math.abs(newRate - rate) < tolerance) return (newRate * 100).toFixed(2);
    rate = newRate;
  }
  return 0;
}

// 1. Dashboard Metrics
router.get('/dashboard/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const costs = await getProjectCosts(projectId);
    const revenues = await getProjectRevenues(projectId);
    const funding = await getProjectFunding(projectId);
    
    const netProfit = revenues.paid - costs.total;
    const roi = funding.total > 0 ? (netProfit / funding.total) * 100 : 0;
    
    // Trend data (monthly cash flow)
    const [monthlyData] = await pool.query(`
      SELECT 
        DATE_FORMAT(usage_date, '%Y-%m') as month,
        SUM(quantity * unit_price) as cost
      FROM material_usage WHERE project_id = ? AND usage_date IS NOT NULL GROUP BY month
      UNION ALL
      SELECT DATE_FORMAT(work_date, '%Y-%m') as month, SUM(work_days * daily_rate) as cost FROM manpower_usage WHERE project_id = ? AND work_date IS NOT NULL GROUP BY month
      UNION ALL
      SELECT DATE_FORMAT(usage_date, '%Y-%m') as month, SUM(usage_hours * hourly_rate) as cost FROM machine_usage WHERE project_id = ? AND usage_date IS NOT NULL GROUP BY month
      UNION ALL
      SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as cost FROM expenses WHERE project_id = ? AND expense_date IS NOT NULL GROUP BY month
    `, [projectId, projectId, projectId, projectId]);

    const [monthlyRev] = await pool.query(`
      SELECT DATE_FORMAT(billing_date, '%Y-%m') as month, SUM(amount) as revenue
      FROM billing WHERE project_id = ? AND status = 'paid' AND billing_date IS NOT NULL GROUP BY month
    `, [projectId]);

    // Aggregate monthly
    const trendMap = {};
    monthlyData.forEach(r => {
      if(!trendMap[r.month]) trendMap[r.month] = { month: r.month, cost: 0, revenue: 0 };
      trendMap[r.month].cost += parseFloat(r.cost || 0);
    });
    monthlyRev.forEach(r => {
      if(!trendMap[r.month]) trendMap[r.month] = { month: r.month, cost: 0, revenue: 0 };
      trendMap[r.month].revenue += parseFloat(r.revenue || 0);
    });
    
    const trends = Object.values(trendMap).sort((a,b) => a.month.localeCompare(b.month)).map(t => ({
      ...t,
      profit: t.revenue - t.cost
    }));

    // Calculate IRR
    // Initial investment is negative, followed by monthly profits
    const initialInvestment = funding.total > 0 ? -funding.total : -costs.total;
    const cashFlows = [initialInvestment, ...trends.map(t => t.profit)];
    const irr = calculateIRR(cashFlows);

    res.json({
      metrics: {
        totalRevenue: revenues.paid,
        pendingRevenue: revenues.pending,
        totalCosts: costs.total,
        netProfit,
        roi: parseFloat(roi.toFixed(2)),
        irr: parseFloat(irr),
        totalFunding: funding.total
      },
      costBreakdown: [
        { name: 'Materials', value: costs.material },
        { name: 'Labor', value: costs.manpower },
        { name: 'Equipment', value: costs.machine },
        { name: 'Other Expenses', value: costs.other }
      ],
      trends
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// 2. Budget Master Endpoints
router.get('/budget/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const [budgets] = await pool.query('SELECT * FROM budget_master WHERE project_id = ?', [projectId]);
    
    if (budgets.length === 0) {
      return res.json({ master: null, details: [], analysis: [] });
    }
    
    const master = budgets[0];
    const [details] = await pool.query('SELECT * FROM budget_details WHERE budget_id = ?', [master.budget_id]);
    
    const costs = await getProjectCosts(projectId);
    
    // Map actual costs to budget categories
    const analysis = details.map(d => {
      let actual = 0;
      if (d.category.toLowerCase().includes('material')) actual = costs.material;
      else if (d.category.toLowerCase().includes('labor') || d.category.toLowerCase().includes('manpower')) actual = costs.manpower;
      else if (d.category.toLowerCase().includes('equipment') || d.category.toLowerCase().includes('machine')) actual = costs.machine;
      else actual = costs.other;
      
      return {
        category: d.category,
        budgeted: parseFloat(d.allocated_amount),
        actual,
        variance: parseFloat(d.allocated_amount) - actual,
        usedPercentage: parseFloat(d.allocated_amount) > 0 ? (actual / parseFloat(d.allocated_amount)) * 100 : 0
      };
    });
    
    res.json({ master, details, analysis });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch budget data' });
  }
});

router.post('/budget/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { budget_name, total_amount, details } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO budget_master (project_id, budget_name, total_amount, status) VALUES (?, ?, ?, ?)',
      [projectId, budget_name, total_amount, 'active']
    );
    
    const budgetId = result.insertId;
    
    if (details && details.length > 0) {
      const values = details.map(d => [budgetId, d.category, d.allocated_amount]);
      await pool.query(
        'INSERT INTO budget_details (budget_id, category, allocated_amount) VALUES ?',
        [values]
      );
    }
    
    res.json({ success: true, budgetId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

router.get('/statements/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Calculate P&L components
    const costs = await getProjectCosts(projectId);
    const revenues = await getProjectRevenues(projectId);
    
    // Simple P&L structure
    const pnl = [
      { id: 1, item: 'Revenue (Paid)', amount: revenues.paid, type: 'income' },
      { id: 2, item: 'Pending Revenue', amount: revenues.pending, type: 'asset' },
      { id: 3, item: 'Material Costs', amount: costs.material, type: 'expense' },
      { id: 4, item: 'Labor Costs', amount: costs.manpower, type: 'expense' },
      { id: 5, item: 'Equipment Costs', amount: costs.machine, type: 'expense' },
      { id: 6, item: 'Overhead & Other', amount: costs.other, type: 'expense' }
    ];
    
    res.json({ pnl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate statements' });
  }
});

router.get('/ratios/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const costs = await getProjectCosts(projectId);
    const revenues = await getProjectRevenues(projectId);
    const funding = await getProjectFunding(projectId);

    // Current Assets: Cash + Receivables + Unused Inventory
    const cash = funding.total + revenues.paid - costs.total;
    const receivables = revenues.pending;
    const currentAssets = (cash > 0 ? cash : 0) + receivables;

    const currentLiabilities = funding.loans || 1; // Avoid divide by zero

    // Metrics
    const netSales = revenues.total || 0;
    const grossProfit = netSales - (costs.material + costs.manpower + costs.machine);
    const netIncome = grossProfit - costs.other;

    const totalAssets = currentAssets > 0 ? currentAssets : 1;
    const totalEquity = funding.investments > 0 ? funding.investments : 1;

    // Profitability
    const grossProfitRate = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const returnOnSales = netSales > 0 ? (netIncome / netSales) * 100 : 0;
    const returnOnAssets = (netIncome / totalAssets) * 100;
    const returnOnEquity = (netIncome / totalEquity) * 100;

    // Liquidity
    const currentRatio = currentAssets / currentLiabilities;
    const cashRatio = (cash > 0 ? cash : 0) / currentLiabilities;
    const netWorkingCapital = currentAssets - currentLiabilities;

    // Efficiency
    const totalAssetTurnover = netSales / totalAssets;

    // Leverage
    const debtRatio = funding.loans / totalAssets;
    const equityRatio = totalEquity / totalAssets;
    const debtToEquity = funding.loans / totalEquity;

    // Valuation
    const [corpResult] = await pool.query('SELECT * FROM corporate_metrics WHERE project_id = ?', [projectId]);
    const corp = corpResult[0] || { market_price_per_share: 100, common_shares_outstanding: 10000, preferred_dividends: 0 };
    
    const eps = (netIncome - parseFloat(corp.preferred_dividends || 0)) / parseFloat(corp.common_shares_outstanding || 1);
    const peRatio = eps > 0 ? (parseFloat(corp.market_price_per_share) / eps) : 0;
    
    res.json({
      profitability: { grossProfitRate, returnOnSales, returnOnAssets, returnOnEquity },
      liquidity: { currentRatio, cashRatio, netWorkingCapital },
      efficiency: { totalAssetTurnover },
      leverage: { debtRatio, equityRatio, debtToEquity },
      valuation: { eps, peRatio, marketPrice: corp.market_price_per_share, shares: corp.common_shares_outstanding }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate ratios' });
  }
});

router.get('/statements/full/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const costs = await getProjectCosts(projectId);
    const revenues = await getProjectRevenues(projectId);
    const funding = await getProjectFunding(projectId);

    const cash = funding.total + revenues.paid - costs.total;
    const receivables = revenues.pending;
    
    // Balance Sheet
    const balanceSheet = {
      assets: {
        current: [
          { name: 'Cash and Cash Equivalents', amount: cash > 0 ? cash : 0 },
          { name: 'Accounts Receivable', amount: receivables },
          { name: 'Inventory (Materials)', amount: 0 } // Mocked for now
        ],
        nonCurrent: [
          { name: 'Property, Plant & Equipment', amount: costs.machine }
        ]
      },
      liabilities: {
        current: [
          { name: 'Accounts Payable', amount: 0 },
          { name: 'Short-term Loans', amount: funding.loans }
        ]
      },
      equity: [
        { name: 'Owner Contributions / Investments', amount: funding.investments },
        { name: 'Retained Earnings', amount: revenues.total - costs.total }
      ]
    };

    // Cash Flow Statement
    const cashFlow = {
      operating: [
        { name: 'Cash received from customers', amount: revenues.paid },
        { name: 'Cash paid to suppliers/employees', amount: -(costs.total) }
      ],
      investing: [
        { name: 'Purchase of equipment', amount: -(costs.machine) }
      ],
      financing: [
        { name: 'Proceeds from loans', amount: funding.loans },
        { name: 'Proceeds from investors', amount: funding.investments }
      ]
    };

    res.json({ balanceSheet, cashFlow });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate full statements' });
  }
});

module.exports = router;
