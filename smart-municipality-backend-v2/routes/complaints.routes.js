const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// CITIZEN: submit complaint (optional image)
router.post('/', authenticate, authorize('Citizen'), upload.single('image'), async (req, res, next) => {
  try {
    const { subject, description, location } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO complaints (user_id, subject, description, location, status, image) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, subject, description, location || null, 'Pending', imagePath]
    );
    res.status(201).json({ success: true, message: 'Complaint submitted', complaintId: result.insertId });
  } catch (err) { next(err); }
});

// CITIZEN: view own complaints
router.get('/my-complaints', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM complaints WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: view all complaints
router.get('/', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.full_name, u.email FROM complaints c JOIN users u ON c.user_id = u.user_id ORDER BY c.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER: update complaint status
router.patch('/:id/status', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const { status } = req.body; // 'In Progress' | 'Resolved'
    if (!['Pending', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    await db.query('UPDATE complaints SET status = ? WHERE complaint_id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Complaint marked as ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;
