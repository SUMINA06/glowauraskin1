const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// =====================================================
// LOAD LOCAL ENV (only when not running on a host like
// Railway that injects real env vars). This lets you keep
// local overrides in .env.local without affecting prod.
// =====================================================

dotenv.config({ path: path.join(__dirname, ".env.local") });

const app = express();
const port = process.env.PORT || 4173;

// =====================================================
// RESOLVE THE BACKEND API TARGET
//
// Order of precedence (first non-empty wins):
//   1. API_PROXY_TARGET        (recommended, explicit)
//   2. VITE_API_PROXY_TARGET   (compat / dev)
//   3. VITE_API_BASE_URL       (compat)
//   4. REACT_APP_API_URL       (compat)
//   5. localhost:3000          (local dev default)
//
// In production (Railway) set API_PROXY_TARGET to the
// backend's internal URL, e.g.
//   http://glowauraskin1.railway.internal:8080
// =====================================================

const pick = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && String(value).trim() !== "") {
      return String(value).trim().replace(/\/+$/, "");
    }
  }
  return undefined;
};

const API_TARGET =
  pick(
    "API_PROXY_TARGET",
    "VITE_API_PROXY_TARGET",
    "VITE_API_BASE_URL",
    "REACT_APP_API_URL"
  ) || "http://localhost:3000";

const isProduction = process.env.NODE_ENV === "production";

// =====================================================
// PROXY /api AND /uploads TO THE BACKEND
// =====================================================

const proxyOptions = {
  target: API_TARGET,
  changeOrigin: true,
  logLevel: "warn",
  onError(err, req, res) {
    console.error(`[proxy] Error proxying ${req.url}:`, err.message);
    res.status(502).json({
      success: false,
      message: "Backend service is unreachable",
    });
  },
};

// NOTE: http-proxy-middleware (v3) strips the mount path by default.
// The Express backend mounts its routers at /api/... and /uploads/...,
// so we restore the prefix with pathRewrite to keep the original path.
app.use(
  "/api",
  createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: (path) => `/api${path}`,
  })
);

app.use(
  "/uploads",
  createProxyMiddleware({
    ...proxyOptions,
    pathRewrite: (path) => `/uploads${path}`,
  })
);

// =====================================================
// SERVE STATIC FILES FROM dist/
// =====================================================

const distDir = path.join(__dirname, "dist");

if (!fs.existsSync(distDir)) {
  console.error(
    "dist/ directory not found. Run 'npm run build' first."
  );
  process.exit(1);
}

app.use(express.static(distDir));

// =====================================================
// SPA FALLBACK — serve index.html for client-side routes
// =====================================================

app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

// =====================================================
// START
// =====================================================

app.listen(port, "0.0.0.0", () => {
  console.log(`Frontend server running on port ${port}`);
  console.log(`Environment:        ${isProduction ? "production" : "development"}`);
  console.log(`Proxying /api to:   ${API_TARGET}`);
});
