const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// CITIZEN: apply for a certificate
// certificate_type must be one of: Birth, Marriage, Death, Residence, Business, Character
router.post('/', authenticate, authorize('Citizen'), upload.single('document'), async (req, res, next) => {
  try {
    const { certificate_type, purpose } = req.body;
    const documentPath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      'INSERT INTO certificates (user_id, certificate_type, purpose, status, document_path) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, certificate_type, purpose || null, 'Pending', documentPath]
    );
    res.status(201).json({ success: true, message: 'Certificate request submitted', certificateId: result.insertId });
  } catch (err) { next(err); }
});

// CITIZEN: view own certificate requests
router.get('/my-requests', authenticate, authorize('Citizen'), async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM certificates WHERE user_id = ? ORDER BY applied_date DESC', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER/ADMIN: view all certificate requests
router.get('/', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT c.*, u.full_name, u.email FROM certificates c JOIN users u ON c.user_id = u.user_id ORDER BY c.applied_date DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// OFFICER: approve/reject a certificate
router.patch('/:id/status', authenticate, authorize('Officer', 'Admin'), async (req, res, next) => {
  try {
    const { status, remarks } = req.body; // 'Approved' | 'Rejected'
    const approvedDate = status === 'Approved' ? new Date() : null;
    await db.query(
      'UPDATE certificates SET status = ?, remarks = ?, approved_date = ? WHERE certificate_id = ?',
      [status, remarks || null, approvedDate, req.params.id]
    );
    res.json({ success: true, message: `Certificate ${status}` });
  } catch (err) { next(err); }
});

module.exports = router;
