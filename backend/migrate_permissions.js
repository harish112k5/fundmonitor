require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    multipleStatements: true
  });

  try {
    console.log('=== Starting Permission System Migration ===\n');

    // 1. Create permission_definitions table
    console.log('1. Creating permission_definitions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permission_definitions (
        permission_id INT PRIMARY KEY AUTO_INCREMENT,
        permission_code VARCHAR(50) NOT NULL UNIQUE,
        permission_name VARCHAR(100) NOT NULL,
        permission_category VARCHAR(50) NOT NULL,
        description TEXT,
        default_roles JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✓ permission_definitions created');

    // 2. Create user_project_permissions table
    console.log('2. Creating user_project_permissions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_project_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        permission_code VARCHAR(50) NOT NULL,
        granted_by INT NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP NULL DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(user_id),
        UNIQUE KEY unique_user_project_perm (user_id, project_id, permission_code, revoked_at)
      )
    `);
    console.log('   ✓ user_project_permissions created');

    // 3. Create permission_audit_log table
    console.log('3. Creating permission_audit_log table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permission_audit_log (
        log_id INT PRIMARY KEY AUTO_INCREMENT,
        action VARCHAR(20) NOT NULL,
        user_id INT NOT NULL,
        project_id INT,
        permission_code VARCHAR(50),
        performed_by INT NOT NULL,
        performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        ip_address VARCHAR(45),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (performed_by) REFERENCES users(user_id)
      )
    `);
    console.log('   ✓ permission_audit_log created');

    // 4. Seed permission definitions
    console.log('4. Seeding permission definitions...');
    const definitions = [
      ['can_view_project',       'View Project Details',        'project_view', 'Can view basic project information',                             '[1,2,3,4,5,6]'],
      ['can_view_full_workflow', 'View Full Project Workflow',  'project_view', 'Can view all tabs read-only (materials, billing, finance, etc)', '[1,2]'],
      ['can_add_expenses',       'Add Expenses',                'expenses',     'Can create new expense records',                                 '[1,2,4]'],
      ['can_edit_expenses',      'Edit/Delete Expenses',        'expenses',     'Can modify or delete expense records',                           '[1,2,4]'],
      ['can_manage_team',        'Manage Project Team',         'team',         'Can add/remove team members and change roles',                   '[1,2]'],
      ['can_log_material_usage', 'Log Material Usage',          'usage',        'Can record material consumption',                                '[1,2,3,5]'],
      ['can_log_manpower_usage', 'Log Manpower Usage',          'usage',        'Can record worker attendance and hours',                         '[1,2,3,5]'],
      ['can_log_machine_usage',  'Log Machine Usage',           'usage',        'Can record machine rental hours',                                '[1,2,3,5]'],
      ['can_create_billing',     'Create Invoices/Billing',     'billing',      'Can generate new invoices',                                      '[1,2,4]'],
      ['can_edit_billing',       'Edit/Delete Billing',         'billing',      'Can modify or delete invoices',                                  '[1,2,4]'],
      ['can_view_financials',    'View Financial Reports',      'finance',      'Can view P&L, balance sheet, cash flow',                         '[1,2]'],
      ['can_view_investor_data', 'View Investor/Loan Data',     'finance',      'Can view investments, loans, interest payments',                 '[1,2]'],
      ['can_edit_project',       'Edit Project Details',        'project',      'Can modify project name, budget, dates, status',                 '[1,2]'],
      ['can_delete_project',     'Soft Delete Project',         'project',      'Can move project to recycle bin',                                '[1]']
    ];

    for (const [code, name, category, desc, defaults] of definitions) {
      await connection.query(
        `INSERT INTO permission_definitions (permission_code, permission_name, permission_category, description, default_roles)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         permission_name = VALUES(permission_name),
         permission_category = VALUES(permission_category),
         description = VALUES(description),
         default_roles = VALUES(default_roles)`,
        [code, name, category, desc, defaults]
      );
    }
    console.log(`   ✓ ${definitions.length} permission definitions seeded`);

    // 5. Auto-grant default permissions for ALL existing project_team entries
    console.log('5. Auto-granting default permissions for existing assignments...');
    const [assignments] = await connection.query(
      'SELECT DISTINCT pt.user_id, pt.project_id, u.role_id FROM project_team pt JOIN users u ON pt.user_id = u.user_id WHERE u.is_deleted = 0'
    );

    // Get the first admin's user_id for granted_by
    const [[admin]] = await connection.query('SELECT user_id FROM users WHERE role_id = 1 LIMIT 1');
    const grantedBy = admin ? admin.user_id : 1;

    let grantedCount = 0;
    for (const assign of assignments) {
      const [defaults] = await connection.query(
        `SELECT permission_code FROM permission_definitions 
         WHERE JSON_CONTAINS(default_roles, CAST(? AS JSON))`,
        [assign.role_id]
      );

      for (const perm of defaults) {
        await connection.query(
          `INSERT INTO user_project_permissions 
           (user_id, project_id, permission_code, granted_by, is_active)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE is_active = 1, revoked_at = NULL`,
          [assign.user_id, assign.project_id, perm.permission_code, grantedBy]
        );
        grantedCount++;
      }
    }
    console.log(`   ✓ Auto-granted ${grantedCount} permissions across ${assignments.length} assignments`);

    // 6. Log the migration itself
    await connection.query(
      `INSERT INTO permission_audit_log 
       (action, user_id, project_id, permission_code, performed_by, reason)
       VALUES ('AUTO_GRANT', ?, NULL, 'ALL', ?, 'Initial migration — seeded default permissions for all existing project team members')`,
      [grantedBy, grantedBy]
    );

    console.log('\n=== Migration Complete! ===');
    console.log('The dynamic permission system is now active.');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err);
  } finally {
    await connection.end();
  }
}

migrate();
