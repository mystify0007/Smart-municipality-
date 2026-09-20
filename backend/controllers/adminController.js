// controllers/adminController.js
// notices: notice_id, title, description, target_role ('All'|'Citizen'|'Officer'),
//          publish_date (date, required), updated_at, created_by
// Every query in this file is scoped to req.user.municipality_id — each
// Municipality's Admin only ever sees their own Municipality's citizens,
// officers, applications, and complaints.
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

// GET /api/admin/stats — the Admin Dashboard Overview
async function getAdminStats(req, res) {
  try {
    const municipalityId = req.user.municipality_id;

    const [[{ total_citizens }]] = await pool.query(
      "SELECT COUNT(*) AS total_citizens FROM users WHERE role = 'Citizen' AND municipality_id = ?",
      [municipalityId]
    );
    const [[{ total_officers }]] = await pool.query(
      "SELECT COUNT(*) AS total_officers FROM users WHERE role = 'Officer' AND municipality_id = ?",
      [municipalityId]
    );
    const [[{ pending_officer_verifications }]] = await pool.query(
      "SELECT COUNT(*) AS pending_officer_verifications FROM users WHERE role = 'Officer' AND officer_status = 'Pending' AND municipality_id = ?",
      [municipalityId]
    );
    const [[{ pending_applications }]] = await pool.query(
      "SELECT COUNT(*) AS pending_applications FROM certificates WHERE status = 'Pending' AND municipality_id = ?",
      [municipalityId]
    );
    const [[{ pending_complaints }]] = await pool.query(
      "SELECT COUNT(*) AS pending_complaints FROM complaints WHERE status = 'Pending' AND municipality_id = ?",
      [municipalityId]
    );
    const [[{ total_revenue }]] = await pool.query(
      `SELECT COALESCE(SUM(t.amount), 0) AS total_revenue
       FROM tax_payments t JOIN users u ON t.user_id = u.user_id
       WHERE t.payment_status = 'Paid' AND u.municipality_id = ?`,
      [municipalityId]
    );

    const [recent_activities] = await pool.query(`
      (SELECT 'Application' AS type, c.certificate_id AS ref_id,
              CONCAT(c.certificate_type, ' certificate application — ', c.status) AS description,
              c.applied_date AS occurred_at
       FROM certificates c WHERE c.municipality_id = ? ORDER BY c.applied_date DESC LIMIT 5)
      UNION ALL
      (SELECT 'Complaint' AS type, cp.complaint_id AS ref_id,
              CONCAT('Complaint "', cp.subject, '" — ', cp.status) AS description,
              cp.created_at AS occurred_at
       FROM complaints cp WHERE cp.municipality_id = ? ORDER BY cp.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'Officer' AS type, user_id AS ref_id,
              CONCAT('Officer ', full_name, ' — ', COALESCE(officer_status, 'n/a')) AS description,
              COALESCE(verified_at, created_at) AS occurred_at
       FROM users WHERE role = 'Officer' AND municipality_id = ? ORDER BY COALESCE(verified_at, created_at) DESC LIMIT 5)
      ORDER BY occurred_at DESC
      LIMIT 15
    `, [municipalityId, municipalityId, municipalityId]);

    res.json({
      success: true,
      stats: {
        total_citizens, total_officers,
        pending_officer_verifications, pending_applications, pending_complaints,
        total_revenue,
        recent_activities,
      },
    });
  } catch (err) {
    console.error("Get admin stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch admin stats" });
  }
}

// ---------------------------------------------------------------------------
// Announcements (notices) — scoped to the Admin's own Municipality
// ---------------------------------------------------------------------------

// GET /api/notices?municipality_id= — public notice board for one municipality
async function getNotices(req, res) {
  try {
    const { municipality_id } = req.query;
    if (!municipality_id) {
      return res.status(400).json({ success: false, error: "municipality_id is required" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM notices WHERE municipality_id = ? ORDER BY publish_date DESC",
      [municipality_id]
    );
    res.json({ success: true, notices: rows });
  } catch (err) {
    console.error("Get notices error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch notices" });
  }
}

// GET /api/admin/notices — the Admin's own Municipality's notices (Admin
// Notices management screen; unlike getNotices above this needs no query
// param, since the Municipality comes from the logged-in Admin's own token)
async function getMyMunicipalityNotices(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notices WHERE municipality_id = ? ORDER BY publish_date DESC",
      [req.user.municipality_id]
    );
    res.json({ success: true, notices: rows });
  } catch (err) {
    console.error("Get municipality notices error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch notices" });
  }
}

// POST /api/admin/notices — create an announcement, optionally targeted at
// one role. Also fires a real-time notification to that audience.
async function createNotice(req, res) {
  try {
    const { title, description, publish_date, target_role } = req.body;
    const createdBy = req.user.user_id;
    const municipalityId = req.user.municipality_id;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: "title and description are required" });
    }

    const role = target_role || "All";
    if (!["All", "Citizen", "Officer"].includes(role)) {
      return res.status(400).json({ success: false, error: "target_role must be All, Citizen, or Officer" });
    }

    const date = publish_date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await pool.query(
      "INSERT INTO notices (title, description, target_role, publish_date, created_by, municipality_id) VALUES (?, ?, ?, ?, ?, ?)",
      [title, description, role, date, createdBy, municipalityId]
    );

    await createNotification({
      role_target: role,
      municipality_id: municipalityId,
      title: `Announcement: ${title}`,
      message: description,
      related_type: "notice",
      related_id: result.insertId,
    });

    res.status(201).json({ success: true, notice_id: result.insertId });
  } catch (err) {
    console.error("Create notice error:", err);
    res.status(500).json({ success: false, error: "Failed to create notice" });
  }
}

// PATCH /api/admin/notices/:id
async function updateNotice(req, res) {
  try {
    const { id } = req.params;
    const { title, description, target_role } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM notices WHERE notice_id = ? AND municipality_id = ?",
      [id, req.user.municipality_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Notice not found" });
    }

    if (target_role && !["All", "Citizen", "Officer"].includes(target_role)) {
      return res.status(400).json({ success: false, error: "target_role must be All, Citizen, or Officer" });
    }

    await pool.query(
      "UPDATE notices SET title = ?, description = ?, target_role = ?, updated_at = NOW() WHERE notice_id = ?",
      [
        title || existing[0].title,
        description || existing[0].description,
        target_role || existing[0].target_role,
        id,
      ]
    );

    res.json({ success: true, message: "Notice updated" });
  } catch (err) {
    console.error("Update notice error:", err);
    res.status(500).json({ success: false, error: "Failed to update notice" });
  }
}

// DELETE /api/admin/notices/:id
async function deleteNotice(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM notices WHERE notice_id = ? AND municipality_id = ?",
      [id, req.user.municipality_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Notice not found" });
    }
    res.json({ success: true, message: "Notice deleted" });
  } catch (err) {
    console.error("Delete notice error:", err);
    res.status(500).json({ success: false, error: "Failed to delete notice" });
  }
}

// ---------------------------------------------------------------------------
// Citizen management — scoped to the Admin's own Municipality
// ---------------------------------------------------------------------------

// GET /api/admin/citizens?search=&status=
async function getCitizens(req, res) {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT user_id, full_name, email, phone, address, citizenship_no, status, created_at
      FROM users WHERE role = 'Citizen' AND municipality_id = ?
    `;
    const params = [req.user.municipality_id];

    if (search) {
      sql += " AND (full_name LIKE ? OR email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, citizens: rows });
  } catch (err) {
    console.error("Get citizens error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch citizens" });
  }
}

// GET /api/admin/citizens/:id — profile + full service history
async function getCitizenDetail(req, res) {
  try {
    const { id } = req.params;
    const municipalityId = req.user.municipality_id;

    const [userRows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, citizenship_no, status, created_at
       FROM users WHERE user_id = ? AND role = 'Citizen' AND municipality_id = ?`,
      [id, municipalityId]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: "Citizen not found" });
    }

    const [certificates] = await pool.query(
      "SELECT * FROM certificates WHERE user_id = ? ORDER BY applied_date DESC", [id]
    );
    const [complaints] = await pool.query(
      "SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC", [id]
    );

    res.json({ success: true, citizen: userRows[0], certificates, complaints });
  } catch (err) {
    console.error("Get citizen detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch citizen" });
  }
}

// PATCH /api/admin/users/:id/status — block/unblock a citizen account
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Blocked"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be Active or Blocked" });
    }

    const [result] = await pool.query(
      "UPDATE users SET status = ? WHERE user_id = ? AND municipality_id = ?",
      [status, id, req.user.municipality_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: `User ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ success: false, error: "Failed to update user" });
  }
}

// GET /api/admin/profile — the Admin's own account details
async function getAdminProfile(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, full_name, email, phone, address, profile_image, created_at FROM users WHERE user_id = ?",
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    console.error("Get admin profile error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
}

// PATCH /api/admin/profile — full_name, phone, address. Email is the login
// identifier and is never editable here.
async function updateAdminProfile(req, res) {
  try {
    const { full_name, phone, address } = req.body;

    const [existing] = await pool.query("SELECT * FROM users WHERE user_id = ?", [req.user.user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    await pool.query(
      "UPDATE users SET full_name = ?, phone = ?, address = ? WHERE user_id = ?",
      [full_name || existing[0].full_name, phone ?? existing[0].phone, address ?? existing[0].address, req.user.user_id]
    );

    res.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error("Update admin profile error:", err);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

module.exports = {
  getAdminStats,
  getNotices, getMyMunicipalityNotices, createNotice, updateNotice, deleteNotice,
  getCitizens, getCitizenDetail,
  updateUserStatus,
  getAdminProfile, updateAdminProfile,
};
