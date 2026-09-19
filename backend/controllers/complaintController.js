// controllers/complaintController.js
// complaints: complaint_id, user_id, subject, description, location,
//             status ('Pending'|'In Progress'|'Resolved'), created_at, image,
//             officer_response
const { pool } = require("../config/db");

const VALID_STATUSES = ["Pending", "In Progress", "Resolved"];

// POST /api/complaints — citizen submits a complaint
async function submitComplaint(req, res) {
  try {
    const userId = req.user.user_id;
    const { subject, description, location } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, error: "subject and description are required" });
    }

    const imagePath = req.file ? `/uploads/complaints/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO complaints (user_id, subject, description, location, status, created_at, image)
       VALUES (?, ?, ?, ?, 'Pending', NOW(), ?)`,
      [userId, subject, description, location || null, imagePath]
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

// GET /api/officer/complaints — officer/admin views all complaints
async function getAllComplaints(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.full_name, u.email
       FROM complaints c
       JOIN users u ON c.user_id = u.user_id
       ORDER BY c.created_at DESC`
    );
    res.json({ success: true, complaints: rows });
  } catch (err) {
    console.error("Get all complaints error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch complaints" });
  }
}

// PATCH /api/officer/complaints/:id — officer updates status and/or writes
// a response back to the citizen. Either field alone is enough.
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

    await pool.query(
      "UPDATE complaints SET status = ?, officer_response = ? WHERE complaint_id = ?",
      [
        status || existing[0].status,
        response !== undefined ? response : existing[0].officer_response,
        id,
      ]
    );

    res.json({ success: true, message: "Complaint updated" });
  } catch (err) {
    console.error("Update complaint error:", err);
    res.status(500).json({ success: false, error: "Failed to update complaint" });
  }
}

module.exports = { submitComplaint, getMyComplaints, getAllComplaints, updateComplaintStatus };
