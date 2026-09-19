const express = require("express");
const router = express.Router();
const {
  getAdminStats, createNotice, getBusinesses, updateBusinessStatus, updateUserStatus,
} = require("../controllers/adminController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/stats", verifyToken, requireRole("Admin"), getAdminStats);
router.post("/notices", verifyToken, requireRole("Admin"), createNotice);

router.get("/businesses", verifyToken, requireRole("Admin"), getBusinesses);
router.patch("/businesses/:id", verifyToken, requireRole("Admin"), updateBusinessStatus);

router.patch("/users/:id/status", verifyToken, requireRole("Admin"), updateUserStatus);

module.exports = router;
