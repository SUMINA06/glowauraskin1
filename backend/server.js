const express = require("express");
const multer = require("multer");

const env = require("./config/env");
const db = require("./config/db");
const { createUserTable, ensureDefaultAdmin } = require("./model/User");
const { createProductTable } = require("./model/Product");
const { createImageTable } = require("./model/Image");
const { createOrderTable, createOrderItemsTable } = require("./model/Order");
const { createCartTable } = require("./model/Cart");
const { createPaymentTable } = require("./model/Payment");
const { migrateDatabase, addRoleColumn } = require("./migrate");

// Import routes
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const imageRoutes = require("./routes/imageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const cartRoutes = require("./routes/cartRoutes");

const app = express();
const allowedOrigin = env.FRONTEND_URL;

// CORS + security headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    if (!allowedOrigin || origin !== allowedOrigin) {
      return res.status(403).json({
        success: false,
        message: "CORS origin denied",
      });
    }
    res.header("Access-Control-Allow-Origin", allowedOrigin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("Referrer-Policy", "no-referrer");
  res.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1 AS result");
    return res.status(200).json({
      status: "ok",
      db: "up",
    });
  } catch (error) {
    return res.status(503).json({
      status: "error",
      db: "down",
      message: error.message,
    });
  }
});

// API 404 handler so SPA fallback does not swallow API errors
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file is too large. Maximum size is 10MB."
      : err.message;
    return res.status(400).json({
      success: false,
      message,
      error: err.message,
    });
  }

  if (err.message && err.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message || "Unknown error",
  });
});

// Verify the connection to the database
const verifyDatabaseConnection = async () => {
  try {
    await db.checkConnectionWithRetry({ retries: 5, delayMs: 2000 });
    const [rows] = await db.query("SELECT 1 AS result");
    console.log("Database connection verified:", rows[0]);
  } catch (error) {
    console.error("Unable to verify database connection:", error);
    throw error;
  }
};

// Initialize database tables
const initializeTables = async () => {
  try {
    await verifyDatabaseConnection();

    // Create base tables in order to satisfy foreign keys
    await createUserTable();
    await createProductTable();
    await createOrderTable();
    await createOrderItemsTable();
    await createCartTable();
    await createImageTable();
    // Payments depend on orders, create after orders are present
    await createPaymentTable();

    // Add role column for role-based auth if needed
    await addRoleColumn();

    // Run migration to fix schema if needed
    await migrateDatabase();

    // Ensure a default admin user exists
    await ensureDefaultAdmin();
  } catch (error) {
    console.error("Error during table initialization:", error);
    throw error;
  }
};

const port = env.PORT;

// Initialize tables and start server
initializeTables()
  .then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database tables:", err);
    process.exit(1);
  });