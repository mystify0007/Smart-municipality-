// controllers/officerVerificationController.js
// Admin-only: verify, approve, reject, suspend, and reactivate Officer
// accounts. This is the ONLY place officer_status ever changes — the
// Officer role itself has no way to approve or affect its own verification.
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const OFFICER_STATUSES = ["Pending", "Approved", "Rejected", "Suspended"];

// GET /api/admin/officers?status=Pending — list Officer accounts in the
// Admin's own Municipality, optionally filtered by verification status. Each
// row includes active_workload — how many assigned applications/complaints
// are currently in progress for that officer — so the Admin can see at a
// glance who is free before assigning new work.
async function listOfficers(req, res) {
  try {
    const { status } = req.query;

    let sql = `
      SELECT u.user_id, u.full_name, u.email, u.phone, u.department, u.designation,
             u.officer_status, u.rejection_reason, u.verified_by, u.verified_at,
             u.status AS account_status, u.created_at,
             (
               (SELECT COUNT(*) FROM certificates c WHERE c.assigned_officer_id = u.user_id AND c.status = 'Processing')
               +
               (SELECT COUNT(*) FROM complaints cp WHERE cp.assigned_officer_id = u.user_id AND cp.status = 'In Progress')
             ) AS active_workload
      FROM users u
      WHERE u.role = 'Officer' AND u.municipality_id = ?
    `;
    const params = [req.user.municipality_id];

    if (status) {
      if (!OFFICER_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `status must be one of: ${OFFICER_STATUSES.join(", ")}`,
        });
      }
      sql += " AND u.officer_status = ?";
      params.push(status);
    }

    sql += " ORDER BY active_workload ASC, u.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, officers: rows });
  } catch (err) {
    console.error("List officers error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch officers" });
  }
}

// GET /api/admin/officers/:id — full detail including submitted documents
async function getOfficerDetail(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, department, designation,
              officer_status, rejection_reason, verified_by, verified_at,
              status AS account_status, created_at
       FROM users WHERE user_id = ? AND role = 'Officer' AND municipality_id = ?`,
      [id, req.user.municipality_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Officer not found" });
    }

    const [documents] = await pool.query(
      "SELECT document_id, file_path, uploaded_at FROM officer_documents WHERE user_id = ? ORDER BY uploaded_at ASC",
      [id]
    );

    res.json({ success: true, officer: rows[0], documents });
  } catch (err) {
    console.error("Get officer detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch officer" });
  }
}

async function findOfficer(id, municipalityId) {
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE user_id = ? AND role = 'Officer' AND municipality_id = ?",
    [id, municipalityId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// PATCH /api/admin/officers/:id/approve
async function approveOfficer(req, res) {
  try {
    const { id } = req.params;
    const officer = await findOfficer(id, req.user.municipality_id);
    if (!officer) return res.status(404).json({ success: false, error: "Officer not found" });

    await pool.query(
      `UPDATE users SET officer_status = 'Approved', rejection_reason = NULL,
              verified_by = ?, verified_at = NOW()
       WHERE user_id = ?`,
      [req.user.user_id, id]
    );

    await createNotification({
      user_id: id,
      title: "Officer account approved",
      message: "Your officer account has been approved. You can now log in to the Officer Dashboard.",
      related_type: "officer_verification",
      related_id: id,
    });

    res.json({ success: true, message: "Officer approved" });
  } catch (err) {
    console.error("Approve officer error:", err);
    res.status(500).json({ success: false, error: "Failed to approve officer" });
  }
}

// PATCH /api/admin/officers/:id/reject — body: { reason }
async function rejectOfficer(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, error: "A rejection reason is required" });
    }

    const officer = await findOfficer(id, req.user.municipality_id);
    if (!officer) return res.status(404).json({ success: false, error: "Officer not found" });

    await pool.query(
      `UPDATE users SET officer_status = 'Rejected', rejection_reason = ?,
              verified_by = ?, verified_at = NOW()
       WHERE user_id = ?`,
      [reason, req.user.user_id, id]
    );

    await createNotification({
      user_id: id,
      title: "Officer application rejected",
      message: `Your officer registration was rejected. Reason: ${reason}`,
      related_type: "officer_verification",
      related_id: id,
    });

    res.json({ success: true, message: "Officer rejected" });
  } catch (err) {
    console.error("Reject officer error:", err);
    res.status(500).json({ success: false, error: "Failed to reject officer" });
  }
}

// PATCH /api/admin/officers/:id/suspend
async function suspendOfficer(req, res) {
  try {
    const { id } = req.params;
    const officer = await findOfficer(id, req.user.municipality_id);
    if (!officer) return res.status(404).json({ success: false, error: "Officer not found" });

    if (officer.officer_status !== "Approved") {
      return res.status(400).json({ success: false, error: "Only an approved officer can be suspended" });
    }

    await pool.query(
      "UPDATE users SET officer_status = 'Suspended', verified_by = ?, verified_at = NOW() WHERE user_id = ?",
      [req.user.user_id, id]
    );

    await createNotification({
      user_id: id,
      title: "Officer account suspended",
      message: "Your officer account has been suspended. Contact the Admin for details.",
      related_type: "officer_verification",
      related_id: id,
    });

    res.json({ success: true, message: "Officer suspended" });
  } catch (err) {
    console.error("Suspend officer error:", err);
    res.status(500).json({ success: false, error: "Failed to suspend officer" });
  }
}

// PATCH /api/admin/officers/:id/activate — reinstate a suspended officer
async function activateOfficer(req, res) {
  try {
    const { id } = req.params;
    const officer = await findOfficer(id, req.user.municipality_id);
    if (!officer) return res.status(404).json({ success: false, error: "Officer not found" });

    if (officer.officer_status !== "Suspended") {
      return res.status(400).json({ success: false, error: "Only a suspended officer can be reactivated" });
    }

    await pool.query(
      "UPDATE users SET officer_status = 'Approved', verified_by = ?, verified_at = NOW() WHERE user_id = ?",
      [req.user.user_id, id]
    );

    await createNotification({
      user_id: id,
      title: "Officer account reactivated",
      message: "Your officer account has been reactivated. You can log in again.",
      related_type: "officer_verification",
      related_id: id,
    });

    res.json({ success: true, message: "Officer reactivated" });
  } catch (err) {
    console.error("Activate officer error:", err);
    res.status(500).json({ success: false, error: "Failed to reactivate officer" });
  }
}

module.exports = {
  listOfficers, getOfficerDetail, approveOfficer, rejectOfficer, suspendOfficer, activateOfficer,
};
