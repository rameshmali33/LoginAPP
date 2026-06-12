const pool = require("../config/db");
const logger = require("../utils/logger");

const getHealth = async (req, res, next) => {
  try {
    const start = Date.now();
    // simple query to validate DB connection
    await pool.query("SELECT 1");
    const duration = Date.now() - start;

    const payload = {
      status: "UP",
      timestamp: new Date().toISOString(),
      database: { status: "UP", responseTimeMs: duration },
    };

    logger.info("Health check OK", { duration });
    res.json(payload);
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(503).json({ status: "DOWN", error: error.message });
  }
};

module.exports = { getHealth };
