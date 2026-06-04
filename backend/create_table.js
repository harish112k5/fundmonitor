const db = require('./db');
db.query(`
  CREATE TABLE IF NOT EXISTS project_team (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    user_id INT NOT NULL,
    role VARCHAR(50) DEFAULT 'engineer',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
  )
`).then(() => {
  console.log('project_team table ready');
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
