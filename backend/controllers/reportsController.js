// controllers/reportsController.js — Admin-only analytics, scoped to the
// Admin's own Municipality. This is deliberately never reused by the
// Officer role (see officerController.getReports, which is scoped to
// assigned work only).
const { pool } = require("../config/db");

// GET /api/admin/reports
async function getSystemReports(req, res) {
  try {
    const municipalityId = req.user.municipality_id;

    const [citizenStats] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM users WHERE role = 'Citizen' AND municipality_id = ? GROUP BY status",
      [municipalityId]
    );
    const [officerStats] = await pool.query(
      "SELECT officer_status, COUNT(*) AS count FROM users WHERE role = 'Officer' AND municipality_id = ? GROUP BY officer_status",
      [municipalityId]
    );
    const [applicationStats] = await pool.query(
      `SELECT certificate_type, status, COUNT(*) AS count
       FROM certificates WHERE municipality_id = ? GROUP BY certificate_type, status
       ORDER BY certificate_type, status`,
      [municipalityId]
    );
    const [complaintStats] = await pool.query(
      "SELECT status, COUNT(*) AS count FROM complaints WHERE municipality_id = ? GROUP BY status",
      [municipalityId]
    );
    const [paymentStats] = await pool.query(
      `SELECT t.payment_method, t.payment_status, COUNT(*) AS count, COALESCE(SUM(t.amount), 0) AS total
       FROM tax_payments t JOIN users u ON t.user_id = u.user_id
       WHERE u.municipality_id = ?
       GROUP BY t.payment_method, t.payment_status`,
      [municipalityId]
    );

    res.json({
      success: true,
      report: {
        citizenStats, officerStats, applicationStats,
        complaintStats, paymentStats,
      },
    });
  } catch (err) {
    console.error("Get system reports error:", err);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
}

module.exports = { getSystemReports };
