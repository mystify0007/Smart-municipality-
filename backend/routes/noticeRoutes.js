const express = require("express");
const router = express.Router();
const { getNotices } = require("../controllers/adminController");

// Public — anyone (even logged out) can view the notice board
router.get("/", getNotices);

module.exports = router;
