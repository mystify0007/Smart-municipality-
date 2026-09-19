const express = require("express");
const router = express.Router();
const {
  checkout, confirmEsewaPayment, getMyOrders, getBusinessOrders, updateOrderStatus,
} = require("../controllers/orderController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.post("/checkout", verifyToken, requireRole("Citizen", "Business"), checkout);
router.patch("/:id/confirm-payment", verifyToken, requireRole("Citizen", "Business"), confirmEsewaPayment);
router.get("/mine", verifyToken, requireRole("Citizen", "Business"), getMyOrders);

router.get("/business", verifyToken, requireRole("Business"), getBusinessOrders);
router.patch("/business/:id/status", verifyToken, requireRole("Business"), updateOrderStatus);

module.exports = router;
