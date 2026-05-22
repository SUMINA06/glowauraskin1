const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const multer = require("multer");

const db = require("./config/db");
const { authMiddleware, adminMiddleware } = require("./config/jwt");
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
const frontendDistPath = path.join(__dirname, "..", "frontend-react", "dist");

const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS + security headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
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

// Serve public product images
app.use(
  "/uploads/products",
  express.static(path.join(__dirname, "uploads", "products")),
);
// Protect payment screenshots (admin only)
app.use(
  "/uploads/payments",
  authMiddleware,
  adminMiddleware,
  express.static(path.join(__dirname, "uploads", "payments")),
);
// Serve frontend assets when built
app.use(express.static(frontendDistPath));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// API 404 handler so SPA fallback does not swallow API errors
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
  });
});

// SPA fallback for client-side routes
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
    if (err) {
      next(err);
    }
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

const port = process.env.PORT || 3000;

// Initialize tables and start server
initializeTables()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database tables:", err);
    process.exit(1);
  });