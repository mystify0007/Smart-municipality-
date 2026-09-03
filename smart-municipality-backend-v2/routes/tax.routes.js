const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// CITIZEN: view own tax records
router.get('/my-taxes', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM tax_payments WHERE user_id = ? ORDER BY payment_date DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// CITIZEN: make a (demo) tax payment
// tax_type: 'House Tax' | 'Land Tax' | 'Business Tax' | 'Water Bill'
// payment_method: 'Cash' | 'eSewa' | 'Khalti' | 'Bank'
router.post('/pay', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const { tax_type, amount, payment_method } = req.body;
    if (!tax_type || !amount || !payment_method) {
      return res.status(400).json({ success: false, message: 'tax_type, amount and payment_method are required' });
    }
    const [result] = await db.query(
      'INSERT INTO tax_payments (user_id, tax_type, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, tax_type, amount, payment_method, 'Paid'] // demo payment - marked paid immediately
    );
    res.status(201).json({ success: true, message: 'Tax payment recorded (demo)', paymentId: result.insertId });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: view all tax records
router.get('/', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u.full_name, u.email FROM tax_payments t JOIN users u ON t.user_id = u.user_id ORDER BY t.payment_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

module.exports = router;
