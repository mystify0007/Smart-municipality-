const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// Public: view categories
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM categories');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// Admin: create category
router.post('/', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { category_name, description } = req.body;
    const [result] = await db.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name, description || null]
    );
    res.status(201).json({ success: true, categoryId: result.insertId });
  } catch (err) { next(err); }
});

// Admin: update category
router.put('/:id', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { category_name, description } = req.body;
    await db.query('UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?',
      [category_name, description, req.params.id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) { next(err); }
});

// Admin: delete category
router.delete('/:id', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM categories WHERE category_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
