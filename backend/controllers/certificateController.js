// controllers/certificateController.js
// certificates: certificate_id, user_id, assigned_officer_id, certificate_type,
//               purpose, status ('Pending'|'Processing'|'Approved'|'Rejected'|'Completed'),
//               applied_date, approved_date, remarks, additional_info_requested, document_path
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const VALID_CERTIFICATE_TYPES = ["Birth", "Marriage", "Death", "Residence", "Business", "Character"];

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

    const documentPath = req.file ? `/uploads/certificates/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO certificates (user_id, municipality_id, certificate_type, purpose, status, applied_date, document_path)
       VALUES (?, ?, ?, ?, 'Pending', NOW(), ?)`,
      [userId, req.user.municipality_id, certificate_type, purpose, documentPath]
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
// application in the Admin's own Municipality, for the Application
// Management screen.
async function adminListApplications(req, res) {
  try {
    const { status, certificate_type, officer_id } = req.query;

    let sql = `
      SELECT c.*, u.full_name AS citizen_name, u.email AS citizen_email,
             o.full_name AS officer_name
      FROM certificates c
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN users o ON c.assigned_officer_id = o.user_id
      WHERE c.municipality_id = ?
    `;
    const params = [req.user.municipality_id];

    if (status) { sql += " AND c.status = ?"; params.push(status); }
    if (certificate_type) { sql += " AND c.certificate_type = ?"; params.push(certificate_type); }
    if (officer_id) { sql += " AND c.assigned_officer_id = ?"; params.push(officer_id); }

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
      "SELECT * FROM certificates WHERE certificate_id = ? AND municipality_id = ?",
      [id, municipalityId]
    );
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
