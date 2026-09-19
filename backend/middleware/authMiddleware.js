// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, role, full_name }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

function requireRole(...allowedRoles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Not authenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to access this resource",
      });
    }
    next();
  };
}

// requireApprovedOfficer — a JWT is only re-checked against the DB here,
// not on every request in the app, because this is specifically the gate
// that has to react immediately if an Admin suspends an Officer mid-session:
// the officer_status isn't in the JWT, so a suspended officer's still-valid
// token would otherwise keep working until it expires. Stack this AFTER
// requireRole("Officer") on officer-only routes. Admin is never subject to
// this check — it applies only when the caller's own role is Officer.
async function requireApprovedOfficer(req, res, next) {
  if (req.user.role !== "Officer") return next();

  try {
    const [rows] = await pool.query(
      "SELECT officer_status, status FROM users WHERE user_id = ?",
      [req.user.user_id]
    );

    if (rows.length === 0 || rows[0].status === "Blocked") {
      return res.status(403).json({ success: false, error: "This account is no longer active." });
    }

    if (rows[0].officer_status !== "Approved") {
      return res.status(403).json({
        success: false,
        error: "Your officer account is not currently approved. Contact the Admin.",
      });
    }

    next();
  } catch (err) {
    console.error("requireApprovedOfficer error:", err);
    res.status(500).json({ success: false, error: "Failed to verify officer status" });
  }
}

module.exports = { verifyToken, requireRole, requireApprovedOfficer };
