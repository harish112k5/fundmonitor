const db = require('./db');

async function migrate() {
  try {
    // 1. Check user_id type in users table
    const [cols] = await db.query("SHOW COLUMNS FROM users WHERE Field = 'user_id'");
    const userIdType = cols[0].Type;
    console.log('Detected users.user_id type:', userIdType);

    // 2. Check if users table has last_login, login_attempts, is_active
    const [userCols] = await db.query("SHOW COLUMNS FROM users");
    const existingCols = userCols.map(c => c.Field);
    
    if (!existingCols.includes('last_login')) {
      console.log('Adding last_login to users table...');
      await db.query("ALTER TABLE users ADD COLUMN last_login DATETIME DEFAULT NULL");
    }
    if (!existingCols.includes('login_attempts')) {
      console.log('Adding login_attempts to users table...');
      await db.query("ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0");
    }
    if (!existingCols.includes('is_active')) {
      console.log('Adding is_active to users table...');
      await db.query("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1");
    }

    // 3. Check if activity_log table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'activity_log'");
    if (tables.length === 0) {
      console.log('Creating activity_log table...');
      await db.query(`
        CREATE TABLE activity_log (
          log_id INT AUTO_INCREMENT PRIMARY KEY,
          user_id ${userIdType} NOT NULL,
          action VARCHAR(50) NOT NULL,
          table_name VARCHAR(50) NOT NULL,
          record_id VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    }

    // 4. Create session_log table
    console.log('Creating session_log table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS session_log (
        session_id CHAR(36) NOT NULL,
        user_id ${userIdType} NOT NULL,
        login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        logout_time DATETIME DEFAULT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent VARCHAR(255) DEFAULT NULL,
        status ENUM('active','expired','logged_out') NOT NULL DEFAULT 'active',
        PRIMARY KEY (session_id),
        KEY idx_sl_user_id (user_id),
        KEY idx_sl_login_time (login_time),
        CONSTRAINT fk_sl_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
