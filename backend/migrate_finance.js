// Run this script to add missing columns to finance tables
// Usage: node migrate_finance.js

require('dotenv').config();
const db = require('./db');

async function migrate() {
  console.log('🔧 Starting finance module migration...\n');

  const alterations = [
    // ── investors table ──
    `ALTER TABLE investors ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Individual'`,
    `ALTER TABLE investors ADD COLUMN IF NOT EXISTS pan VARCHAR(20) DEFAULT NULL`,
    `ALTER TABLE investors ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL`,
    `ALTER TABLE investors ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,

    // ── financiers table ──
    `ALTER TABLE financiers ADD COLUMN IF NOT EXISTS company VARCHAR(200) DEFAULT NULL`,
    `ALTER TABLE financiers ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Bank'`,
    `ALTER TABLE financiers ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL`,
    `ALTER TABLE financiers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,

    // ── project_investments table ──
    `ALTER TABLE project_investments ADD COLUMN IF NOT EXISTS repaid_amount DECIMAL(15,2) DEFAULT 0`,
    `ALTER TABLE project_investments ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'`,
    `ALTER TABLE project_investments ADD COLUMN IF NOT EXISTS return_type VARCHAR(30) DEFAULT 'Fixed'`,
    `ALTER TABLE project_investments ADD COLUMN IF NOT EXISTS expected_return DECIMAL(10,2) DEFAULT 0`,
    `ALTER TABLE project_investments ADD COLUMN IF NOT EXISTS lock_in_months INT DEFAULT 0`,

    // ── project_loans table ──
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS interest_type VARCHAR(30) DEFAULT 'Simple'`,
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS tenure_months INT DEFAULT 12`,
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS repayment_type VARCHAR(30) DEFAULT 'Monthly'`,
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS repaid_amount DECIMAL(15,2) DEFAULT 0`,
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'`,
    `ALTER TABLE project_loans ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,

    // ── interest_payments table ──
    `ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS due_date DATE DEFAULT NULL`,
    `ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS paid_date DATE DEFAULT NULL`,
    `ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS delay_days INT DEFAULT 0`,
    `ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS penalty DECIMAL(15,2) DEFAULT 0`,
    `ALTER TABLE interest_payments ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,
  ];

  for (const sql of alterations) {
    try {
      await db.query(sql);
      // Extract column name for logging
      const match = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
      console.log(`  ✅ ${match ? match[1] : 'OK'}`);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060) {
        const match = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/);
        console.log(`  ⏭️  ${match ? match[1] : 'column'} already exists`);
      } else {
        console.error(`  ❌ Error: ${err.message}`);
        console.error(`     SQL: ${sql.substring(0, 80)}...`);
      }
    }
  }

  console.log('\n✅ Finance module migration complete!');
  process.exit(0);
}

migrate();
