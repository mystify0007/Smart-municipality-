// controllers/authController.js
// users: user_id, full_name, email, phone, password, role ('Citizen'|'Officer'|'Admin'),
//        municipality_id, address, department, designation,
//        officer_status ('Pending'|'Approved'|'Rejected'|'Suspended'),
//        rejection_reason, verified_by, verified_at,
//        citizenship_no, profile_image, created_at, status ('Active'|'Blocked')
// officer_documents: document_id, user_id, file_path, uploaded_at
// municipalities: municipality_id, local_body_id, office_address, contact_email,
//                 contact_phone, created_at
//
// Auth is split into three completely separate paths:
//   /api/auth/register + /api/auth/login             -> Citizen only
//   /api/auth/staff/register + /api/auth/staff/login -> Officer only (register),
//                                                        Officer + Admin (login)
//   /api/auth/admin/bootstrap                         -> the ONLY way to
//                                                        provision a Municipality's Admin
//
// Admin is never a selectable role anywhere a normal user can reach. It is
// provisioned once per Municipality, out-of-band, through adminBootstrap
// below, which is gated by a secret key from the server's own .env and
// refuses outright if that Municipality already has an Admin — backed by a
// DB trigger (see migration_municipality_admin_trigger.sql) so even an
// application bug can't create a second one for the same Municipality.
//
// Every account (Citizen, Officer, Admin) belongs to exactly one
// Municipality. A Citizen or Officer can only register under a Municipality
// that already exists on the platform (i.e. already has an Admin to serve
// them) — see GET /api/locations/municipalities.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const PUBLIC_ROLES = ["Citizen"];
const STAFF_LOGIN_ROLES = ["Officer", "Admin"];
const SALT_ROUNDS = 10;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      admin_scope: user.admin_scope,
      province_id: user.province_id,
      municipality_id: user.municipality_id,
    },
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
    admin_scope: user.admin_scope,
    province_id: user.province_id,
    province_name: user.province_name,
    municipality_id: user.municipality_id,
    municipality_name: user.municipality_name,
    address: user.address,
    profile_image: user.profile_image,
    department: user.department,
    designation: user.designation,
    officer_status: user.officer_status,
  };
}

async function municipalityExists(municipalityId) {
  const [rows] = await pool.query(
    "SELECT municipality_id FROM municipalities WHERE municipality_id = ?",
    [municipalityId]
  );
  return rows.length > 0;
}

async function provinceExists(provinceId) {
  const [rows] = await pool.query(
    "SELECT province_id FROM provinces WHERE province_id = ?",
    [provinceId]
  );
  return rows.length > 0;
}

// Every login response includes the account's Municipality name (the Local
// Body's official name) and/or Province name, so the frontend can show
// "Pokhara Metropolitan City" or "Gandaki Pradesh" rather than just an id.
async function findUserWithMunicipality(email) {
  const [rows] = await pool.query(
    `SELECT u.*, lb.name AS municipality_name, p.name AS province_name
     FROM users u
     LEFT JOIN municipalities m ON u.municipality_id = m.municipality_id
     LEFT JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
     LEFT JOIN provinces p ON u.province_id = p.province_id
     WHERE u.email = ?`,
    [email]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// PUBLIC PORTAL — Citizen
// ---------------------------------------------------------------------------

async function register(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      full_name, email, phone, password, role, address, citizenship_no, municipality_id,
    } = req.body;

    if (!full_name || !email || !password || !role || !municipality_id) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "full_name, email, password, role, and municipality_id are required",
      });
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

    if (!(await municipalityExists(municipality_id))) {
      connection.release();
      return res.status(400).json({ success: false, error: "Selected municipality does not exist" });
    }

    const [existing] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [userResult] = await connection.query(
      `INSERT INTO users (full_name, email, phone, password, role, municipality_id, address, citizenship_no)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, hashedPassword, role, municipality_id, address || null, citizenship_no || null]
    );
    const userId = userResult.insertId;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { user_id: userId, full_name, email, role, municipality_id },
    });
  } catch (err) {
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

    const user = await findUserWithMunicipality(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

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
    const {
      full_name, email, phone, password, address, department, designation, municipality_id,
    } = req.body;

    // Note there is no `role` field read from the request body at all —
    // this endpoint can only ever create an Officer. That is what keeps a
    // normal user from registering as, or selecting, Admin.
    if (!full_name || !email || !password || !department || !designation || !municipality_id) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "full_name, email, password, department, designation, and municipality_id are required",
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

    if (!(await municipalityExists(municipality_id))) {
      connection.release();
      return res.status(400).json({ success: false, error: "Selected municipality does not exist" });
    }

    const [existing] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO users (full_name, email, phone, password, role, municipality_id, address, department, designation, officer_status)
       VALUES (?, ?, ?, ?, 'Officer', ?, ?, ?, ?, 'Pending')`,
      [full_name, email, phone || null, hashedPassword, municipality_id, address || null, department, designation]
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
      user: { user_id: userId, full_name, email, role: "Officer", municipality_id, officer_status: "Pending" },
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

    const user = await findUserWithMunicipality(email);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

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
// ADMIN BOOTSTRAP — not linked from any UI. The only way to create a
// Province Admin (there are at most 7, one per Province). A Province Admin
// then creates Municipality Admins within their own Province themselves —
// see createMunicipalityAdmin below — so the shared bootstrap key never has
// to be handed out for every single Municipality.
// ---------------------------------------------------------------------------

async function adminBootstrap(req, res) {
  try {
    const { full_name, email, password, bootstrap_key, province_id } = req.body;

    if (!process.env.ADMIN_BOOTSTRAP_KEY) {
      return res.status(503).json({
        success: false,
        error: "Admin bootstrap is not configured. Set ADMIN_BOOTSTRAP_KEY in the server's .env first.",
      });
    }

    if (!bootstrap_key || bootstrap_key !== process.env.ADMIN_BOOTSTRAP_KEY) {
      return res.status(403).json({ success: false, error: "Invalid bootstrap key" });
    }

    if (!full_name || !email || !password || !province_id) {
      return res.status(400).json({
        success: false,
        error: "full_name, email, password, and province_id are required",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    if (!(await provinceExists(province_id))) {
      return res.status(400).json({ success: false, error: "Unknown province_id" });
    }

    const [existingUser] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const [[{ adminCount }]] = await pool.query(
      "SELECT COUNT(*) AS adminCount FROM users WHERE role = 'Admin' AND admin_scope = 'Province' AND province_id = ?",
      [province_id]
    );
    if (adminCount > 0) {
      return res.status(409).json({ success: false, error: "This province already has an Admin account." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      "INSERT INTO users (full_name, email, password, role, admin_scope, province_id) VALUES (?, ?, ?, 'Admin', 'Province', ?)",
      [full_name, email, hashedPassword, province_id]
    );

    return res.status(201).json({
      success: true,
      message: "Province Admin account created.",
      user: {
        user_id: result.insertId, full_name, email, role: "Admin",
        admin_scope: "Province", province_id,
      },
    });
  } catch (err) {
    // A DB trigger (migration_municipality_admin_trigger.sql) throws SQLSTATE
    // 45000 if a race ever let two bootstrap calls both pass the COUNT(*)
    // check above — this is the last line of defense against a second Admin
    // for the same Province.
    if (err && err.sqlState === "45000") {
      return res.status(409).json({ success: false, error: "This province already has an Admin account." });
    }
    console.error("Admin bootstrap error:", err);
    return res.status(500).json({ success: false, error: "Failed to create admin account" });
  }
}

// ---------------------------------------------------------------------------
// MUNICIPALITY ADMIN CREATION — a Province Admin's own privilege, not
// self-service and not gated by the shared bootstrap key. Onboards a Local
// Body within the caller's own Province (creating the Municipality row if
// it doesn't exist yet) and creates its one Admin account.
// ---------------------------------------------------------------------------

async function createMunicipalityAdmin(req, res) {
  const connection = await pool.getConnection();
  try {
    const {
      full_name, email, password,
      local_body_id, office_address, contact_email, contact_phone,
    } = req.body;

    if (!full_name || !email || !password || !local_body_id) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "full_name, email, password, and local_body_id are required",
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

    // The Local Body must exist AND belong to the calling Province Admin's
    // own Province — a Province Admin can only onboard Municipalities
    // within their own Province.
    const [localBodyRows] = await connection.query(
      `SELECT lb.local_body_id FROM local_bodies lb
       JOIN districts d ON lb.district_id = d.district_id
       WHERE lb.local_body_id = ? AND d.province_id = ?`,
      [local_body_id, req.user.province_id]
    );
    if (localBodyRows.length === 0) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: "local_body_id must be a valid Local Body within your own province",
      });
    }

    const [existingUser] = await connection.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      connection.release();
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    await connection.beginTransaction();

    // Reuse the Municipality row if this Local Body was already onboarded
    // (e.g. a previous Admin account was removed); otherwise create it.
    const [municipalityRows] = await connection.query(
      "SELECT * FROM municipalities WHERE local_body_id = ?",
      [local_body_id]
    );

    let municipalityId;
    if (municipalityRows.length > 0) {
      municipalityId = municipalityRows[0].municipality_id;
    } else {
      const [municipalityResult] = await connection.query(
        "INSERT INTO municipalities (local_body_id, office_address, contact_email, contact_phone) VALUES (?, ?, ?, ?)",
        [local_body_id, office_address || null, contact_email || null, contact_phone || null]
      );
      municipalityId = municipalityResult.insertId;
    }

    const [[{ adminCount }]] = await connection.query(
      "SELECT COUNT(*) AS adminCount FROM users WHERE role = 'Admin' AND admin_scope = 'Municipality' AND municipality_id = ?",
      [municipalityId]
    );
    if (adminCount > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ success: false, error: "This municipality already has an Admin account." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await connection.query(
      "INSERT INTO users (full_name, email, password, role, admin_scope, municipality_id) VALUES (?, ?, ?, 'Admin', 'Municipality', ?)",
      [full_name, email, hashedPassword, municipalityId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Municipality Admin account created.",
      user: {
        user_id: result.insertId, full_name, email, role: "Admin",
        admin_scope: "Municipality", municipality_id: municipalityId,
      },
    });
  } catch (err) {
    await connection.rollback();
    if (err && err.sqlState === "45000") {
      return res.status(409).json({ success: false, error: "This municipality already has an Admin account." });
    }
    console.error("Create municipality admin error:", err);
    return res.status(500).json({ success: false, error: "Failed to create municipality admin account" });
  } finally {
    connection.release();
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

module.exports = {
  register, login, staffRegister, staffLogin,
  adminBootstrap, createMunicipalityAdmin, changePassword,
};
