const express = require("express");
const router = express.Router();
const { payTax, confirmTaxPayment } = require("../controllers/taxController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.post("/pay", verifyToken, requireRole("Citizen", "Business"), payTax);
router.patch("/:id/confirm-payment", verifyToken, requireRole("Citizen", "Business"), confirmTaxPayment);

module.exports = router;
