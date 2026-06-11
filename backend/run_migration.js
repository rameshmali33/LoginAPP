require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./config/db');
const logger = require('./utils/logger');

async function run() {
  try {
    // Run original leave tables migration
    const leaveSqlPath = path.join(__dirname, 'migrations', 'create_leave_tables.sql');
    const leaveSql = fs.readFileSync(leaveSqlPath, 'utf8');
    logger.info("Running leave database migrations...");
    await pool.query(leaveSql);
    logger.info("✅ Leave migrations completed successfully!");

    // Run Document 5 tables migration
    const doc5SqlPath = path.join(__dirname, 'migrations', 'create_document5_tables.sql');
    const doc5Sql = fs.readFileSync(doc5SqlPath, 'utf8');
    logger.info("Running Document 5 database migrations...");
    await pool.query(doc5Sql);
    logger.info("✅ Document 5 migrations completed successfully!");

    logger.info("✅ All migrations executed successfully!");
  } catch (e) {
    logger.error("Migration failed:", e);
    process.exit(1);
  }
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    logger.error("Migration error:", e);
    process.exit(1);
  });
