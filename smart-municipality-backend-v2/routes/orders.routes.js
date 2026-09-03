const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// CITIZEN: place order from cart
router.post('/', authenticate, authorize('Citizen'), async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [cart] = await connection.query('SELECT cart_id FROM cart WHERE user_id = ?', [req.user.id]);
    if (!cart.length) throw new Error('Cart not found');

    const [items] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.product_id WHERE ci.cart_id = ?`,
      [cart[0].cart_id]
    );
    if (!items.length) throw new Error('Cart is empty');

    for (const item of items) {
      if (item.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.product_id}`);
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const [orderResult] = await connection.query(
      'INSERT INTO orders (user_id, total_amount, order_status, payment_status) VALUES (?, ?, ?, ?)',
      [req.user.id, total, 'Pending', 'Pending']
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await connection.query('UPDATE products SET stock = stock - ? WHERE product_id = ?', [item.quantity, item.product_id]);
    }

    await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].cart_id]);
    await connection.commit();

    res.status(201).json({ success: true, message: 'Order placed', orderId });
  } catch (err) {
    await connection.rollback();
    res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

// CITIZEN: view own order history
router.get('/my-orders', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC', [req.user.id]);
    res.json({ success: true, data: orders });
  } catch (err) { next(err); }
});

// CITIZEN/ADMIN: view single order with items
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [order] = await db.query('SELECT * FROM orders WHERE order_id = ?', [req.params.id]);
    if (!order.length) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'Citizen' && order[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your order' });
    }

    const [items] = await db.query(
      `SELECT oi.*, p.product_name FROM order_items oi JOIN products p ON oi.product_id = p.product_id WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ success: true, data: { ...order[0], items } });
  } catch (err) { next(err); }
});

// BUSINESS: view orders containing their products (joined via products, since order_items has no business_id column)
router.get('/business/mine', authenticate, authorize('Business'), async (req, res, next) => {
  try {
    const [biz] = await db.query('SELECT business_id FROM businesses WHERE user_id = ?', [req.user.id]);
    const [rows] = await db.query(
      `SELECT oi.order_item_id, oi.order_id, oi.quantity, oi.price, p.product_name, o.order_status, o.order_date
       FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       JOIN orders o ON oi.order_id = o.order_id
       WHERE p.business_id = ? ORDER BY o.order_date DESC`,
      [biz[0].business_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// BUSINESS/ADMIN: update order status
router.patch('/:id/status', authenticate, authorize('Business', 'Admin'), async (req, res, next) => {
  try {
    const { status } = req.body; // 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
    await db.query('UPDATE orders SET order_status = ? WHERE order_id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;
