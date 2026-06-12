require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    multipleStatements: true
  });

  try {
    console.log('Connected to database. Reading migration script...');
    const sqlPath = path.join(__dirname, '../database_optimization_migration.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing migration script...');
    await connection.query(sqlScript);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();
