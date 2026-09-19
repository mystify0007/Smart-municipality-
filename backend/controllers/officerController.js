// controllers/officerController.js
const { pool } = require("../config/db");

const VALID_STATUSES = ["Pending", "Approved", "Rejected"];

// GET /api/officer/queue — all certificate applications needing review,
// joined with the citizen's name/ID docs so the officer doesn't have to
// look them up separately.
async function getQueue(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.certificate_id, c.certificate_type, c.purpose, c.status,
              c.applied_date, c.approved_date, c.remarks, c.document_path,
              u.user_id, u.full_name, u.email, u.phone, u.citizenship_no
       FROM certificates c
       JOIN users u ON c.user_id = u.user_id
       ORDER BY c.applied_date ASC`
    );
    res.json({ success: true, queue: rows });
  } catch (err) {
    console.error("Get officer queue error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch queue" });
  }
}

// GET /api/officer/stats — pending review counts for dashboard cards
async function getOfficerStats(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM certificates GROUP BY status`
    );
    res.json({ success: true, stats: rows });
  } catch (err) {
    console.error("Get officer stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
}

// PATCH /api/officer/applications/:id — approve/reject + remarks.
// On approval, also creates a notification-equivalent by updating approved_date.
async function updateApplication(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const [existing] = await pool.query("SELECT * FROM certificates WHERE certificate_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    const approvedDate = status === "Approved" ? new Date() : existing[0].approved_date;

    await pool.query(
      `UPDATE certificates
       SET status = ?, remarks = ?, approved_date = ?
       WHERE certificate_id = ?`,
      [status, remarks || existing[0].remarks, approvedDate, id]
    );

    res.json({ success: true, message: `Application ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ success: false, error: "Failed to update application" });
  }
}

// GET /api/officer/profile — the logged-in officer's own account details
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, role, citizenship_no, profile_image, created_at
       FROM users WHERE user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    console.error("Get officer profile error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
}

// PATCH /api/officer/profile — update the officer's own contact details.
// full_name/email/role are left alone here since email doubles as the
// login identifier and full_name is baked into the JWT until next login.
async function updateProfile(req, res) {
  try {
    const { phone, address } = req.body;

    await pool.query(
      "UPDATE users SET phone = ?, address = ? WHERE user_id = ?",
      [phone || null, address || null, req.user.user_id]
    );

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Update officer profile error:", err);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

// GET /api/officer/reports — service-activity summary for reporting:
// certificate volume by type/status and complaint volume by status.
async function getReports(req, res) {
  try {
    const [certificateReport] = await pool.query(
      `SELECT certificate_type, status, COUNT(*) AS count
       FROM certificates
       GROUP BY certificate_type, status
       ORDER BY certificate_type, status`
    );

    const [complaintReport] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM complaints GROUP BY status`
    );

    res.json({ success: true, certificateReport, complaintReport });
  } catch (err) {
    console.error("Get officer reports error:", err);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
}

module.exports = {
  getQueue, getOfficerStats, updateApplication,
  getProfile, updateProfile, getReports,
};
