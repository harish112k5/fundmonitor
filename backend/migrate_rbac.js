require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateRBAC() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'constructiondata'
  });

  try {
    console.log('=== FINFRA RBAC Migration ===');
    console.log(`Database: ${process.env.DB_DATABASE}\n`);

    // 0. Check roles table schema
    const [cols] = await connection.query('DESCRIBE roles');
    const hasDescription = cols.some(c => c.Field === 'description');
    console.log(`Roles table has description column: ${hasDescription}`);

    // 1. Show current roles
    const [currentRoles] = await connection.query('SELECT * FROM roles ORDER BY role_id');
    console.log('Current roles:', currentRoles.map(r => `${r.role_id}=${r.role_name}`).join(', '));

    // 2. Rename existing roles (skip description if column doesn't exist)
    console.log('\n--- Renaming roles ---');

    // role_id 2
    const [r2] = await connection.query('SELECT role_name FROM roles WHERE role_id = 2');
    if (r2.length && r2[0].role_name !== 'manager') {
      await connection.query(`UPDATE roles SET role_name = 'manager' WHERE role_id = 2`);
      console.log(`  role_id 2: ${r2[0].role_name} → manager`);
    } else {
      console.log('  role_id 2: already manager ✓');
    }

    // role_id 3
    const [r3] = await connection.query('SELECT role_name FROM roles WHERE role_id = 3');
    if (r3.length && r3[0].role_name !== 'engineer') {
      await connection.query(`UPDATE roles SET role_name = 'engineer' WHERE role_id = 3`);
      console.log(`  role_id 3: ${r3[0].role_name} → engineer`);
    } else {
      console.log('  role_id 3: already engineer ✓');
    }

    // role_id 4 → accountant
    const [r4] = await connection.query('SELECT role_name FROM roles WHERE role_id = 4');
    if (r4.length && r4[0].role_name !== 'accountant') {
      await connection.query(`UPDATE roles SET role_name = 'accountant' WHERE role_id = 4`);
      console.log(`  role_id 4: ${r4[0].role_name} → accountant`);
    } else if (r4.length === 0) {
      await connection.query(`INSERT INTO roles (role_id, role_name) VALUES (4, 'accountant')`);
      console.log('  role_id 4: accountant (NEW)');
    } else {
      console.log('  role_id 4: already accountant ✓');
    }

    // role_id 5 → supervisor
    const [r5] = await connection.query('SELECT role_name FROM roles WHERE role_id = 5');
    if (r5.length && r5[0].role_name !== 'supervisor') {
      await connection.query(`UPDATE roles SET role_name = 'supervisor' WHERE role_id = 5`);
      console.log(`  role_id 5: ${r5[0].role_name} → supervisor`);
    } else if (r5.length === 0) {
      await connection.query(`INSERT INTO roles (role_id, role_name) VALUES (5, 'supervisor')`);
      console.log('  role_id 5: supervisor (NEW)');
    } else {
      console.log('  role_id 5: already supervisor ✓');
    }

    // role_id 6 → viewer
    const [r6] = await connection.query('SELECT role_name FROM roles WHERE role_id = 6');
    if (r6.length === 0) {
      await connection.query(`INSERT INTO roles (role_id, role_name) VALUES (6, 'viewer')`);
      console.log('  role_id 6: viewer (NEW)');
    } else if (r6[0].role_name !== 'viewer') {
      await connection.query(`UPDATE roles SET role_name = 'viewer' WHERE role_id = 6`);
      console.log(`  role_id 6: ${r6[0].role_name} → viewer`);
    } else {
      console.log('  role_id 6: already viewer ✓');
    }

    // 3. Extend project_team.role ENUM
    console.log('\n--- Extending project_team.role ENUM ---');
    try {
      await connection.query(`
        ALTER TABLE project_team 
        MODIFY COLUMN role ENUM('site_engineer','project_manager','supervisor','accountant','viewer','manager','engineer') NOT NULL DEFAULT 'engineer'
      `);
      console.log('  ENUM extended ✓');
    } catch (err) {
      console.log('  ENUM note:', err.message);
    }

    // 4. Verify
    const [finalRoles] = await connection.query('SELECT * FROM roles ORDER BY role_id');
    console.log('\n--- Final roles ---');
    finalRoles.forEach(r => console.log(`  ${r.role_id}: ${r.role_name}`));

    console.log('\n✅ RBAC migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

migrateRBAC();
