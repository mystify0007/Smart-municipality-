const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// PUBLIC: browse/search products (marketplace)
router.get('/', async (req, res, next) => {
  try {
    const { category_id, search } = req.query;
    let query = `SELECT p.*, c.category_name, b.business_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.category_id
                 LEFT JOIN businesses b ON p.business_id = b.business_id
                 WHERE p.status = 'Available'`;
    const params = [];

    if (category_id) { query += ' AND p.category_id = ?'; params.push(category_id); }
    if (search) { query += ' AND p.product_name LIKE ?'; params.push(`%${search}%`); }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PUBLIC: single product detail
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// BUSINESS: view own products
router.get('/business/mine', authenticate, authorize('Business'), async (req, res, next) => {
  try {
    const [biz] = await db.query('SELECT business_id FROM businesses WHERE user_id = ?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ success: false, message: 'Business profile not found' });

    const [products] = await db.query('SELECT * FROM products WHERE business_id = ?', [biz[0].business_id]);
    res.json({ success: true, data: products });
  } catch (err) { next(err); }
});

// BUSINESS: add product
router.post('/', authenticate, authorize('Business'), upload.single('image'), async (req, res, next) => {
  try {
    const { product_name, description, price, stock, category_id } = req.body;
    const [biz] = await db.query('SELECT business_id FROM businesses WHERE user_id = ?', [req.user.id]);
    if (!biz.length) return res.status(404).json({ success: false, message: 'Business profile not found' });

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO products (business_id, category_id, product_name, description, price, stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [biz[0].business_id, category_id, product_name, description, price, stock, imagePath]
    );
    res.status(201).json({ success: true, productId: result.insertId });
  } catch (err) { next(err); }
});

// BUSINESS: update own product
router.put('/:id', authenticate, authorize('Business'), upload.single('image'), async (req, res, next) => {
  try {
    const { product_name, description, price, stock, category_id, status } = req.body;
    const [biz] = await db.query('SELECT business_id FROM businesses WHERE user_id = ?', [req.user.id]);
    const [product] = await db.query('SELECT * FROM products WHERE product_id = ? AND business_id = ?', [req.params.id, biz[0].business_id]);
    if (!product.length) return res.status(404).json({ success: false, message: 'Product not found or not yours' });

    const imagePath = req.file ? `/uploads/${req.file.filename}` : product[0].image;

    await db.query(
      'UPDATE products SET product_name=?, description=?, price=?, stock=?, category_id=?, status=?, image=? WHERE product_id=?',
      [product_name, description, price, stock, category_id, status || product[0].status, imagePath, req.params.id]
    );
    res.json({ success: true, message: 'Product updated' });
  } catch (err) { next(err); }
});

// BUSINESS: delete own product
router.delete('/:id', authenticate, authorize('Business'), async (req, res, next) => {
  try {
    const [biz] = await db.query('SELECT business_id FROM businesses WHERE user_id = ?', [req.user.id]);
    await db.query('DELETE FROM products WHERE product_id = ? AND business_id = ?', [req.params.id, biz[0].business_id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
