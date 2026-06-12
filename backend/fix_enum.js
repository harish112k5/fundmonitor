const mysql = require('mysql2/promise');
require('dotenv').config();
mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306,
  ssl: { rejectUnauthorized: false }
}).then(async c => {
  await c.query("ALTER TABLE project_team MODIFY COLUMN role ENUM('site_engineer', 'project_manager', 'supervisor', 'accountant', 'engineer', 'manager', 'viewer') NOT NULL");
  console.log('Enum updated successfully');
  c.end();
}).catch(e => console.error(e.message));
