// controllers/authController.js
// users: user_id, full_name, email, phone, password, role, address,
//        department, designation, officer_status ('Pending'|'Approved'|'Rejected'|'Suspended'),
//        rejection_reason, verified_by, verified_at,
//        citizenship_no, profile_image, created_at, status ('Active'|'Blocked')
// officer_documents: document_id, user_id, file_path, uploaded_at
// businesses: business_id, user_id, business_name, owner_name, business_type,
//             pan_number, address, status ('Pending'|'Approved'|'Rejected'|'Suspended'), created_at
//
// Auth is split into three completely separate paths:
//   /api/auth/register + /api/auth/login             -> Citizen, Business only
//   /api/auth/staff/register + /api/auth/staff/login -> Officer only (register),
//                                                        Officer + Admin (login)
//   /api/auth/admin/bootstrap                         -> the ONLY way to create
//                                                        the system's single Admin
//
// Admin is never a selectable role anywhere a normal user can reach. It is
// provisioned once, out-of-band, through adminBootstrap below, which is
// gated by a secret key from the server's own .env and refuses outright if
// an Admin already exists — backed by a DB trigger (see
// migration_rbac_admin_officer.sql) so even an application bug can't create
// a second one.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const PUBLIC_ROLES = ["Citizen", "Business"];
const STAFF_LOGIN_ROLES = ["Officer", "Admin"];
const SALT_ROUNDS = 10;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );
}

function toPublicUser(user) {
  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    address: user.address,
    profile_image: user.profile_image,
    department: user.department,
    designation: user.designation,
    officer_status: user.officer_status,
  };
}

// ---------------------------------------------------------------------------
// PUBLIC PORTAL — Citizen, Business
// ---------------------------------------------------------------------------

async function register(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      full_name, email, phone, password, role, address, citizenship_no,
      business_name, owner_name, business_type, pan_number,
    } = req.body;

    if (!full_name || !email || !password || !role) {
      connection.release();
      return res.status(400).json({ success: false, error: "full_name, email, password, and role are required" });
    }

    if (!PUBLIC_ROLES.includes(role)) {
      connection.release();
      return res.status(403).json({
        success: false,
        error: "Officer accounts must be created through the staff registration page. Admin accounts are provisioned through system configuration and are never self-registered.",
      });
    }

    if (!emailRegex.test(email)) {
      connection.release();
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
      connection.release();
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    if (role === "Business" && (!business_name || !owner_name)) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "business_name and owner_name are required when registering as a Business",
      });
    }

    const [existing] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.beginTransaction();

    const [userResult] = await connection.query(
      `INSERT INTO users (full_name, email, phone, password, role, address, citizenship_no)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, hashedPassword, role, address || null, citizenship_no || null]
    );
    const userId = userResult.insertId;

    if (role === "Business") {
      await connection.query(
        `INSERT INTO businesses (user_id, business_name, owner_name, business_type, pan_number, address, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [userId, business_name, owner_name, business_type || null, pan_number || null, address || null]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message:
        role === "Business"
          ? "Business account registered. Awaiting admin approval before you can list products."
          : "User registered successfully",
      user: { user_id: userId, full_name, email, role },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Register error:", err);
    return res.status(500).json({ success: false, error: "Registration failed" });
  } finally {
    connection.release();
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const user = rows[0];

    if (STAFF_LOGIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "This is a staff account. Please use the Staff Login page.",
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({ success: false, error: "This account has been blocked. Contact an administrator." });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, user.password);
    } catch {
      return res.status(401).json({
        success: false,
        error: "This account's password is not in a valid format. Please re-register or ask an admin to reset it.",
      });
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token: signToken(user),
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}

// ---------------------------------------------------------------------------
// STAFF PORTAL — Officer register (Admin can never register here); both
// Officer and Admin log in here.
// ---------------------------------------------------------------------------

async function staffRegister(req, res) {
  const connection = await pool.getConnection();
  try {
    const { full_name, email, phone, password, address, department, designation } = req.body;

    // Note there is no `role` field read from the request body at all —
    // this endpoint can only ever create an Officer. That is what keeps a
    // normal user from registering as, or selecting, Admin.
    if (!full_name || !email || !password || !department || !designation) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "full_name, email, password, department, and designation are required",
      });
    }

    if (!emailRegex.test(email)) {
      connection.release();
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
      connection.release();
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const [existing] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO users (full_name, email, phone, password, role, address, department, designation, officer_status)
       VALUES (?, ?, ?, ?, 'Officer', ?, ?, ?, 'Pending')`,
      [full_name, email, phone || null, hashedPassword, address || null, department, designation]
    );
    const userId = result.insertId;

    const files = req.files || [];
    for (const file of files) {
      await connection.query(
        "INSERT INTO officer_documents (user_id, file_path) VALUES (?, ?)",
        [userId, `/uploads/officers/${file.filename}`]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Registration submitted. Your officer account is pending Admin verification — you'll be notified once it's reviewed.",
      user: { user_id: userId, full_name, email, role: "Officer", officer_status: "Pending" },
    });
  } catch (err) {
    await connection.rollback();
    console.error("Staff register error:", err);
    return res.status(500).json({ success: false, error: "Registration failed" });
  } finally {
    connection.release();
  }
}

async function staffLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const user = rows[0];

    if (!STAFF_LOGIN_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "This is not a staff account. Please use the main Login page.",
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({ success: false, error: "This account has been blocked. Contact an administrator." });
    }

    // Officers are gated on verification status. Admin has no officer_status
    // (it is NULL) and skips this block entirely.
    if (user.role === "Officer") {
      if (user.officer_status === "Pending") {
        return res.status(403).json({
          success: false,
          error: "Your officer account is still awaiting Admin verification.",
        });
      }
      if (user.officer_status === "Rejected") {
        return res.status(403).json({
          success: false,
          error: `Your officer registration was rejected.${user.rejection_reason ? ` Reason: ${user.rejection_reason}` : ""}`,
        });
      }
      if (user.officer_status === "Suspended") {
        return res.status(403).json({
          success: false,
          error: "Your officer account has been suspended. Contact the Admin.",
        });
      }
      if (user.officer_status !== "Approved") {
        return res.status(403).json({ success: false, error: "Your officer account is not active." });
      }
    }

    let passwordMatches = false;
    try {
      passwordMatches = await bcrypt.compare(password, user.password);
    } catch {
      return res.status(401).json({
        success: false,
        error: "This account's password is not in a valid format. Please ask an admin to reset it.",
      });
    }

    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      token: signToken(user),
      user: toPublicUser(user),
    });
  } catch (err) {
    console.error("Staff login error:", err);
    return res.status(500).json({ success: false, error: "Login failed" });
  }
}

// ---------------------------------------------------------------------------
// ADMIN BOOTSTRAP — not linked from any UI. The only way to create the
// system's single Admin account. See the module comment at the top.
// ---------------------------------------------------------------------------

async function adminBootstrap(req, res) {
  try {
    const { full_name, email, password, bootstrap_key } = req.body;

    if (!process.env.ADMIN_BOOTSTRAP_KEY) {
      return res.status(503).json({
        success: false,
        error: "Admin bootstrap is not configured. Set ADMIN_BOOTSTRAP_KEY in the server's .env first.",
      });
    }

    if (!bootstrap_key || bootstrap_key !== process.env.ADMIN_BOOTSTRAP_KEY) {
      return res.status(403).json({ success: false, error: "Invalid bootstrap key" });
    }

    if (!full_name || !email || !password) {
      return res.status(400).json({ success: false, error: "full_name, email, and password are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const [[{ adminCount }]] = await pool.query("SELECT COUNT(*) AS adminCount FROM users WHERE role = 'Admin'");
    if (adminCount > 0) {
      return res.status(409).json({ success: false, error: "An Admin account already exists. Only one Admin is allowed." });
    }

    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'Admin')",
      [full_name, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: "Admin account created.",
      user: { user_id: result.insertId, full_name, email, role: "Admin" },
    });
  } catch (err) {
    // A DB trigger (migration_rbac_admin_officer.sql) throws SQLSTATE 45000
    // if a race ever let two bootstrap calls both pass the COUNT(*) check
    // above — this is the last line of defense against a second Admin.
    if (err && err.sqlState === "45000") {
      return res.status(409).json({ success: false, error: "An Admin account already exists. Only one Admin is allowed." });
    }
    console.error("Admin bootstrap error:", err);
    return res.status(500).json({ success: false, error: "Failed to create admin account" });
  }
}

// ---------------------------------------------------------------------------
// Shared — any authenticated role
// ---------------------------------------------------------------------------

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: "current_password and new_password are required" });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: "New password must be at least 6 characters" });
    }

    const [rows] = await pool.query("SELECT password FROM users WHERE user_id = ?", [req.user.user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Account not found" });
    }

    const matches = await bcrypt.compare(current_password, rows[0].password);
    if (!matches) {
      return res.status(401).json({ success: false, error: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(new_password, SALT_ROUNDS);
    await pool.query("UPDATE users SET password = ? WHERE user_id = ?", [hashed, req.user.user_id]);

    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ success: false, error: "Failed to change password" });
  }
}

module.exports = { register, login, staffRegister, staffLogin, adminBootstrap, changePassword };
