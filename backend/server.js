require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDB } = require("./db");
const authRoutes = require("./routes/auth");
const vaccineRoutes = require("./routes/vaccine");

const app = express();
const PORT = process.env.PORT || 3001;

// ===== MIDDLEWARE =====

// CORS — allow frontend origin
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      /\.vercel\.app$/, // ← allows any vercel.app subdomain
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse JSON bodies
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Request logger (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ===== ROUTES =====
app.use("/api", authRoutes);
app.use("/api", vaccineRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

// ===== START SERVER =====
const startServer = async () => {
  try {
    // initDB is async with sql.js
    await initDB();

    app.listen(PORT, () => {
      console.log(`\n🚀 MDC Vaccination Card Server running`);
      console.log(`   URL:  http://localhost:${PORT}`);
      console.log(`   ENV:  ${process.env.NODE_ENV}`);
      console.log(`   Seed: ${process.env.SEED_EMAIL}\n`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
