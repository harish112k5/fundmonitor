const pool = require('./db');

async function migrateFinanceAdvanced() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting Advanced Finance module migrations...');

    // 1. financial_ratios
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_ratios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        period VARCHAR(50) NOT NULL,
        roi DECIMAL(8,2),
        irr DECIMAL(8,2),
        npv DECIMAL(15,2),
        net_profit_margin DECIMAL(8,2),
        current_ratio DECIMAL(8,2),
        debt_to_equity DECIMAL(8,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY(project_id, period)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created financial_ratios table');

    // 2. financial_forecasts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_forecasts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        forecast_type ENUM('revenue', 'cost', 'cash_flow') NOT NULL,
        forecast_period VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        scenario ENUM('optimistic', 'realistic', 'pessimistic') DEFAULT 'realistic',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created financial_forecasts table');

    // 3. financial_statements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_statements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        statement_type ENUM('income_statement', 'balance_sheet', 'trial_balance') NOT NULL,
        period VARCHAR(50) NOT NULL,
        data JSON NOT NULL,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created financial_statements table');

    // 4. cash_flow_statement
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cash_flow_statement (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        period VARCHAR(50) NOT NULL,
        operating_cash_flow DECIMAL(15,2) DEFAULT 0,
        investing_cash_flow DECIMAL(15,2) DEFAULT 0,
        financing_cash_flow DECIMAL(15,2) DEFAULT 0,
        net_cash_flow DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created cash_flow_statement table');

    // 5. tax_compliance
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tax_compliance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        tax_type VARCHAR(100) NOT NULL,
        period VARCHAR(50) NOT NULL,
        amount_due DECIMAL(15,2) DEFAULT 0,
        amount_paid DECIMAL(15,2) DEFAULT 0,
        due_date DATE,
        status ENUM('pending', 'paid', 'overdue') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created tax_compliance table');

    console.log('Advanced Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateFinanceAdvanced();
