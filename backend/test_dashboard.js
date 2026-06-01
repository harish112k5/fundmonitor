const db = require('./db');

async function test() {
  try {
    console.log('Testing stats...');
    await db.query(`SELECT COUNT(*) FROM projects`);
    
    console.log('Testing budget-comparison...');
    const [projects] = await db.query(`SELECT p.project_id, p.project_name, p.estimated_budget, p.status FROM projects p WHERE p.is_deleted = 0 ORDER BY p.project_id`);
    for (const proj of projects) {
        await db.query('SELECT COALESCE(SUM(quantity * unit_price), 0) AS cost FROM material_usage WHERE project_id = ?', [proj.project_id]);
    }
    
    console.log('Testing material-summary...');
    await db.query(`SELECT mm.material_id FROM materials_master mm LEFT JOIN material_usage mu ON mm.material_id = mu.material_id`);
    
    console.log('Testing alerts (overdue Bills)...');
    await db.query(`SELECT b.billing_id, b.invoice_number, b.amount, b.due_date, p.project_name FROM billing b JOIN projects p ON b.project_id = p.project_id WHERE b.status IN ('sent', 'draft') AND b.due_date < CURDATE()`);

    console.log('Testing alerts (pending interest)...');
    await db.query(`SELECT ip.id, ip.amount, ip.payment_date, ip.status, pl.principal, pl.interest_rate, p.project_name, f.name AS financier_name FROM interest_payments ip JOIN project_loans pl ON ip.loan_id = pl.id JOIN projects p ON pl.project_id = p.project_id JOIN financiers f ON pl.financier_id = f.financier_id WHERE ip.status = 'pending'`);

    console.log('Testing alerts (projects over budget)...');
    for (const proj of projects) {
        await db.query(`SELECT (COALESCE((SELECT SUM(quantity * unit_price) FROM material_usage WHERE project_id = ?), 0) ) AS actual_cost`, [proj.project_id]);
    }

    console.log('Testing recent...');
    await db.query(`SELECT e.expense_id, p.project_name, e.amount, ec.category_name, e.expense_date, 'expense' AS type FROM expenses e JOIN projects p ON e.project_id = p.project_id JOIN expense_categories ec ON e.category_id = ec.category_id`);

    console.log('ALL QUERIES PASSED!');
  } catch (err) {
    console.error('QUERY FAILED:', err);
  } finally {
    process.exit(0);
  }
}
test();
