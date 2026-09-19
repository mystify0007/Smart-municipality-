const express = require("express");
const router = express.Router();
const { listDepartments } = require("../controllers/settingsController");

// Public — feeds the department dropdown on the Officer registration form,
// which has no token yet. Admin management of departments lives under
// /api/admin/departments (same underlying controller function).
router.get("/", listDepartments);

module.exports = router;
