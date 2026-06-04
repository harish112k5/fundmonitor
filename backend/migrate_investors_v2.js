const db = require('./db');

const up = async () => {
  try {
    console.log('Migrating Investor Management Module V2...');

    // Rename old investors table if it exists
    try {
      await db.query('RENAME TABLE investors TO investors_legacy');
      console.log('Renamed old investors table to investors_legacy');
    } catch (e) {
      // It might not exist or already be renamed, ignore
    }

    // 1. investor_basic_info
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_basic_info (
        investor_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_type ENUM('Individual', 'Organization') NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        alt_contact VARCHAR(255),
        category ENUM('Individual', 'HNI', 'Corporate', 'Bank', 'Insurance', 'Other') DEFAULT 'Other',
        pan_id VARCHAR(50),
        address TEXT,
        bank_details TEXT,
        kyc_status ENUM('Pending', 'Verified', 'Rejected') DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT
      )
    `);
    console.log('Created investor_basic_info');

    // 2. investor_project_assignment
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_project_assignment (
        assignment_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE
      )
    `);
    console.log('Created investor_project_assignment');

    // 3. investment_proposal
    await db.query(`
      CREATE TABLE IF NOT EXISTS investment_proposal (
        proposal_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT NOT NULL,
        proposed_amount DECIMAL(15,2) NOT NULL,
        expected_roi_percent DECIMAL(5,2) DEFAULT 15.00,
        investment_duration_months INT DEFAULT 36,
        risk_level ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
        status ENUM('Pending', 'Accepted', 'Rejected', 'Counter') DEFAULT 'Pending',
        expiry_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE
      )
    `);
    console.log('Created investment_proposal');

    // 4. proposal_response
    await db.query(`
      CREATE TABLE IF NOT EXISTS proposal_response (
        response_id INT AUTO_INCREMENT PRIMARY KEY,
        proposal_id INT NOT NULL,
        response_action ENUM('Accept', 'Reject', 'Counter') NOT NULL,
        counter_amount DECIMAL(15,2),
        reason TEXT,
        responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES investment_proposal(proposal_id) ON DELETE CASCADE
      )
    `);
    console.log('Created proposal_response');

    // 5. investor_commitment
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_commitment (
        commitment_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT NOT NULL,
        proposal_id INT,
        total_committed_amount DECIMAL(15,2) NOT NULL,
        status ENUM('Active', 'Completed', 'Suspended') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE,
        FOREIGN KEY (proposal_id) REFERENCES investment_proposal(proposal_id) ON DELETE SET NULL
      )
    `);
    console.log('Created investor_commitment');

    // 6. investor_funding_schedule
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_funding_schedule (
        schedule_id INT AUTO_INCREMENT PRIMARY KEY,
        commitment_id INT NOT NULL,
        installment_number INT NOT NULL,
        scheduled_amount DECIMAL(15,2) NOT NULL,
        scheduled_due_date DATE NOT NULL,
        status ENUM('Pending', 'Partially Received', 'Fully Received') DEFAULT 'Pending',
        payment_method_preference VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (commitment_id) REFERENCES investor_commitment(commitment_id) ON DELETE CASCADE
      )
    `);
    console.log('Created investor_funding_schedule');

    // 7. investor_fund_receipt
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_fund_receipt (
        receipt_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT NOT NULL,
        received_amount DECIMAL(15,2) NOT NULL,
        received_date DATE NOT NULL,
        payment_method VARCHAR(50),
        transaction_reference VARCHAR(100),
        allocation_method ENUM('FIFO', 'Manual', 'Priority') NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE
      )
    `);
    console.log('Created investor_fund_receipt');

    // 8. fund_allocation
    await db.query(`
      CREATE TABLE IF NOT EXISTS fund_allocation (
        allocation_id INT AUTO_INCREMENT PRIMARY KEY,
        receipt_id INT NOT NULL,
        schedule_id INT NOT NULL,
        allocated_amount DECIMAL(15,2) NOT NULL,
        allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (receipt_id) REFERENCES investor_fund_receipt(receipt_id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES investor_funding_schedule(schedule_id) ON DELETE CASCADE
      )
    `);
    console.log('Created fund_allocation');

    // 9. investor_allocation_priority
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_allocation_priority (
        priority_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT NOT NULL,
        priority_level ENUM('High', 'Medium', 'Low', 'Custom') DEFAULT 'Medium',
        custom_priority_score INT DEFAULT 50,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE
      )
    `);
    console.log('Created investor_allocation_priority');

    // 10. investor_activity_log
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_activity_log (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT,
        action_type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        performed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE SET NULL
      )
    `);
    console.log('Created investor_activity_log');

    // 11. investor_alerts
    await db.query(`
      CREATE TABLE IF NOT EXISTS investor_alerts (
        alert_id INT AUTO_INCREMENT PRIMARY KEY,
        investor_id INT NOT NULL,
        project_id INT,
        schedule_id INT,
        alert_type VARCHAR(100) NOT NULL,
        severity ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
        message TEXT NOT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        resolved_by INT,
        FOREIGN KEY (investor_id) REFERENCES investor_basic_info(investor_id) ON DELETE CASCADE,
        FOREIGN KEY (schedule_id) REFERENCES investor_funding_schedule(schedule_id) ON DELETE SET NULL
      )
    `);
    console.log('Created investor_alerts');

    console.log('Migration V2 completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

up();
