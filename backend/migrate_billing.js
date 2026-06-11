require('dotenv').config();
const mysql = require('mysql2/promise');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'constructiondata'
  });

  try {
    console.log('Running migration on billing table...');
    await connection.query(`
      ALTER TABLE billing
        ADD COLUMN IF NOT EXISTS billable_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Work completed, eligible to raise invoice',
        ADD COLUMN IF NOT EXISTS submitted_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Amount in RA Bill sent to client/government',
        ADD COLUMN IF NOT EXISTS certified_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Amount officially approved by client/govt engineer',
        ADD COLUMN IF NOT EXISTS payment_received DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Amount actually credited to bank',
        ADD COLUMN IF NOT EXISTS mb_reference VARCHAR(100) DEFAULT NULL COMMENT 'Measurement Book reference number',
        ADD COLUMN IF NOT EXISTS billing_stage ENUM('BILLABLE','SUBMITTED','CERTIFIED','PAYMENT_RECEIVED','PARTIALLY_PAID') DEFAULT 'BILLABLE' COMMENT 'Current stage in the billing lifecycle',
        ADD COLUMN IF NOT EXISTS certified_date DATE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS rejection_amount DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Amount rejected/deducted by govt during certification',
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;
    `);
    
    console.log('Running migration on projects table...');
    await connection.query(`
      ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS work_completed_percent DECIMAL(5,2) DEFAULT 0.00;
    `);

    console.log('Verifying billing columns...');
    const [rows] = await connection.query('DESCRIBE billing');
    console.log(rows.map(r => r.Field).join(', '));

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
