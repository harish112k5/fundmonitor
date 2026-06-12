const db = require('./db');

async function dumpSchema() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];
    const schema = {};

    for (let row of tables) {
      const tableName = row[tableKey];
      const [columns] = await db.query(`DESCRIBE ${tableName}`);
      schema[tableName] = columns.map(c => `${c.Field} (${c.Type}) ${c.Key === 'PRI' ? '[PK]' : ''} ${c.Key === 'MUL' ? '[FK]' : ''}`).join(', ');
    }

    console.log(JSON.stringify(schema, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

dumpSchema();
