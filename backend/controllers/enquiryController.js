// controllers/enquiryController.js
// province_enquiries: enquiry_id, province_id, raised_by, subject, message,
//                     status ('Open'|'Resolved'), response, responded_by,
//                     responded_at, created_at
//
// A Province Admin raises an enquiry when something can't be resolved at
// the Province level; the (single) State Admin sees every enquiry across
// every Province and responds. There is no per-Province routing needed
// beyond that — see adminBootstrap in authController.js for why there is
// only ever one State Admin to route to.
const { pool } = require("../config/db");
const { createNotification } = require("./notificationController");

async function findStateAdminId() {
  const [rows] = await pool.query(
    "SELECT user_id FROM users WHERE role = 'Admin' AND admin_scope = 'State' LIMIT 1"
  );
  return rows.length > 0 ? rows[0].user_id : null;
}

// POST /api/admin/enquiries — a Province Admin raises a new enquiry
async function createEnquiry(req, res) {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ success: false, error: "subject and message are required" });
    }

    const [result] = await pool.query(
      "INSERT INTO province_enquiries (province_id, raised_by, subject, message) VALUES (?, ?, ?, ?)",
      [req.user.province_id, req.user.user_id, subject, message]
    );

    const stateAdminId = await findStateAdminId();
    if (stateAdminId) {
      await createNotification({
        user_id: stateAdminId,
        title: "New enquiry from a Province Admin",
        message: `${req.user.full_name} raised an enquiry: "${subject}"`,
        related_type: "province_enquiry",
        related_id: result.insertId,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted.",
      enquiry: { enquiry_id: result.insertId, subject, message, status: "Open" },
    });
  } catch (err) {
    console.error("Create enquiry error:", err);
    return res.status(500).json({ success: false, error: "Failed to submit enquiry" });
  }
}

// GET /api/admin/enquiries — a Province Admin's own enquiries
async function listMyEnquiries(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT enquiry_id, subject, message, status, response, responded_at, created_at
       FROM province_enquiries WHERE province_id = ? ORDER BY created_at DESC`,
      [req.user.province_id]
    );
    res.json({ success: true, enquiries: rows });
  } catch (err) {
    console.error("List my enquiries error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch enquiries" });
  }
}

// GET /api/admin/state/enquiries — the State Admin sees every Province's enquiries
async function listAllEnquiries(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT e.enquiry_id, e.subject, e.message, e.status, e.response, e.responded_at, e.created_at,
              p.province_id, p.name AS province_name,
              u.full_name AS raised_by_name, u.email AS raised_by_email
       FROM province_enquiries e
       JOIN provinces p ON e.province_id = p.province_id
       JOIN users u ON e.raised_by = u.user_id
       ORDER BY (e.status = 'Open') DESC, e.created_at DESC`
    );
    res.json({ success: true, enquiries: rows });
  } catch (err) {
    console.error("List all enquiries error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch enquiries" });
  }
}

// PATCH /api/admin/state/enquiries/:id/respond — body: { response }
async function respondToEnquiry(req, res) {
  try {
    const { id } = req.params;
    const { response } = req.body;

    if (!response) {
      return res.status(400).json({ success: false, error: "A response is required" });
    }

    const [existing] = await pool.query("SELECT * FROM province_enquiries WHERE enquiry_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Enquiry not found" });
    }

    await pool.query(
      `UPDATE province_enquiries
       SET response = ?, status = 'Resolved', responded_by = ?, responded_at = NOW()
       WHERE enquiry_id = ?`,
      [response, req.user.user_id, id]
    );

    await createNotification({
      user_id: existing[0].raised_by,
      title: "Your enquiry was answered",
      message: `The State Admin responded to "${existing[0].subject}": ${response}`,
      related_type: "province_enquiry",
      related_id: id,
    });

    res.json({ success: true, message: "Response sent." });
  } catch (err) {
    console.error("Respond to enquiry error:", err);
    res.status(500).json({ success: false, error: "Failed to send response" });
  }
}

module.exports = { createEnquiry, listMyEnquiries, listAllEnquiries, respondToEnquiry };
