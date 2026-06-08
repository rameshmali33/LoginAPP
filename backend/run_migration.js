require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function run() {
  const sqlPath = path.join(__dirname, 'migrations', 'create_leave_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log("Running leave database migrations...");
  await pool.query(sql);
  console.log("Migrations executed successfully!");
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  });
