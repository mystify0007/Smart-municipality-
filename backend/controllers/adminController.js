// controllers/adminController.js
// notices: notice_id, title, description, target_role ('All'|'Citizen'|'Business'|'Officer'),
//          publish_date (date, required), updated_at, created_by
// businesses: business_id, user_id, business_name, owner_name, business_type,
//             pan_number, address, status ('Pending'|'Approved'|'Rejected'|'Suspended'), created_at
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

const BUSINESS_STATUSES = ["Approved", "Rejected", "Pending", "Suspended"];

// GET /api/admin/stats — the Admin Dashboard Overview
async function getAdminStats(req, res) {
  try {
    const [[{ total_citizens }]] = await pool.query(
      "SELECT COUNT(*) AS total_citizens FROM users WHERE role = 'Citizen'"
    );
    const [[{ total_businesses }]] = await pool.query(
      "SELECT COUNT(*) AS total_businesses FROM users WHERE role = 'Business'"
    );
    const [[{ total_officers }]] = await pool.query(
      "SELECT COUNT(*) AS total_officers FROM users WHERE role = 'Officer'"
    );
    const [[{ pending_officer_verifications }]] = await pool.query(
      "SELECT COUNT(*) AS pending_officer_verifications FROM users WHERE role = 'Officer' AND officer_status = 'Pending'"
    );
    const [[{ pending_applications }]] = await pool.query(
      "SELECT COUNT(*) AS pending_applications FROM certificates WHERE status = 'Pending'"
    );
    const [[{ pending_complaints }]] = await pool.query(
      "SELECT COUNT(*) AS pending_complaints FROM complaints WHERE status = 'Pending'"
    );
    const [[{ total_orders }]] = await pool.query("SELECT COUNT(*) AS total_orders FROM orders");
    const [[{ total_revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM tax_payments WHERE payment_status = 'Paid'"
    );
    const [[{ pending_businesses }]] = await pool.query(
      "SELECT COUNT(*) AS pending_businesses FROM businesses WHERE status = 'Pending'"
    );

    const [recent_activities] = await pool.query(`
      (SELECT 'Application' AS type, certificate_id AS ref_id,
              CONCAT(certificate_type, ' certificate application — ', status) AS description,
              applied_date AS occurred_at
       FROM certificates ORDER BY applied_date DESC LIMIT 5)
      UNION ALL
      (SELECT 'Complaint' AS type, complaint_id AS ref_id,
              CONCAT('Complaint "', subject, '" — ', status) AS description,
              created_at AS occurred_at
       FROM complaints ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'Business' AS type, business_id AS ref_id,
              CONCAT('Business "', business_name, '" — ', status) AS description,
              created_at AS occurred_at
       FROM businesses ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'Officer' AS type, user_id AS ref_id,
              CONCAT('Officer ', full_name, ' — ', COALESCE(officer_status, 'n/a')) AS description,
              COALESCE(verified_at, created_at) AS occurred_at
       FROM users WHERE role = 'Officer' ORDER BY COALESCE(verified_at, created_at) DESC LIMIT 5)
      ORDER BY occurred_at DESC
      LIMIT 15
    `);

    res.json({
      success: true,
      stats: {
        total_citizens, total_businesses, total_officers,
        pending_officer_verifications, pending_applications, pending_complaints,
        total_orders, total_revenue, pending_businesses,
        recent_activities,
      },
    });
  } catch (err) {
    console.error("Get admin stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch admin stats" });
  }
}

// ---------------------------------------------------------------------------
// Announcements (notices)
// ---------------------------------------------------------------------------

// GET /api/notices — public notice board
async function getNotices(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM notices ORDER BY publish_date DESC");
    res.json({ success: true, notices: rows });
  } catch (err) {
    console.error("Get notices error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch notices" });
  }
}

// POST /api/admin/notices — create an announcement, optionally targeted at
// one role. Also fires a real-time notification to that audience.
async function createNotice(req, res) {
  try {
    const { title, description, publish_date, target_role } = req.body;
    const createdBy = req.user.user_id;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: "title and description are required" });
    }

    const role = target_role || "All";
    if (!["All", "Citizen", "Business", "Officer"].includes(role)) {
      return res.status(400).json({ success: false, error: "target_role must be All, Citizen, Business, or Officer" });
    }

    const date = publish_date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await pool.query(
      "INSERT INTO notices (title, description, target_role, publish_date, created_by) VALUES (?, ?, ?, ?, ?)",
      [title, description, role, date, createdBy]
    );

    await createNotification({
      role_target: role,
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

    const [existing] = await pool.query("SELECT * FROM notices WHERE notice_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Notice not found" });
    }

    if (target_role && !["All", "Citizen", "Business", "Officer"].includes(target_role)) {
      return res.status(400).json({ success: false, error: "target_role must be All, Citizen, Business, or Officer" });
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
    const [result] = await pool.query("DELETE FROM notices WHERE notice_id = ?", [id]);
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
// Citizen management
// ---------------------------------------------------------------------------

// GET /api/admin/citizens?search=&status=
async function getCitizens(req, res) {
  try {
    const { search, status } = req.query;

    let sql = `
      SELECT user_id, full_name, email, phone, address, citizenship_no, status, created_at
      FROM users WHERE role = 'Citizen'
    `;
    const params = [];

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

    const [userRows] = await pool.query(
      `SELECT user_id, full_name, email, phone, address, citizenship_no, status, created_at
       FROM users WHERE user_id = ? AND role = 'Citizen'`,
      [id]
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
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC", [id]
    );

    res.json({ success: true, citizen: userRows[0], certificates, complaints, orders });
  } catch (err) {
    console.error("Get citizen detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch citizen" });
  }
}

// ---------------------------------------------------------------------------
// Business management
// ---------------------------------------------------------------------------

// GET /api/admin/businesses — list all businesses (filter with ?status=Pending)
async function getBusinesses(req, res) {
  try {
    const { status } = req.query;
    let sql = `
      SELECT b.*, u.email, u.phone
      FROM businesses b
      JOIN users u ON b.user_id = u.user_id
    `;
    const params = [];
    if (status) {
      sql += " WHERE b.status = ?";
      params.push(status);
    }
    sql += " ORDER BY b.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, businesses: rows });
  } catch (err) {
    console.error("Get businesses error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch businesses" });
  }
}

// GET /api/admin/businesses/:id — detail + product listing
async function getBusinessDetail(req, res) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT b.*, u.email, u.phone FROM businesses b JOIN users u ON b.user_id = u.user_id WHERE b.business_id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }

    const [products] = await pool.query(
      "SELECT * FROM products WHERE business_id = ? ORDER BY created_at DESC", [id]
    );

    res.json({ success: true, business: rows[0], products });
  } catch (err) {
    console.error("Get business detail error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch business" });
  }
}

// PATCH /api/admin/businesses/:id — approve, reject, suspend, or reactivate
async function updateBusinessStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!BUSINESS_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `status must be one of: ${BUSINESS_STATUSES.join(", ")}`,
      });
    }

    const [rows] = await pool.query("SELECT user_id FROM businesses WHERE business_id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }

    await pool.query("UPDATE businesses SET status = ? WHERE business_id = ?", [status, id]);

    await createNotification({
      user_id: rows[0].user_id,
      title: "Business status updated",
      message: `Your business account status is now "${status}".`,
      related_type: "business",
      related_id: id,
    });

    res.json({ success: true, message: `Business ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Update business status error:", err);
    res.status(500).json({ success: false, error: "Failed to update business" });
  }
}

// PATCH /api/admin/users/:id/status — block/unblock a citizen or business account
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Blocked"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be Active or Blocked" });
    }

    const [result] = await pool.query("UPDATE users SET status = ? WHERE user_id = ?", [status, id]);

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
  getNotices, createNotice, updateNotice, deleteNotice,
  getCitizens, getCitizenDetail,
  getBusinesses, getBusinessDetail, updateBusinessStatus,
  updateUserStatus,
  getAdminProfile, updateAdminProfile,
};
