// controllers/officerController.js
// Everything here is scoped to the calling Officer's OWN assignments —
// system-wide data (all applications, all complaints, all officers) lives
// under /api/admin/* instead. This is what keeps an Officer from seeing or
// touching work that wasn't assigned to them.
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const VALID_STATUSES = ["Pending", "Processing", "Approved", "Rejected", "Completed"];

// GET /api/officer/queue — MY assigned certificate applications
async function getQueue(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.certificate_id, c.certificate_type, c.purpose, c.status,
              c.applied_date, c.approved_date, c.remarks, c.document_path,
              c.additional_info_requested,
              u.user_id, u.full_name, u.email, u.phone, u.citizenship_no
       FROM certificates c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.assigned_officer_id = ?
       ORDER BY c.applied_date ASC`,
      [req.user.user_id]
    );
    res.json({ success: true, queue: rows });
  } catch (err) {
    console.error("Get officer queue error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch queue" });
  }
}

// GET /api/officer/stats — MY assigned application counts by status, plus
// how many complaints are assigned to me, for the dashboard overview cards
async function getOfficerStats(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM certificates WHERE assigned_officer_id = ? GROUP BY status`,
      [req.user.user_id]
    );
    const [[{ assignedComplaints }]] = await pool.query(
      "SELECT COUNT(*) AS assignedComplaints FROM complaints WHERE assigned_officer_id = ?",
      [req.user.user_id]
    );
    res.json({ success: true, stats: rows, assigned_complaints: assignedComplaints });
  } catch (err) {
    console.error("Get officer stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
}

// PATCH /api/officer/applications/:id — approve/reject/progress + remarks.
// Restricted to an application actually assigned to this officer.
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

    if (existing[0].assigned_officer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, error: "This application is not assigned to you" });
    }

    const approvedDate = status === "Approved" ? new Date() : existing[0].approved_date;

    await pool.query(
      `UPDATE certificates
       SET status = ?, remarks = ?, approved_date = ?
       WHERE certificate_id = ?`,
      [status, remarks || existing[0].remarks, approvedDate, id]
    );

    await createNotification({
      user_id: existing[0].user_id,
      title: "Application status updated",
      message: `Your ${existing[0].certificate_type} certificate application is now "${status}".${remarks ? ` Remarks: ${remarks}` : ""}`,
      related_type: "certificate",
      related_id: id,
    });

    res.json({ success: true, message: `Application ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Update application error:", err);
    res.status(500).json({ success: false, error: "Failed to update application" });
  }
}

// PATCH /api/officer/applications/:id/request-info — body: { message }.
// Lets an officer ask the citizen for more documents/information without
// rejecting the application outright.
async function requestMoreInfo(req, res) {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, error: "message is required" });
    }

    const [existing] = await pool.query("SELECT * FROM certificates WHERE certificate_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }
    if (existing[0].assigned_officer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, error: "This application is not assigned to you" });
    }

    await pool.query(
      "UPDATE certificates SET additional_info_requested = ? WHERE certificate_id = ?",
      [message, id]
    );

    await createNotification({
      user_id: existing[0].user_id,
      title: "Additional information requested",
      message: `An officer requested more information on your ${existing[0].certificate_type} certificate application: ${message}`,
      related_type: "certificate",
      related_id: id,
    });

    res.json({ success: true, message: "Request sent to citizen" });
  } catch (err) {
    console.error("Request more info error:", err);
    res.status(500).json({ success: false, error: "Failed to send request" });
  }
}

// GET /api/officer/profile — my own account details, including verification status
async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, role, department, designation,
              officer_status, citizenship_no, profile_image, created_at
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

// PATCH /api/officer/profile — contact details only. department/designation/
// officer_status are Admin-controlled and never editable by the officer.
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

// GET /api/officer/reports — scoped to MY assigned work only. System-wide
// analytics live under /api/admin/reports and are never exposed here.
async function getReports(req, res) {
  try {
    const [certificateReport] = await pool.query(
      `SELECT certificate_type, status, COUNT(*) AS count
       FROM certificates WHERE assigned_officer_id = ?
       GROUP BY certificate_type, status
       ORDER BY certificate_type, status`,
      [req.user.user_id]
    );

    const [complaintReport] = await pool.query(
      `SELECT status, COUNT(*) AS count FROM complaints WHERE assigned_officer_id = ? GROUP BY status`,
      [req.user.user_id]
    );

    res.json({ success: true, certificateReport, complaintReport });
  } catch (err) {
    console.error("Get officer reports error:", err);
    res.status(500).json({ success: false, error: "Failed to generate report" });
  }
}

module.exports = {
  getQueue, getOfficerStats, updateApplication, requestMoreInfo,
  getProfile, updateProfile, getReports,
};
