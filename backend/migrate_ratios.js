const pool = require('./db');

async function migrateRatios() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting Phase 2 Ratios module migrations...');

    // 1. corporate_metrics (for stock price, shares outstanding, etc. - SPV level)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS corporate_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        market_price_per_share DECIMAL(15,2) DEFAULT 100.00,
        common_shares_outstanding INT DEFAULT 10000,
        preferred_dividends DECIMAL(15,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY(project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created corporate_metrics table');

    // 2. dividend_payouts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dividend_payouts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        dividend_per_share DECIMAL(10,2) NOT NULL,
        payout_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created dividend_payouts table');

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateRatios();
