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

// GET /api/citizen/profile — my own account details
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, citizenship_no, created_at
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    console.error("Get citizen profile error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
}

// PATCH /api/citizen/profile — full_name/phone/address/citizenship_no only.
// email/role are never editable here.
async function updateProfile(req, res) {
  try {
    const { full_name, phone, address, citizenship_no } = req.body;

    if (!full_name) {
      return res.status(400).json({ success: false, error: "full_name is required" });
    }

    await pool.query(
      "UPDATE users SET full_name = ?, phone = ?, address = ?, citizenship_no = ? WHERE user_id = ?",
      [full_name, phone || null, address || null, citizenship_no || null, req.user.user_id]
    );

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Update citizen profile error:", err);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

module.exports = { getMyRequests, getMyStats, getMyPayments, getProfile, updateProfile };
