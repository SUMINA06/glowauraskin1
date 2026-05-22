const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET"];

if (process.env.NODE_ENV === "production") {
  required.push(
    "FRONTEND_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  );
}

const missing = required.filter((key) => {
  const value = process.env[key];
  return !value || String(value).trim() === "";
});

if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || "",
  CORS_ORIGIN: process.env.FRONTEND_URL || "",
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: Number.parseInt(process.env.DB_PORT, 10) || 3306,
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
