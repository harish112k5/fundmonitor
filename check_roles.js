const db = require('./backend/db');
async function test() {
  const [roles] = await db.query('SELECT * FROM roles');
  console.log(roles);
  process.exit();
}
test();
