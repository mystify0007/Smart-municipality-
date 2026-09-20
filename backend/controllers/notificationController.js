// controllers/notificationController.js
// notifications: notification_id, user_id (specific recipient, nullable),
//                role_target ('Citizen'|'Officer'|'Admin'|'All', nullable),
//                municipality_id (required alongside role_target — a
//                broadcast never crosses Municipality boundaries),
//                title, message, related_type, related_id, is_read, created_at
const { pool } = require("../config/db");

// Internal helper used by other controllers (officer verification,
// application/complaint assignment, announcements) — not exposed as a route.
// Pass either user_id (a specific recipient) or role_target + municipality_id
// (a broadcast to one Municipality's users), not both.
async function createNotification({ user_id, role_target, municipality_id, title, message, related_type, related_id }) {
  await pool.query(
    `INSERT INTO notifications (user_id, role_target, municipality_id, title, message, related_type, related_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_id || null, role_target || null, municipality_id || null, title, message, related_type || null, related_id || null]
  );
}

// GET /api/notifications/mine — notifications addressed to me directly, or
// broadcast to my role within my own Municipality
async function getMyNotifications(req, res) {
  try {
    const { user_id, role, municipality_id } = req.user;
    const [rows] = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = ? OR (role_target IN (?, 'All') AND municipality_id = ?)
       ORDER BY created_at DESC
       LIMIT 100`,
      [user_id, role, municipality_id]
    );
    const unreadCount = rows.filter((n) => !n.is_read).length;
    res.json({ success: true, notifications: rows, unread_count: unreadCount });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch notifications" });
  }
}

// PATCH /api/notifications/:id/read
async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const { user_id, role, municipality_id } = req.user;

    const [result] = await pool.query(
      `UPDATE notifications SET is_read = 1
       WHERE notification_id = ? AND (user_id = ? OR (role_target IN (?, 'All') AND municipality_id = ?))`,
      [id, user_id, role, municipality_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Notification not found" });
    }

    res.json({ success: true, message: "Marked as read" });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ success: false, error: "Failed to update notification" });
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res) {
  try {
    const { user_id, role, municipality_id } = req.user;
    await pool.query(
      `UPDATE notifications SET is_read = 1
       WHERE (user_id = ? OR (role_target IN (?, 'All') AND municipality_id = ?)) AND is_read = 0`,
      [user_id, role, municipality_id]
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all notifications read error:", err);
    res.status(500).json({ success: false, error: "Failed to update notifications" });
  }
}

module.exports = { createNotification, getMyNotifications, markNotificationRead, markAllRead };
