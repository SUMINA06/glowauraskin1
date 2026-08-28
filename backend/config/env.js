const path = require("path");
const dotenv = require("dotenv");

// Only load the local .env file outside production. In production the
// environment must come entirely from the host (e.g. Railway env vars), so a
// stale local .env can never override or shadow real configuration.
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

const pick = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const required = [
  ["DB_HOST", "MYSQLHOST"],
  ["DB_USER", "MYSQLUSER"],
  ["DB_NAME", "MYSQLDATABASE"],
  ["JWT_SECRET", "JWT_SECRET"],
];

if (process.env.NODE_ENV === "production") {
  required.push(["DB_PASSWORD", "MYSQLPASSWORD"]);
  required.push(
    ["FRONTEND_URL", "FRONTEND_URL"],
    ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_CLOUD_NAME"],
    ["CLOUDINARY_API_KEY", "CLOUDINARY_API_KEY"],
    ["CLOUDINARY_API_SECRET", "CLOUDINARY_API_SECRET"],
  );
}

const missing = required
  .filter(([primary, fallback]) => !pick(primary, fallback))
  .map(([primary]) => primary);

if (missing.length > 0) {
  const hint =
    process.env.NODE_ENV === "production"
      ? " Set these in the deployment environment. If you attached a Railway " +
        "MySQL service, use its DB_HOST/DB_USER/DB_PASSWORD/DB_NAME/DB_PORT " +
        "(the MYSQLHOST/MYSQLPORT/MYSQLUSER/MYSQLPASSWORD/MYSQLDATABASE " +
        "fallbacks are also supported)."
      : "";
  throw new Error(`Missing required env vars: ${missing.join(", ")}.${hint}`);
}

const DB_HOST = pick("DB_HOST", "MYSQLHOST");
const DB_USER = pick("DB_USER", "MYSQLUSER");
const DB_PASSWORD = pick("DB_PASSWORD", "MYSQLPASSWORD");
const DB_NAME = pick("DB_NAME", "MYSQLDATABASE");
const DB_PORT = Number.parseInt(pick("DB_PORT", "MYSQLPORT"), 10) || 3306;

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 2000,
  FRONTEND_URL: process.env.FRONTEND_URL || "",
  CORS_ORIGIN: process.env.FRONTEND_URL || "",
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || "7d",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_SETUP_TOKEN: process.env.ADMIN_SETUP_TOKEN,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = env;
