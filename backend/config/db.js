const mysql = require("mysql2");
const env = require("./env");

// Create the connection pool
const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  port: env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
});

pool.on("error", (err) => {
  console.error("MySQL pool error:", err);
});

console.log("MySQL connection:", {
  host: env.DB_HOST,
  user: env.DB_USER,
  database: env.DB_NAME,
  port: env.DB_PORT,
});

const poolPromise = pool.promise();

const wait = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

const checkConnectionWithRetry = async ({ retries = 5, delayMs = 2000 } = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await poolPromise.query("SELECT 1 AS result");
      return true;
    } catch (error) {
      lastError = error;
      console.warn(`Database connection attempt ${attempt} failed: ${error.message}`);
      if (attempt < retries) {
        await wait(delayMs);
      }
    }
  }

  const message = lastError ? lastError.message : "Unknown error";
  throw new Error(`Database connection failed after ${retries} attempts: ${message}`);
};

poolPromise.checkConnectionWithRetry = checkConnectionWithRetry;

module.exports = poolPromise;