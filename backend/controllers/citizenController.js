// controllers/citizenController.js
const { pool } = require("../config/db");

// GET /api/citizen/requests — all of MY certificate requests
async function getMyRequests(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      "SELECT * FROM certificates WHERE user_id = ? ORDER BY applied_date DESC",
      [userId]
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error("Get citizen requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch requests" });
  }
}

// GET /api/citizen/stats — counts grouped by status, for dashboard cards
async function getMyStats(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM certificates
       WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );
    res.json({ success: true, stats: rows });
  } catch (err) {
    console.error("Get citizen stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
}

// GET /api/citizen/tax-payments — MY tax payment history
async function getMyPayments(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      "SELECT * FROM tax_payments WHERE user_id = ? ORDER BY payment_date DESC",
      [userId]
    );
    res.json({ success: true, payments: rows });
  } catch (err) {
    console.error("Get citizen payments error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
}

module.exports = { getMyRequests, getMyStats, getMyPayments };
