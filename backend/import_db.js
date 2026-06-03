const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDb() {
    try {
        console.log("Connecting to Railway MySQL...");
        const connection = await mysql.createConnection({
            host: "gondola.proxy.rlwy.net",
            port: 17116,
            user: "root",
            password: "QDQwDlGkXwNiKvkDZBFeFFhZzxojZorF",
            database: "railway",
            multipleStatements: true // critical for running a full dump file
        });

        console.log("Connected!");
        
        const sqlPath = path.resolve(__dirname, '../constructiondata.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log("Executing SQL dump (this might take a few seconds)...");
        await connection.query(sql);
        
        console.log("Database import successful!");
        await connection.end();
    } catch (e) {
        console.error("Database Import Error:", e);
    }
}

importDb();
