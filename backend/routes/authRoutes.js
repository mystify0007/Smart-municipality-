const express = require("express");
const router = express.Router();
const {
  register, login, staffLogin, adminBootstrap, changePassword,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// Public portal — Citizen
router.post("/register", register);
router.post("/login", login);

// Staff portal — Officer, like every Admin scope, is only ever created by
// the tier above it (see officerVerificationController.createOfficer) —
// there is no public Officer registration. Both Officer and Admin log in
// here.
router.post("/staff/login", staffLogin);

// Admin bootstrap — not linked from any UI, see authController.js. The only
// way the single State Admin account is ever created; the State Admin then
// creates Province Admins via POST /api/admin/province-admins, who each
// create Municipality Admins via POST /api/admin/municipality-admins.
router.post("/admin/bootstrap", adminBootstrap);

// Shared — any authenticated role
router.patch("/change-password", verifyToken, changePassword);

module.exports = router;
