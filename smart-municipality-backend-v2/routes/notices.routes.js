const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// PUBLIC: view notices/announcements
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM notices ORDER BY publish_date DESC');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: publish a notice
router.post('/', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const { title, description, publish_date } = req.body;
    const [result] = await db.query(
      'INSERT INTO notices (title, description, publish_date, created_by) VALUES (?, ?, ?, ?)',
      [title, description, publish_date || new Date().toISOString().slice(0, 10), req.user.id]
    );
    res.status(201).json({ success: true, noticeId: result.insertId });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: update a notice
router.put('/:id', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const { title, description, publish_date } = req.body;
    await db.query('UPDATE notices SET title = ?, description = ?, publish_date = ? WHERE notice_id = ?',
      [title, description, publish_date, req.params.id]);
    res.json({ success: true, message: 'Notice updated' });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: delete a notice
router.delete('/:id', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    await db.query('DELETE FROM notices WHERE notice_id = ?', [req.params.id]);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
