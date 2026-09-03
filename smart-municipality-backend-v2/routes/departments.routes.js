const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// PUBLIC: list departments
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM departments ORDER BY name');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ADMIN: create department
router.post('/', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });

    const [result] = await db.query(
      'INSERT INTO departments (name, description) VALUES (?, ?)',
      [name, description || null]
    );
    res.status(201).json({ success: true, departmentId: result.insertId });
  } catch (err) { next(err); }
});

// ADMIN: update department
router.put('/:id', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    await db.query('UPDATE departments SET name = ?, description = ? WHERE department_id = ?', [name, description, req.params.id]);
    res.json({ success: true, message: 'Department updated' });
  } catch (err) { next(err); }
});

// ADMIN: delete department
router.delete('/:id', authenticate, authorize('Admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM departments WHERE department_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
