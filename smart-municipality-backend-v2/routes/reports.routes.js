const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// OFFICER/ADMIN: certificate stats by status
router.get('/certificates', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT status, COUNT(*) AS count FROM certificates GROUP BY status`);
    const [byType] = await db.query(`SELECT certificate_type, COUNT(*) AS count FROM certificates GROUP BY certificate_type`);
    res.json({ success: true, data: { byStatus: rows, byType } });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: complaint stats by status
router.get('/complaints', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(`SELECT status, COUNT(*) AS count FROM complaints GROUP BY status`);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: tax collection summary
router.get('/tax', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [[{ totalCollected }]] = await db.query(
      "SELECT COALESCE(SUM(amount),0) AS totalCollected FROM tax_payments WHERE payment_status='Paid'"
    );
    const [byType] = await db.query(
      `SELECT tax_type, COUNT(*) AS count, COALESCE(SUM(amount),0) AS total
       FROM tax_payments WHERE payment_status='Paid' GROUP BY tax_type`
    );
    res.json({ success: true, data: { totalCollected, byType } });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: general activity summary
router.get('/summary', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [[{ pendingCertificates }]] = await db.query("SELECT COUNT(*) AS pendingCertificates FROM certificates WHERE status='Pending'");
    const [[{ pendingComplaints }]] = await db.query("SELECT COUNT(*) AS pendingComplaints FROM complaints WHERE status='Pending'");
    const [[{ noticesPosted }]] = await db.query("SELECT COUNT(*) AS noticesPosted FROM notices");
    const [[{ taxPayers }]] = await db.query("SELECT COUNT(DISTINCT user_id) AS taxPayers FROM tax_payments WHERE payment_status='Paid'");

    res.json({ success: true, data: { pendingCertificates, pendingComplaints, noticesPosted, taxPayers } });
  } catch (err) { next(err); }
});

module.exports = router;
