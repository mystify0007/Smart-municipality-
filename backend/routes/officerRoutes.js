const express = require("express");
const router = express.Router();
const {
  getQueue, getOfficerStats, updateApplication, requestMoreInfo,
  getProfile, updateProfile, getReports,
} = require("../controllers/officerController");
const { getMyAssignedComplaints, updateComplaintStatus } = require("../controllers/complaintController");
const { verifyToken, requireRole, requireApprovedOfficer } = require("../middleware/authMiddleware");

// Officer-only — every endpoint here is scoped to the caller's own
// assignments (see officerController.js / complaintController.js).
// System-wide equivalents live under /api/admin/* and are Admin-only.
// requireApprovedOfficer re-checks officer_status against the DB on every
// call, so a suspension takes effect immediately instead of waiting for the
// officer's JWT to expire.

router.get("/queue", verifyToken, requireRole("Officer"), requireApprovedOfficer, getQueue);
router.get("/stats", verifyToken, requireRole("Officer"), requireApprovedOfficer, getOfficerStats);
router.patch("/applications/:id", verifyToken, requireRole("Officer"), requireApprovedOfficer, updateApplication);
router.patch(
  "/applications/:id/request-info",
  verifyToken, requireRole("Officer"), requireApprovedOfficer,
  requestMoreInfo
);

router.get("/complaints", verifyToken, requireRole("Officer"), requireApprovedOfficer, getMyAssignedComplaints);
router.patch("/complaints/:id", verifyToken, requireRole("Officer"), requireApprovedOfficer, updateComplaintStatus);

router.get("/profile", verifyToken, requireRole("Officer"), requireApprovedOfficer, getProfile);
router.patch("/profile", verifyToken, requireRole("Officer"), requireApprovedOfficer, updateProfile);

router.get("/reports", verifyToken, requireRole("Officer"), requireApprovedOfficer, getReports);

module.exports = router;
