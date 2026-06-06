require('dotenv').config();
const db = require('./db');

async function run() {
  // 1. Create investors table if not exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS investors (
      investor_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      email VARCHAR(255),
      pan VARCHAR(50),
      type VARCHAR(50) DEFAULT 'Individual',
      address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ investors table created/verified');

  // 2. Copy data from investor_basic_info if investors table is empty
  const [existing] = await db.query('SELECT COUNT(*) AS cnt FROM investors');
  if (existing[0].cnt === 0) {
    try {
      await db.query(`
        INSERT INTO investors (investor_id, name, phone, email, pan, type, address, created_at)
        SELECT investor_id, name, phone, email, pan_id, investor_type, address, created_at
        FROM investor_basic_info
      `);
      console.log('✅ Copied data from investor_basic_info to investors');
    } catch (e) {
      console.log('⏭️  No data to copy or investor_basic_info not available:', e.message);
    }
  } else {
    console.log('⏭️  investors table already has data');
  }

  // 3. Update FK on project_investments to reference investors instead of investors_legacy
  // First drop the old FK if it exists
  try {
    const [fks] = await db.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'project_investments' AND COLUMN_NAME = 'investor_id' 
      AND REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA = 'constructiondata'
    `);
    for (const fk of fks) {
      await db.query(`ALTER TABLE project_investments DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
      console.log(`✅ Dropped old FK: ${fk.CONSTRAINT_NAME}`);
    }
  } catch (e) {
    console.log('⏭️  FK drop skipped:', e.message);
  }

  // Add new FK pointing to investors table
  try {
    await db.query(`
      ALTER TABLE project_investments 
      ADD CONSTRAINT fk_pi_investor 
      FOREIGN KEY (investor_id) REFERENCES investors(investor_id) ON DELETE CASCADE
    `);
    console.log('✅ Added FK: project_investments.investor_id -> investors.investor_id');
  } catch (e) {
    if (e.errno === 1826 || e.errno === 1022 || e.errno === 1061) {
      console.log('⏭️  FK already exists or constraint issue:', e.message);
    } else {
      console.log('⚠️  FK add issue:', e.message);
    }
  }

  // 4. Change interest_payments.status from ENUM to VARCHAR to support 'Overdue', 'Paid', 'Pending'
  await db.query(`ALTER TABLE interest_payments MODIFY COLUMN status VARCHAR(30) DEFAULT 'Pending'`);
  console.log('✅ interest_payments.status changed to VARCHAR(30)');

  console.log('\n🎉 All finance schema updates complete!');
  process.exit(0);
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
