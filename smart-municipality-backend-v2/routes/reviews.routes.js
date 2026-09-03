const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// PUBLIC: view reviews for a product
router.get('/product/:productId', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name
       FROM reviews r JOIN users u ON r.user_id = u.user_id
       WHERE r.product_id = ? ORDER BY r.created_at DESC`,
      [req.params.productId]
    );
    const avgRating = rows.length
      ? (rows.reduce((sum, r) => sum + r.rating, 0) / rows.length).toFixed(1)
      : null;
    res.json({ success: true, data: { reviews: rows, averageRating: avgRating, count: rows.length } });
  } catch (err) { next(err); }
});

// CITIZEN: submit a review (must have purchased the product in that order)
router.post('/', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const { product_id, order_id, rating, comment } = req.body;

    if (!product_id || !order_id || !rating) {
      return res.status(400).json({ success: false, message: 'product_id, order_id and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [orderItem] = await db.query(
      `SELECT oi.order_item_id FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       WHERE o.order_id = ? AND o.user_id = ? AND oi.product_id = ?`,
      [order_id, req.user.id, product_id]
    );
    if (!orderItem.length) {
      return res.status(403).json({ success: false, message: 'You can only review products you have ordered' });
    }

    const [existing] = await db.query(
      'SELECT review_id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?',
      [req.user.id, product_id, order_id]
    );
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'You already reviewed this product for this order' });
    }

    const [result] = await db.query(
      'INSERT INTO reviews (user_id, product_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, product_id, order_id, rating, comment || null]
    );
    res.status(201).json({ success: true, message: 'Review submitted', reviewId: result.insertId });
  } catch (err) { next(err); }
});

// CITIZEN: view own reviews
router.get('/my-reviews', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, p.product_name FROM reviews r
       JOIN products p ON r.product_id = p.product_id WHERE r.user_id = ? ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// CITIZEN: delete own review
router.delete('/:id', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM reviews WHERE review_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
