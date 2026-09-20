// controllers/citizenController.js
const { pool } = require("../config/db");
const { signToken, toPublicUser } = require("./authController");

async function findUserWithMunicipality(userId) {
  const [rows] = await pool.query(
    `SELECT u.*, lb.name AS municipality_name
     FROM users u
     LEFT JOIN municipalities m ON u.municipality_id = m.municipality_id
     LEFT JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
     WHERE u.user_id = ?`,
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

async function municipalityExists(municipalityId) {
  const [rows] = await pool.query(
    "SELECT municipality_id FROM municipalities WHERE municipality_id = ?",
    [municipalityId]
  );
  return rows.length > 0;
}

// GET /api/citizen/profile — registration only collects email/phone/password,
// so this is where a Citizen fills in the rest: full_name, address,
// citizenship_no (linking their nagarikta, if they have one), and which
// Municipality they belong to.
async function getMyProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.phone, u.address, u.citizenship_no,
              u.municipality_id, lb.name AS municipality_name
       FROM users u
       LEFT JOIN municipalities m ON u.municipality_id = m.municipality_id
       LEFT JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
       WHERE u.user_id = ?`,
      [req.user.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }
    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    console.error("Get citizen profile error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch profile" });
  }
}

// PATCH /api/citizen/profile
async function updateMyProfile(req, res) {
  try {
    const { full_name, phone, address, citizenship_no, municipality_id } = req.body;

    if (municipality_id && !(await municipalityExists(municipality_id))) {
      return res.status(400).json({ success: false, error: "Selected municipality does not exist" });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE user_id = ?", [req.user.user_id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }
    const current = existing[0];

    await pool.query(
      `UPDATE users SET full_name = ?, phone = ?, address = ?, citizenship_no = ?, municipality_id = ?
       WHERE user_id = ?`,
      [
        full_name ?? current.full_name,
        phone ?? current.phone,
        address ?? current.address,
        citizenship_no ?? current.citizenship_no,
        municipality_id ?? current.municipality_id,
        req.user.user_id,
      ]
    );

    // req.user.municipality_id came from the JWT issued at login, which is
    // now stale the moment municipality_id changes — re-sign a fresh token
    // so the app doesn't need a full logout/login for the update to take
    // effect (e.g. filing a complaint right after completing the profile).
    const updated = await findUserWithMunicipality(req.user.user_id);
    res.json({
      success: true,
      message: "Profile updated",
      token: signToken(updated),
      user: toPublicUser(updated),
    });
  } catch (err) {
    console.error("Update citizen profile error:", err);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
}

// GET /api/citizen/requests — all of MY certificate requests
async function getMyRequests(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      "SELECT * FROM certificates WHERE user_id = ? ORDER BY applied_date DESC",
      [userId]
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    console.error("Get citizen requests error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch requests" });
  }
}

// GET /api/citizen/stats — counts grouped by status, for dashboard cards
async function getMyStats(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      `SELECT status, COUNT(*) AS count
       FROM certificates
       WHERE user_id = ?
       GROUP BY status`,
      [userId]
    );
    res.json({ success: true, stats: rows });
  } catch (err) {
    console.error("Get citizen stats error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch stats" });
  }
}

// GET /api/citizen/tax-payments — MY tax payment history
async function getMyPayments(req, res) {
  try {
    const userId = req.user.user_id;
    const [rows] = await pool.query(
      "SELECT * FROM tax_payments WHERE user_id = ? ORDER BY payment_date DESC",
      [userId]
    );
    res.json({ success: true, payments: rows });
  } catch (err) {
    console.error("Get citizen payments error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch payments" });
  }
}

module.exports = { getMyProfile, updateMyProfile, getMyRequests, getMyStats, getMyPayments };
