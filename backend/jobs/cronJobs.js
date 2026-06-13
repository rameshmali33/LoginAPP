
const cron = require("node-cron");
const logger = require("../utils/logger");
const pool = require("../config/db");
const fs = require("fs");
const path = require("path");

const initCronJobs = () => {
  logger.info("Initializing background cron jobs...");

  cron.schedule("0 0 * * *", async () => {
    logger.info("Running Daily Leave Report Job...");
    try {
      const result = await pool.query(`
        SELECT COUNT(*) as count 
        FROM leave_applications 
        WHERE status IN ('pending_manager', 'pending_hr')
      `);
      const count = result.rows[0].count;
      logger.info(`Daily Leave Report: Total pending leave requests is ${count}`);
    } catch (error) {
      logger.error("Daily Leave Report Job Error:", error);
    }
  });

  cron.schedule("0 1 * * *", async () => {
    logger.info("Running Daily Backup Job...");
    try {
      const backupDir = path.join(__dirname, "../backups");
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const result = await pool.query(`
        SELECT id, name, email, role, is_verified, created_at 
        FROM users
        ORDER BY id ASC
      `);

      const filename = `users_backup_${Date.now()}.json`;
      const filePath = path.join(backupDir, filename);

      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2), "utf8");
      logger.info(`Daily Backup Job: Users table successfully backed up to ${filePath}`);
    } catch (error) {
      logger.error("Daily Backup Job Error:", error);
    }
  });

  cron.schedule("0 2 * * *", async () => {
    logger.info("Running Notification Cleanup Job...");
    try {
      const result = await pool.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      logger.info(`Notification Cleanup Job: Deleted ${result.rowCount} notification logs older than 30 days.`);
    } catch (error) {
      logger.error("Notification Cleanup Job Error:", error);
    }
  });

  logger.info("Background cron jobs successfully scheduled.");
};

module.exports = { initCronJobs };
