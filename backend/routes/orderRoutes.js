const express = require("express");
const router = express.Router();
const {
  checkout, confirmEsewaPayment, getMyOrders, getBusinessOrders, updateOrderStatus, updatePaymentStatus,
} = require("../controllers/orderController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Citizen-only — a Business account browses the marketplace but doesn't buy
router.post("/checkout", verifyToken, requireRole("Citizen"), checkout);
router.patch("/:id/confirm-payment", verifyToken, requireRole("Citizen"), confirmEsewaPayment);
router.get("/mine", verifyToken, requireRole("Citizen"), getMyOrders);

router.get("/business", verifyToken, requireRole("Business"), getBusinessOrders);
router.patch("/business/:id/status", verifyToken, requireRole("Business"), updateOrderStatus);
router.patch("/business/:id/payment-status", verifyToken, requireRole("Business"), updatePaymentStatus);

module.exports = router;
