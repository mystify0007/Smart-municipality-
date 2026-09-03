const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
require('dotenv').config();

function generateToken(user) {
  return jwt.sign(
    { id: user.user_id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

// REGISTER - Citizen or Business only (Officer/Admin created by Admin, see users.routes.js)
// Role values MUST match the DB enum exactly: 'Citizen' or 'Business'
router.post('/register', async (req, res, next) => {
  try {
    const { full_name, email, password, phone, address, citizenship_no, role } = req.body;
    const allowedPublicRoles = ['Citizen', 'Business'];

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields (full_name, email, password, role)' });
    }
    if (!allowedPublicRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'Citizen' or 'Business'" });
    }

    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, phone, address, citizenship_no) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, role, phone || null, address || null, citizenship_no || null]
    );

    if (role === 'Business') {
      const { business_name, owner_name, business_type, pan_number } = req.body;
      if (!business_name || !owner_name) {
        return res.status(400).json({ success: false, message: 'business_name and owner_name are required for Business role' });
      }
      await db.query(
        'INSERT INTO businesses (user_id, business_name, owner_name, business_type, pan_number, address, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [result.insertId, business_name, owner_name, business_type || null, pan_number || null, address || null, 'Pending']
      );
    }

    res.status(201).json({ success: true, message: 'Registered successfully', userId: result.insertId });
  } catch (err) {
    next(err);
  }
});

// LOGIN - all roles
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Blocked') {
      return res.status(403).json({ success: false, message: 'Account is blocked. Contact admin.' });
    }

    if (user.role === 'Business') {
      const [biz] = await db.query('SELECT status FROM businesses WHERE user_id = ?', [user.user_id]);
      if (biz.length && biz[0].status === 'Pending') {
        return res.status(403).json({ success: false, message: 'Business registration pending approval' });
      }
      if (biz.length && biz[0].status === 'Rejected') {
        return res.status(403).json({ success: false, message: 'Business registration was rejected' });
      }
    }

    const token = generateToken(user);
    delete user.password;

    res.json({ success: true, message: 'Login successful', token, user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
