// controllers/certificateController.js
// certificates: certificate_id, user_id, assigned_officer_id, certificate_type,
//               purpose, status ('Pending'|'Processing'|'Approved'|'Rejected'|'Completed'),
//               applied_date, approved_date, remarks, additional_info_requested, document_path
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const VALID_CERTIFICATE_TYPES = ["Marriage", "Death", "Residence", "Business", "Character"];

async function applyForCertificate(req, res) {
  try {
    const userId = req.user.user_id;
    const { certificate_type, purpose } = req.body;

    if (!certificate_type || !purpose) {
      return res.status(400).json({ success: false, error: "certificate_type and purpose are required" });
    }

    if (!VALID_CERTIFICATE_TYPES.includes(certificate_type)) {
      return res.status(400).json({
        success: false,
        error: `certificate_type must be one of: ${VALID_CERTIFICATE_TYPES.join(", ")}`,
      });
    }

    // Citizens must have a citizenship number on file before applying for any
    // certificate (Business accounts identify via PAN/registration instead).
    if (req.user.role === "Citizen") {
      const [userRows] = await pool.query("SELECT citizenship_no FROM users WHERE user_id = ?", [userId]);
      if (userRows.length === 0 || !userRows[0].citizenship_no) {
        return res.status(400).json({
          success: false,
          error: "Add your citizenship number in your profile before applying for a certificate.",
        });
      }
    }

    const documentPath = req.file ? `/uploads/certificates/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO certificates (user_id, certificate_type, purpose, status, applied_date, document_path)
       VALUES (?, ?, ?, 'Pending', NOW(), ?)`,
      [userId, certificate_type, purpose, documentPath]
    );

    res.status(201).json({
      success: true,
      message: "Certificate application submitted",
      certificate_id: result.insertId,
    });
  } catch (err) {
    console.error("Apply for certificate error:", err);
    res.status(500).json({ success: false, error: "Failed to submit application" });
  }
}

// GET /api/admin/applications?status=&certificate_type=&officer_id= — every
// application system-wide, for Admin's Application Management screen.
async function adminListApplications(req, res) {
  try {
    const { status, certificate_type, officer_id } = req.query;

    let sql = `
      SELECT c.*, u.full_name AS citizen_name, u.email AS citizen_email,
             o.full_name AS officer_name
      FROM certificates c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
    `;
    const conditions = [];
    const params = [];

    if (status) { conditions.push("c.status = ?"); params.push(status); }
    if (certificate_type) { conditions.push("c.certificate_type = ?"); params.push(certificate_type); }
    if (officer_id) { conditions.push("c.assigned_officer_id = ?"); params.push(officer_id); }

    if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY c.applied_date DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, applications: rows });
  } catch (err) {
    console.error("Admin list applications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch applications" });
  }
}

// PATCH /api/admin/applications/:id/assign — body: { officer_id }
async function assignApplication(req, res) {
  try {
    const { id } = req.params;
    const { officer_id } = req.body;

    if (!officer_id) {
      return res.status(400).json({ success: false, error: "officer_id is required" });
    }

    const [officerRows] = await pool.query(
      "SELECT user_id, full_name FROM users WHERE user_id = ? AND role = 'Officer' AND officer_status = 'Approved'",
      [officer_id]
    );
    if (officerRows.length === 0) {
      return res.status(400).json({ success: false, error: "officer_id must be an approved Officer" });
    }

    const [existing] = await pool.query("SELECT * FROM certificates WHERE certificate_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Application not found" });
    }

    const nextStatus = existing[0].status === "Pending" ? "Processing" : existing[0].status;

    await pool.query(
      "UPDATE certificates SET assigned_officer_id = ?, status = ? WHERE certificate_id = ?",
      [officer_id, nextStatus, id]
    );

    await createNotification({
      user_id: officer_id,
      title: "New application assigned",
      message: `You have been assigned a ${existing[0].certificate_type} certificate application (#${id}).`,
      related_type: "certificate",
      related_id: id,
    });

    res.json({ success: true, message: `Application assigned to ${officerRows[0].full_name}` });
  } catch (err) {
    console.error("Assign application error:", err);
    res.status(500).json({ success: false, error: "Failed to assign application" });
  }
}

module.exports = {
  applyForCertificate, VALID_CERTIFICATE_TYPES, adminListApplications, assignApplication,
};
