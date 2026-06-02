require('dotenv').config();
const mysql = require('mysql2/promise');
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
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
