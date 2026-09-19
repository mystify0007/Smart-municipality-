const express = require("express");
const router = express.Router();
const { register, login, staffRegister, staffLogin } = require("../controllers/authController");

// Public portal — Citizen, Business
router.post("/register", register);
router.post("/login", login);

// Staff portal — Officer, Admin only, fully separate from the above
router.post("/staff/register", staffRegister);
router.post("/staff/login", staffLogin);

module.exports = router;
