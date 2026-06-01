const mysql = require('mysql2/promise');
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'constructiondata'
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  const [tables] = await connection.query("SHOW TABLES");
  console.log("Tables:", tables);
  for (let row of tables) {
    const tableName = Object.values(row)[0];
    const [cols] = await connection.query(`SHOW COLUMNS FROM ${tableName}`);
    console.log(`\nTable: ${tableName}`);
    console.log(cols.map(c => `${c.Field} (${c.Type}) - Key: ${c.Key}`).join('\n'));
  }
  await connection.end();
}
check();
