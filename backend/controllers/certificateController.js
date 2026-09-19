// controllers/certificateController.js
// certificates: certificate_id, user_id, certificate_type, purpose, status,
//               applied_date, approved_date, remarks, document_path
const { pool } = require("../config/db");

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

module.exports = { applyForCertificate, VALID_CERTIFICATE_TYPES };
