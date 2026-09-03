const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Admin/Officer: view all businesses
router.get('/', authenticate, authorize('Admin', 'Officer'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, u.full_name AS account_name, u.email
       FROM businesses b JOIN users u ON b.user_id = u.user_id`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Business owner: view own business profile
router.get('/me', authenticate, authorize('Business'), async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM businesses WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, data: rows[0] || null });
  } catch (err) { next(err); }
});

// Business owner: update own business details
router.put('/me', authenticate, authorize('Business'), async (req, res, next) => {
  try {
    const { business_name, owner_name, business_type, pan_number, address } = req.body;
    await db.query(
      'UPDATE businesses SET business_name = ?, owner_name = ?, business_type = ?, pan_number = ?, address = ? WHERE user_id = ?',
      [business_name, owner_name, business_type, pan_number, address, req.user.id]
    );
    res.json({ success: true, message: 'Business profile updated' });
  } catch (err) { next(err); }
});

// Admin: approve or reject a business
router.patch('/:id/status', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { status } = req.body; // 'Approved' | 'Rejected' | 'Pending'
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.query('UPDATE businesses SET status = ? WHERE business_id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Business ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;
