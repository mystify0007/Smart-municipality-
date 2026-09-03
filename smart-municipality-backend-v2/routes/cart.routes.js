const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

async function getOrCreateCart(userId) {
  const [cart] = await db.query('SELECT cart_id FROM cart WHERE user_id = ?', [userId]);
  if (cart.length) return cart[0].cart_id;
  const [result] = await db.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
  return result.insertId;
}

// GET current cart with items
router.get('/', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const [items] = await db.query(
      `SELECT ci.cart_item_id, ci.quantity, p.product_id, p.product_name, p.price, p.image, p.stock
       FROM cart_items ci JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    res.json({ success: true, data: { items, total } });
  } catch (err) { next(err); }
});

// ADD item to cart
router.post('/items', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const { product_id, quantity } = req.body;
    const cartId = await getOrCreateCart(req.user.id);

    const [existing] = await db.query('SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, product_id]);
    if (existing.length) {
      await db.query('UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?', [quantity || 1, existing[0].cart_item_id]);
    } else {
      await db.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)', [cartId, product_id, quantity || 1]);
    }
    res.status(201).json({ success: true, message: 'Item added to cart' });
  } catch (err) { next(err); }
});

// UPDATE item quantity
router.put('/items/:itemId', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const { quantity } = req.body;
    await db.query('UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?', [quantity, req.params.itemId]);
    res.json({ success: true, message: 'Cart item updated' });
  } catch (err) { next(err); }
});

// REMOVE item
router.delete('/items/:itemId', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM cart_items WHERE cart_item_id = ?', [req.params.itemId]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (err) { next(err); }
});

module.exports = router;
