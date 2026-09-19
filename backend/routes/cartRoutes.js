const express = require("express");
const router = express.Router();
const {
  getMyCart, addToCart, removeFromCart, updateCartItemQuantity,
} = require("../controllers/cartController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Citizen-only — a Business account browses the marketplace but doesn't buy
router.get("/", verifyToken, requireRole("Citizen"), getMyCart);
router.post("/items", verifyToken, requireRole("Citizen"), addToCart);
router.patch("/items/:id", verifyToken, requireRole("Citizen"), updateCartItemQuantity);
router.delete("/items/:id", verifyToken, requireRole("Citizen"), removeFromCart);

module.exports = router;
