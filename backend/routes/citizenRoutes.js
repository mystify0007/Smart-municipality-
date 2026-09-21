const express = require("express");
const router = express.Router();
const { getMyRequests, getMyStats, getMyPayments, getProfile, updateProfile } = require("../controllers/citizenController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/requests", verifyToken, requireRole("Citizen"), getMyRequests);
router.get("/stats", verifyToken, requireRole("Citizen"), getMyStats);
router.get("/tax-payments", verifyToken, requireRole("Citizen"), getMyPayments);
router.get("/profile", verifyToken, requireRole("Citizen"), getProfile);
router.patch("/profile", verifyToken, requireRole("Citizen"), updateProfile);

module.exports = router;
