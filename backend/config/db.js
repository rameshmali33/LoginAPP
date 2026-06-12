const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;
const shouldUseSsl =
  connectionString &&
  !connectionString.includes("localhost") &&
  !connectionString.includes("127.0.0.1");

const pool = new Pool({
  connectionString,
  ssl: shouldUseSsl ? { rejectUnauthorized: false } : false,
});

module.exports = pool;
