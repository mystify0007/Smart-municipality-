// controllers/adminController.js
// notices: notice_id, title, description, publish_date (date, required), created_by
// businesses: business_id, user_id, business_name, owner_name, business_type,
//             pan_number, address, status ('Pending'|'Approved'|'Rejected'), created_at
const { pool } = require("../config/db");

// GET /api/admin/stats
async function getAdminStats(req, res) {
  try {
    const [[{ total_users }]] = await pool.query("SELECT COUNT(*) AS total_users FROM users");

    const [[{ total_revenue }]] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM tax_payments WHERE payment_status = 'Paid'"
    );

    const [[{ pending_applications }]] = await pool.query(
      "SELECT COUNT(*) AS pending_applications FROM certificates WHERE status = 'Pending'"
    );

    const [[{ pending_businesses }]] = await pool.query(
      "SELECT COUNT(*) AS pending_businesses FROM businesses WHERE status = 'Pending'"
    );

    const [usersByRole] = await pool.query("SELECT role, COUNT(*) AS count FROM users GROUP BY role");

    res.json({
      success: true,
      stats: { total_users, total_revenue, pending_applications, pending_businesses, users_by_role: usersByRole },
    });
  } catch (err) {
    console.error("Get admin stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch admin stats" });
  }
}

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

// POST /api/admin/notices — create a new notice.
// publish_date has no DB default, so default to "today" here if not supplied.
async function createNotice(req, res) {
  try {
    const { title, description, publish_date } = req.body;
    const createdBy = req.user.user_id;

    if (!title || !description) {
      return res.status(400).json({ success: false, error: "title and description are required" });
    }

    const date = publish_date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await pool.query(
      "INSERT INTO notices (title, description, publish_date, created_by) VALUES (?, ?, ?, ?)",
      [title, description, date, createdBy]
    );

    res.status(201).json({ success: true, notice_id: result.insertId });
  } catch (err) {
    console.error("Create notice error:", err);
    res.status(500).json({ success: false, error: "Failed to create notice" });
  }
}

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

// PATCH /api/admin/businesses/:id — approve or reject a business profile
async function updateBusinessStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ success: false, error: "status must be Approved, Rejected, or Pending" });
    }

    const [result] = await pool.query("UPDATE businesses SET status = ? WHERE business_id = ?", [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Business not found" });
    }

    res.json({ success: true, message: `Business ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Update business status error:", err);
    res.status(500).json({ success: false, error: "Failed to update business" });
  }
}

// PATCH /api/admin/users/:id/status — block/unblock a user account
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

module.exports = {
  getAdminStats, getNotices, createNotice,
  getBusinesses, updateBusinessStatus, updateUserStatus,
};
