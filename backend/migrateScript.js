require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

async function migrate() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log("Checking for columns in projects...");
    const [columns] = await connection.query("SHOW COLUMNS FROM projects");
    const colNames = columns.map(c => c.Field);
    
    if (!colNames.includes('is_deleted')) {
      console.log("Adding is_deleted...");
      await connection.query("ALTER TABLE projects ADD COLUMN is_deleted TINYINT(1) DEFAULT 0");
    }
    if (!colNames.includes('deleted_at')) {
      console.log("Adding deleted_at...");
      await connection.query("ALTER TABLE projects ADD COLUMN deleted_at DATETIME DEFAULT NULL");
    }
    if (!colNames.includes('deleted_by')) {
      console.log("Adding deleted_by...");
      await connection.query("ALTER TABLE projects ADD COLUMN deleted_by INT DEFAULT NULL");
    }

    try {
      await connection.query("CREATE INDEX idx_projects_is_deleted ON projects(is_deleted)");
      console.log("Created index idx_projects_is_deleted");
    } catch (e) {
      if (e.code === 'ER_DUP_KEYNAME') console.log("Index already exists.");
      else throw e;
    }

    console.log("Creating recycle_bin table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS recycle_bin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        deleted_by_user INT NOT NULL,
        deleted_by_name VARCHAR(255),
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        reason TEXT DEFAULT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
      )
    `);
    console.log("Migration complete!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
}
migrate();
