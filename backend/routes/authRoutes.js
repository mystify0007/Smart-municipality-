const express = require("express");
const router = express.Router();
const {
  register, login, staffRegister, staffLogin, adminBootstrap, changePassword,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const { uploadOfficerDocs } = require("../middleware/uploadMiddleware");

// Public portal — Citizen, Business
router.post("/register", register);
router.post("/login", login);

// Staff portal — Officer registers here (Admin never can); Officer + Admin log in here
router.post("/staff/register", uploadOfficerDocs.array("documents", 5), staffRegister);
router.post("/staff/login", staffLogin);

// Admin bootstrap — not linked from any UI, see authController.js. The only
// way the system's single Admin account is ever created.
router.post("/admin/bootstrap", adminBootstrap);

// Shared — any authenticated role
router.patch("/change-password", verifyToken, changePassword);

module.exports = router;
