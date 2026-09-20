// controllers/complaintController.js
// complaints: complaint_id, user_id, assigned_officer_id, subject, description,
//             location, status ('Pending'|'In Progress'|'Resolved'|'Escalated'|'Closed'),
//             escalated, closed_at, created_at, image, officer_response
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const VALID_STATUSES = ["Pending", "In Progress", "Resolved", "Escalated", "Closed"];

// POST /api/complaints — citizen submits a complaint
async function submitComplaint(req, res) {
  try {
    const userId = req.user.user_id;
    const { subject, description, location } = req.body;

    if (!req.user.municipality_id) {
      return res.status(400).json({
        success: false,
        error: "Complete your profile (select your municipality) before filing a complaint.",
      });
    }

    if (!subject || !description) {
      return res.status(400).json({ success: false, error: "subject and description are required" });
    }

    const imagePath = req.file ? `/uploads/complaints/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO complaints (user_id, municipality_id, subject, description, location, status, created_at, image)
       VALUES (?, ?, ?, ?, ?, 'Pending', NOW(), ?)`,
      [userId, req.user.municipality_id, subject, description, location || null, imagePath]
    );

    res.status(201).json({ success: true, complaint_id: result.insertId });
  } catch (err) {
    console.error("Submit complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to submit complaint" });
  }
}

// GET /api/complaints/mine — citizen views their own complaints
async function getMyComplaints(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      "SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Get complaints error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
}

// GET /api/officer/complaints — MY assigned complaints only
async function getMyAssignedComplaints(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name, u.email
       FROM complaints c
       JOIN users u ON c.user_id = u.user_id
       WHERE c.assigned_officer_id = ?
       ORDER BY c.created_at DESC`,
      [req.user.user_id]
    );
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Get assigned complaints error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
}

// GET /api/admin/complaints?status=&officer_id=&escalated= — every complaint
// in the Admin's own Municipality, for the Complaint Management screen.
async function adminListComplaints(req, res) {
  try {
    const { status, officer_id, escalated } = req.query;

    let sql = `
      SELECT c.*, u.full_name AS citizen_name, u.email AS citizen_email,
             o.full_name AS officer_name
      FROM complaints c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.municipality_id = ?
    `;
    const params = [req.user.municipality_id];

    if (status) { sql += " AND c.status = ?"; params.push(status); }
    if (officer_id) { sql += " AND c.assigned_officer_id = ?"; params.push(officer_id); }
    if (escalated !== undefined) { sql += " AND c.escalated = ?"; params.push(escalated === "true" ? 1 : 0); }

    sql += " ORDER BY c.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Admin list complaints error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
}

// PATCH /api/admin/complaints/:id/assign — body: { officer_id }
async function assignComplaint(req, res) {
  try {
    const { id } = req.params;
    const { officer_id } = req.body;
    const municipalityId = req.user.municipality_id;

    if (!officer_id) {
      return res.status(400).json({ success: false, error: "officer_id is required" });
    }

    const [officerRows] = await pool.query(
      "SELECT user_id, full_name FROM users WHERE user_id = ? AND role = 'Officer' AND officer_status = 'Approved' AND municipality_id = ?",
      [officer_id, municipalityId]
    );
    if (officerRows.length === 0) {
      return res.status(400).json({ success: false, error: "officer_id must be an approved Officer in your municipality" });
    }

    const [existing] = await pool.query(
      "SELECT * FROM complaints WHERE complaint_id = ? AND municipality_id = ?",
      [id, municipalityId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    const nextStatus = existing[0].status === "Pending" ? "In Progress" : existing[0].status;

    await pool.query(
      "UPDATE complaints SET assigned_officer_id = ?, status = ? WHERE complaint_id = ?",
      [officer_id, nextStatus, id]
    );

    await createNotification({
      user_id: officer_id,
      title: "New complaint assigned",
      message: `You have been assigned complaint #${id}: "${existing[0].subject}".`,
      related_type: "complaint",
      related_id: id,
    });

    res.json({ success: true, message: `Complaint assigned to ${officerRows[0].full_name}` });
  } catch (err) {
    console.error("Assign complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to assign complaint" });
  }
}

// PATCH /api/admin/complaints/:id/escalate
async function escalateComplaint(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "UPDATE complaints SET status = 'Escalated', escalated = 1 WHERE complaint_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }
    res.json({ success: true, message: "Complaint escalated" });
  } catch (err) {
    console.error("Escalate complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to escalate complaint" });
  }
}

// PATCH /api/admin/complaints/:id/close
async function closeComplaint(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "UPDATE complaints SET status = 'Closed', closed_at = NOW() WHERE complaint_id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }
    res.json({ success: true, message: "Complaint closed" });
  } catch (err) {
    console.error("Close complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to close complaint" });
  }
}

// PATCH /api/officer/complaints/:id — officer updates status and/or writes a
// response back to the citizen. Restricted to a complaint actually assigned
// to that officer; Admin may update any complaint.
async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, response } = req.body;

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    if (!status && response === undefined) {
      return res.status(400).json({ success: false, error: "status or response is required" });
    }

    const [existing] = await pool.query("SELECT * FROM complaints WHERE complaint_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    if (req.user.role === "Officer" && existing[0].assigned_officer_id !== req.user.user_id) {
      return res.status(403).json({ success: false, error: "This complaint is not assigned to you" });
    }

    const nextStatus = status || existing[0].status;
    const closedAt = ["Resolved", "Closed"].includes(nextStatus) ? new Date() : existing[0].closed_at;

    await pool.query(
      "UPDATE complaints SET status = ?, officer_response = ?, closed_at = ? WHERE complaint_id = ?",
      [nextStatus, response !== undefined ? response : existing[0].officer_response, closedAt, id]
    );

    await createNotification({
      user_id: existing[0].user_id,
      title: "Complaint update",
      message: `Your complaint "${existing[0].subject}" is now "${nextStatus}".${response ? ` Officer response: ${response}` : ""}`,
      related_type: "complaint",
      related_id: id,
    });

    res.json({ success: true, message: "Complaint updated" });
  } catch (err) {
    console.error("Update complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to update complaint" });
  }
}

module.exports = {
  submitComplaint, getMyComplaints, getMyAssignedComplaints,
  adminListComplaints, assignComplaint, escalateComplaint, closeComplaint,
  updateComplaintStatus,
};
