// config/db.js
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "smart_municipality_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL database:", process.env.DB_NAME);
    conn.release();
  } catch (err) {
    console.error("❌ Failed to connect to MySQL:", err.message);
    console.error("   Check that XAMPP's MySQL service is running and .env credentials are correct.");
  }
}

module.exports = { pool, testConnection };
