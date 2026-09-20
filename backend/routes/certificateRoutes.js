const express = require("express");
const router = express.Router();
const { applyForCertificate } = require("../controllers/certificateController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { uploadCertificateDoc } = require("../middleware/uploadMiddleware");

// multer's .single("document") means the form field for the file must be named "document"
router.post(
  "/apply",
  verifyToken,
  requireRole("Citizen"),
  uploadCertificateDoc.single("document"),
  applyForCertificate
);

module.exports = router;
