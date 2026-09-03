const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET all users (admin only)
router.get('/', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const [users] = await db.query(
      'SELECT user_id, full_name, email, role, phone, address, citizenship_no, status, created_at FROM users'
    );
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
});

// GET current logged-in user's profile
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, role, phone, address, citizenship_no, profile_image, created_at FROM users WHERE user_id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// UPDATE own profile
router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { full_name, phone, address, citizenship_no } = req.body;
    await db.query(
      'UPDATE users SET full_name = ?, phone = ?, address = ?, citizenship_no = ? WHERE user_id = ?',
      [full_name, phone, address, citizenship_no, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) { next(err); }
});

// Admin creates Officer or Admin accounts directly
router.post('/create-staff', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone } = req.body;
    if (!['Officer', 'Admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be 'Officer' or 'Admin'" });
    }
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(409).json({ success: false, message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, role, phone) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashed, role, phone || null]
    );
    res.status(201).json({ success: true, message: `${role} account created`, userId: result.insertId });
  } catch (err) { next(err); }
});

// Admin blocks/unblocks a user
router.patch('/:id/status', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { status } = req.body; // 'Active' | 'Blocked'
    if (!['Active', 'Blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be 'Active' or 'Blocked'" });
    }
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, req.params.id]);
    res.json({ success: true, message: `User status set to ${status}` });
  } catch (err) { next(err); }
});

// Admin deletes a user
router.delete('/:id', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
