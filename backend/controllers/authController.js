// controllers/authController.js
// users: user_id, full_name, email, phone, password, role, address,
//        citizenship_no, profile_image, created_at, status ('Active'|'Blocked')
// businesses: business_id, user_id, business_name, owner_name, business_type,
//             pan_number, address, status ('Pending'|'Approved'|'Rejected'), created_at
//
// Auth is split into two completely separate portals:
//   /api/auth/register + /api/auth/login       -> Citizen, Business only
//   /api/auth/staff/register + /api/auth/staff/login -> Officer, Admin only
// Each endpoint rejects the other portal's roles outright, so a citizen
// account can never log in through the staff form and vice versa.

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const PUBLIC_ROLES = ["Citizen", "Business"];
const STAFF_ROLES = ["Officer", "Admin"];
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
        error: "Officer and Admin accounts must be created through the staff registration page.",
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

    if (STAFF_ROLES.includes(user.role)) {
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
// STAFF PORTAL — Officer, Admin
// ---------------------------------------------------------------------------

async function staffRegister(req, res) {
  try {
    const { full_name, email, phone, password, role, address, employee_id } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: "full_name, email, password, and role are required" });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        error: "Only Officer and Admin accounts can be created here. Citizens and businesses should use the main registration page.",
      });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters" });
    }

    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // employee_id is stored in the citizenship_no column — it's just a
    // generic ID-number field in the schema, reused here for staff badge
    // numbers instead of adding a new column.
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, phone, password, role, address, citizenship_no)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, hashedPassword, role, address || null, employee_id || null]
    );

    return res.status(201).json({
      success: true,
      message: "Staff account registered successfully",
      user: { user_id: result.insertId, full_name, email, role },
    });
  } catch (err) {
    console.error("Staff register error:", err);
    return res.status(500).json({ success: false, error: "Registration failed" });
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

    if (!STAFF_ROLES.includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: "This is not a staff account. Please use the main Login page.",
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

module.exports = { register, login, staffRegister, staffLogin };
