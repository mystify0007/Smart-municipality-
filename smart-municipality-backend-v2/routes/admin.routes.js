const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/analytics', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    const [[{ totalBusinesses }]] = await db.query('SELECT COUNT(*) AS totalBusinesses FROM businesses');
    const [[{ pendingBusinesses }]] = await db.query("SELECT COUNT(*) AS pendingBusinesses FROM businesses WHERE status='Pending'");
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(*) AS totalOrders FROM orders');
    const [[{ totalRevenue }]] = await db.query("SELECT COALESCE(SUM(total_amount),0) AS totalRevenue FROM orders WHERE payment_status='Paid'");
    const [[{ pendingCertificates }]] = await db.query("SELECT COUNT(*) AS pendingCertificates FROM certificates WHERE status='Pending'");
    const [[{ pendingComplaints }]] = await db.query("SELECT COUNT(*) AS pendingComplaints FROM complaints WHERE status='Pending'");
    const [[{ taxCollected }]] = await db.query("SELECT COALESCE(SUM(amount),0) AS taxCollected FROM tax_payments WHERE payment_status='Paid'");

    res.json({
      success: true,
      data: {
        totalUsers, totalBusinesses, pendingBusinesses, totalOrders,
        totalRevenue, pendingCertificates, pendingComplaints, taxCollected
      }
    });
  } catch (err) { next(err); }
});

module.exports = router;
