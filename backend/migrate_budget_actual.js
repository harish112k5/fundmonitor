require('dotenv').config();
const db = require('./db');

async function migrate() {
  console.log('🔧 Running Budget vs Actual migration...');

  const queries = [
    // 1. Core activities table
    `CREATE TABLE IF NOT EXISTS budget_actual_activities (
      activity_id     INT PRIMARY KEY AUTO_INCREMENT,
      project_id      INT NOT NULL,
      activity_name   VARCHAR(255) NOT NULL,
      activity_category VARCHAR(100) DEFAULT NULL,
      description     TEXT,
      planned_budget  DECIMAL(15,2) DEFAULT 0.00,
      planned_work_hours DECIMAL(8,2) DEFAULT 0.00,
      cost_per_hour   DECIMAL(10,2) DEFAULT 0.00,
      start_date      DATE DEFAULT NULL,
      end_date        DATE DEFAULT NULL,
      status          ENUM('Planned','In Progress','Completed','On Hold') DEFAULT 'Planned',
      progress_percentage INT DEFAULT 0,
      created_by      INT DEFAULT NULL,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
      INDEX idx_baa_project (project_id),
      INDEX idx_baa_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 2. Budget allocations (planned resources)
    `CREATE TABLE IF NOT EXISTS budget_allocations (
      allocation_id    INT PRIMARY KEY AUTO_INCREMENT,
      activity_id      INT NOT NULL,
      resource_type    ENUM('Material','Manpower','Machinery') NOT NULL,
      resource_id      INT DEFAULT NULL,
      resource_name    VARCHAR(255) NOT NULL,
      planned_quantity DECIMAL(10,2) DEFAULT 0,
      planned_unit     VARCHAR(50) DEFAULT 'unit',
      planned_unit_cost DECIMAL(10,2) DEFAULT 0,
      planned_total_cost DECIMAL(15,2) DEFAULT 0,
      allocation_status ENUM('Active','Completed','Cancelled') DEFAULT 'Active',
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES budget_actual_activities(activity_id) ON DELETE CASCADE,
      INDEX idx_ba_activity (activity_id),
      INDEX idx_ba_resource_type (resource_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 3. Activity progress records (actual work)
    `CREATE TABLE IF NOT EXISTS activity_progress (
      progress_id      INT PRIMARY KEY AUTO_INCREMENT,
      activity_id      INT NOT NULL,
      actual_work_hours DECIMAL(8,2) DEFAULT 0,
      actual_completion_percentage INT DEFAULT 0,
      actual_status    ENUM('In Progress','Completed','On Hold') DEFAULT 'In Progress',
      progress_date    DATE NOT NULL,
      recorded_by      INT DEFAULT NULL,
      notes            TEXT,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES budget_actual_activities(activity_id) ON DELETE CASCADE,
      INDEX idx_ap_activity (activity_id),
      INDEX idx_ap_date (progress_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 4. Actual resource usage per progress record
    `CREATE TABLE IF NOT EXISTS actual_resource_usage (
      usage_id         INT PRIMARY KEY AUTO_INCREMENT,
      progress_id      INT NOT NULL,
      activity_id      INT NOT NULL,
      allocation_id    INT DEFAULT NULL,
      resource_type    ENUM('Material','Manpower','Machinery') NOT NULL,
      resource_name    VARCHAR(255) NOT NULL,
      actual_quantity  DECIMAL(10,2) DEFAULT 0,
      actual_unit_cost DECIMAL(10,2) DEFAULT 0,
      actual_total_cost DECIMAL(15,2) DEFAULT 0,
      usage_date       DATE DEFAULT NULL,
      created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (progress_id) REFERENCES activity_progress(progress_id) ON DELETE CASCADE,
      FOREIGN KEY (activity_id) REFERENCES budget_actual_activities(activity_id) ON DELETE CASCADE,
      INDEX idx_aru_activity (activity_id),
      INDEX idx_aru_progress (progress_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

    // 5. Profit & Loss summary (cached/recalculated)
    `CREATE TABLE IF NOT EXISTS activity_profit_loss (
      pl_id             INT PRIMARY KEY AUTO_INCREMENT,
      activity_id       INT NOT NULL,
      total_planned_budget DECIMAL(15,2) DEFAULT 0,
      total_actual_cost DECIMAL(15,2) DEFAULT 0,
      profit_loss       DECIMAL(15,2) DEFAULT 0,
      profit_loss_percentage DECIMAL(8,2) DEFAULT 0,
      cost_performance_index DECIMAL(8,2) DEFAULT 0,
      financial_status  ENUM('Excellent','Good','At Risk','Critical') DEFAULT 'Good',
      last_calculated   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES budget_actual_activities(activity_id) ON DELETE CASCADE,
      UNIQUE KEY unique_activity (activity_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];

  for (const sql of queries) {
    const tableName = (sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/) || [])[1];
    try {
      await db.query(sql);
      console.log(`  ✅ Table ready: ${tableName}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${tableName} — ${err.message}`);
    }
  }

  console.log('\n✅ Budget vs Actual migration complete!');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
