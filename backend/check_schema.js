require('dotenv').config();
const db = require('./db');

async function check() {
  try {
    // Check if investors table exists
    const [t1] = await db.query("SHOW TABLES LIKE 'investors'");
    console.log('investors table:', t1.length > 0 ? 'EXISTS' : 'NOT FOUND');

    // Check FK references for project_investments
    const [fks] = await db.query(
      `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME 
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'project_investments' AND REFERENCED_TABLE_NAME IS NOT NULL 
       AND TABLE_SCHEMA = 'constructiondata'`
    );
    fks.forEach(c => console.log(c.TABLE_NAME, c.COLUMN_NAME, '->', c.REFERENCED_TABLE_NAME));

    // Describe financiers
    const [fc] = await db.query('DESCRIBE financiers');
    console.log('\nfinanciers columns:');
    fc.forEach(c => console.log(' ', c.Field, c.Type));

    // Describe project_loans
    const [lc] = await db.query('DESCRIBE project_loans');
    console.log('\nproject_loans columns:');
    lc.forEach(c => console.log(' ', c.Field, c.Type));

    // Describe interest_payments
    const [ic] = await db.query('DESCRIBE interest_payments');
    console.log('\ninterest_payments columns:');
    ic.forEach(c => console.log(' ', c.Field, c.Type));

  } catch (e) { console.error(e.message); }
  process.exit(0);
}
check();
