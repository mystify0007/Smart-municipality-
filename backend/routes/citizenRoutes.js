const express = require("express");
const router = express.Router();
const { getMyRequests, getMyStats, getMyPayments } = require("../controllers/citizenController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/requests", verifyToken, requireRole("Citizen"), getMyRequests);
router.get("/stats", verifyToken, requireRole("Citizen"), getMyStats);
router.get("/tax-payments", verifyToken, requireRole("Citizen"), getMyPayments);

module.exports = router;
