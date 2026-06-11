/**
 * Winston Logger Configuration
 * Logs to console, error.log, and combined.log
 */

const winston = require("winston");
const path = require("path");
const fs = require("fs");

// Ensure logs directory exists
const logsDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "loginapp-backend" },
  transports: [
    // Console transport (all levels in development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // Error log (errors only)
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),

    // Combined log (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    }),
  ],
});

module.exports = logger;
