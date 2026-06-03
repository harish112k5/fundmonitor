const pool = require('./db');

async function migrateFinance() {
  const connection = await pool.getConnection();
  try {
    console.log('Starting Finance module migrations...');

    // 1. financial_parameters
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_parameters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        discount_rate DECIMAL(5,2) DEFAULT 10.00,
        tax_rate DECIMAL(5,2) DEFAULT 18.00,
        inflation_rate DECIMAL(5,2) DEFAULT 6.00,
        currency VARCHAR(10) DEFAULT 'INR',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY(project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created financial_parameters table');

    // 2. budget_master
    await connection.query(`
      CREATE TABLE IF NOT EXISTS budget_master (
        budget_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        budget_name VARCHAR(150) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        start_date DATE,
        end_date DATE,
        status ENUM('draft', 'approved', 'active', 'closed') DEFAULT 'draft',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created budget_master table');

    // 3. budget_details
    await connection.query(`
      CREATE TABLE IF NOT EXISTS budget_details (
        detail_id INT AUTO_INCREMENT PRIMARY KEY,
        budget_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        allocated_amount DECIMAL(15,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (budget_id) REFERENCES budget_master(budget_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created budget_details table');

    // 4. financial_goals
    await connection.query(`
      CREATE TABLE IF NOT EXISTS financial_goals (
        goal_id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        target_roi DECIMAL(5,2) DEFAULT NULL,
        target_profit_margin DECIMAL(5,2) DEFAULT NULL,
        target_revenue DECIMAL(15,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY(project_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
    `);
    console.log('Created financial_goals table');

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

migrateFinance();
