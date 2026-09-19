const express = require("express");
const router = express.Router();
const { getQueue, getOfficerStats, updateApplication } = require("../controllers/officerController");
const { getAllComplaints, updateComplaintStatus } = require("../controllers/complaintController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/queue", verifyToken, requireRole("Officer", "Admin"), getQueue);
router.get("/stats", verifyToken, requireRole("Officer", "Admin"), getOfficerStats);
router.patch("/applications/:id", verifyToken, requireRole("Officer", "Admin"), updateApplication);

router.get("/complaints", verifyToken, requireRole("Officer", "Admin"), getAllComplaints);
router.patch("/complaints/:id", verifyToken, requireRole("Officer", "Admin"), updateComplaintStatus);

module.exports = router;
