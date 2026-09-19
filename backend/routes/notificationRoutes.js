const express = require("express");
const router = express.Router();
const { getMyNotifications, markNotificationRead, markAllRead } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

// Any authenticated role — a notification is always scoped to the caller's
// own user_id or role inside the controller, never the whole table.
router.get("/mine", verifyToken, getMyNotifications);
router.patch("/read-all", verifyToken, markAllRead);
router.patch("/:id/read", verifyToken, markNotificationRead);

module.exports = router;
