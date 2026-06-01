const db = require('./db');

async function testDetails() {
  const pid = 20;
  try {
    console.log('Testing /details for project 20...');
    
    // 2. Progress
    const [[progressRow]] = await db.query(`SELECT progress_percentage, remarks, month, year FROM project_progress WHERE project_id = ? ORDER BY year DESC, month DESC LIMIT 1`, [pid]);
    
    // 3. Financials
    await db.query(`SELECT COALESCE(SUM(quantity * unit_price), 0) AS cost FROM material_usage WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(work_days * daily_rate), 0) AS cost FROM manpower_usage WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(usage_hours * hourly_rate), 0) AS cost FROM machine_usage WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(amount), 0) AS cost FROM expenses WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM project_investments WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(principal), 0) AS total FROM project_loans WHERE project_id = ?`, [pid]);
    await db.query(`SELECT COALESCE(SUM(ip.amount), 0) AS total FROM interest_payments ip JOIN project_loans pl ON ip.loan_id = pl.id WHERE pl.project_id = ? AND ip.status != 'paid'`, [pid]);
    await db.query(`SELECT COALESCE(SUM(amount), 0) AS total_billed, SUM(CASE WHEN status != 'paid' THEN 1 ELSE 0 END) AS pending_count FROM billing WHERE project_id = ?`, [pid]);

    // 4. Material Usage
    await db.query(`SELECT mm.material_name, mu.quantity, mm.unit, mu.unit_price, ROUND(mu.quantity * mu.unit_price, 2) AS total_cost, mu.usage_date FROM material_usage mu JOIN materials_master mm ON mu.material_id = mm.material_id WHERE mu.project_id = ? ORDER BY mu.usage_date DESC`, [pid]);

    // 5. Manpower Usage
    await db.query(`SELECT w.name AS worker_name, mu.work_days, mu.daily_rate, ROUND(mu.work_days * mu.daily_rate, 2) AS total_cost, mu.work_date FROM manpower_usage mu JOIN workers w ON mu.worker_id = w.worker_id WHERE mu.project_id = ? ORDER BY mu.work_date DESC`, [pid]);

    // 6. Machine Usage
    await db.query(`SELECT mm.machine_name, mu.usage_hours, mu.hourly_rate, ROUND(mu.usage_hours * mu.hourly_rate, 2) AS total_cost, mu.usage_date FROM machine_usage mu JOIN machines_master mm ON mu.machine_id = mm.machine_id WHERE mu.project_id = ? ORDER BY mu.usage_date DESC`, [pid]);

    // 7. Project Team
    await db.query(`SELECT u.name AS user_name, pt.role, pt.joined_at AS assigned_date FROM project_team pt JOIN users u ON pt.user_id = u.user_id WHERE pt.project_id = ? ORDER BY pt.joined_at DESC`, [pid]);

    // 8. Billing
    await db.query(`SELECT invoice_number, amount, status, due_date FROM billing WHERE project_id = ? ORDER BY due_date DESC`, [pid]);

    // 9. Expenses
    await db.query(`SELECT ec.category_name, e.description, e.amount, e.expense_date FROM expenses e JOIN expense_categories ec ON e.category_id = ec.category_id WHERE e.project_id = ? ORDER BY e.expense_date DESC`, [pid]);

    console.log('ALL DETAILS QUERIES PASSED!');
  } catch (err) {
    console.error('QUERY FAILED:', err);
  } finally {
    process.exit(0);
  }
}
testDetails();
