const express = require("express");
const router = express.Router();
const { submitComplaint, getMyComplaints } = require("../controllers/complaintController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { uploadComplaintMedia } = require("../middleware/uploadMiddleware");

router.post(
  "/",
  verifyToken,
  requireRole("Citizen", "Business"),
  uploadComplaintMedia.single("media"),
  submitComplaint
);
router.get("/mine", verifyToken, requireRole("Citizen", "Business"), getMyComplaints);

module.exports = router;
