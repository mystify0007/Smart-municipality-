const express = require("express");
const router = express.Router();
const {
  getMyProfile, updateMyProfile, getMyRequests, getMyStats, getMyPayments,
} = require("../controllers/citizenController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/profile", verifyToken, requireRole("Citizen"), getMyProfile);
router.patch("/profile", verifyToken, requireRole("Citizen"), updateMyProfile);
router.get("/requests", verifyToken, requireRole("Citizen"), getMyRequests);
router.get("/stats", verifyToken, requireRole("Citizen"), getMyStats);
router.get("/tax-payments", verifyToken, requireRole("Citizen"), getMyPayments);

module.exports = router;
