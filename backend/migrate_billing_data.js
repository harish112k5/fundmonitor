require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'constructiondata'
  });

  try {
    console.log('Migrating existing billing data...');

    // Copy existing amount into billable_amount, submitted_amount, certified_amount where they are 0
    await connection.query(`
      UPDATE billing 
      SET billable_amount = amount, submitted_amount = amount, certified_amount = amount
      WHERE billable_amount = 0 AND amount > 0
    `);

    // Map old status to new billing_stage
    await connection.query(`UPDATE billing SET billing_stage = 'BILLABLE' WHERE status IN ('draft', 'pending', 'DRAFT', 'PENDING') AND billing_stage = 'BILLABLE'`);
    await connection.query(`UPDATE billing SET billing_stage = 'SUBMITTED' WHERE status IN ('sent', 'SENT', 'overdue', 'OVERDUE', 'active') AND billing_stage = 'BILLABLE'`);
    await connection.query(`UPDATE billing SET billing_stage = 'PAYMENT_RECEIVED' WHERE status IN ('paid', 'PAID') AND billing_stage = 'BILLABLE'`);

    // For PAYMENT_RECEIVED, also set payment_received = certified_amount
    await connection.query(`
      UPDATE billing 
      SET payment_received = certified_amount 
      WHERE billing_stage = 'PAYMENT_RECEIVED' AND payment_received = 0 AND certified_amount > 0
    `);

    const [results] = await connection.query(`SELECT billing_stage, COUNT(*) as cnt FROM billing GROUP BY billing_stage`);
    console.log('Migration results:');
    results.forEach(r => console.log(`  ${r.billing_stage}: ${r.cnt} records`));

    console.log('Data migration completed.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrateData();
