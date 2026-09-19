// controllers/officerController.js
const { pool } = require("../config/db");

const VALID_STATUSES = ["Pending", "Approved", "Rejected"];

// GET /api/officer/queue — all certificate applications needing review,
// joined with the citizen's name so the officer doesn't have to look it up separately
async function getQueue(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.certificate_id, c.certificate_type, c.purpose, c.status,
              c.applied_date, c.approved_date, c.remarks,
              u.user_id, u.full_name, u.email
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

module.exports = { getQueue, getOfficerStats, updateApplication };
