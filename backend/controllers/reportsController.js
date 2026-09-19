// controllers/reportsController.js — Admin-only, system-wide analytics.
// This is deliberately never reused by the Officer role (see
// officerController.getReports, which is scoped to assigned work only).
const { pool } = require("../config/db");

// GET /api/admin/reports
async function getSystemReports(req, res) {
  try {
    const [citizenStats] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM users WHERE role = 'Citizen' GROUP BY status"
    );
    const [businessStats] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM businesses GROUP BY status"
    );
    const [officerStats] = await pool.query(
      "SELECT officer_status, COUNT(*) AS count FROM users WHERE role = 'Officer' GROUP BY officer_status"
    );
    const [applicationStats] = await pool.query(
      `SELECT certificate_type, status, COUNT(*) AS count
       FROM certificates GROUP BY certificate_type, status
       ORDER BY certificate_type, status`
    );
    const [complaintStats] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM complaints GROUP BY status"
    );
    const [orderStats] = await pool.query(
      `SELECT order_status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
       FROM orders GROUP BY order_status`
    );
    const [paymentStats] = await pool.query(
      `SELECT payment_method, payment_status, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total
       FROM tax_payments GROUP BY payment_method, payment_status`
    );

    res.json({
      success: true,
      report: {
        citizenStats, businessStats, officerStats, applicationStats,
        complaintStats, orderStats, paymentStats,
      },
    });
  } catch (err) {
    console.error("Get system reports error:", err);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
}

module.exports = { getSystemReports };
