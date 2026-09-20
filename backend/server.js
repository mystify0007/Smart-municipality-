// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const { pool, testConnection } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const citizenRoutes = require("./routes/citizenRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const officerRoutes = require("./routes/officerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const taxRoutes = require("./routes/taxRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const locationRoutes = require("./routes/locationRoutes");

const { verifyToken, requireRole } = require("./middleware/authMiddleware");

const app = express();

// --- Core middleware ---
app.use(cors()); // dev: allow all; tighten to your deployed frontend origin in production
app.use(express.json());

// Serve uploaded files (certificate docs, product images) as static files
// e.g. a stored path like /uploads/products/169999-abc.png becomes downloadable
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Health check ---
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Smart Municipality backend is running" });
});

// --- DB sanity-check routes (kept from earlier debugging, harmless to leave in dev) ---
app.get("/api/db-test", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT NOW() AS server_time");
    res.json({ success: true, server_time: rows[0].server_time });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/db-tables", async (req, res) => {
  try {
    const [rows] = await pool.query("SHOW TABLES");
    res.json({ success: true, tables: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Feature routes ---
app.use("/api/auth", authRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/locations", locationRoutes);

// --- Middleware self-test routes (from Stage 3 lessons — safe to keep or delete) ---
app.get("/api/test-protected", verifyToken, (req, res) => {
  res.json({ success: true, message: "You got past the middleware!" });
});
app.get("/api/test-officer-only", verifyToken, requireRole("Officer"), (req, res) => {
  res.json({ success: true, message: "You're an Officer, welcome in!" });
});

// --- 404 handler (must come after all real routes) ---
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// --- Central error handler (catches anything thrown/passed to next(err)) ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Multer errors (file too large, wrong type) are thrown before reaching
  // the controller, so they need a specific, friendly message here rather
  // than falling into the generic 500 below.
  if (err && err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large."
        : `Upload error: ${err.message}`;
    return res.status(400).json({ success: false, error: message });
  }
  if (err && typeof err.message === "string" && err.message.startsWith("Unsupported file type")) {
    return res.status(400).json({ success: false, error: err.message });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await testConnection();
});
