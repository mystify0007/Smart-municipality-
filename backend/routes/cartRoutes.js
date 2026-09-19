const express = require("express");
const router = express.Router();
const {
  getMyCart, addToCart, removeFromCart, updateCartItemQuantity,
} = require("../controllers/cartController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

router.get("/", verifyToken, requireRole("Citizen", "Business"), getMyCart);
router.post("/items", verifyToken, requireRole("Citizen", "Business"), addToCart);
router.patch("/items/:id", verifyToken, requireRole("Citizen", "Business"), updateCartItemQuantity);
router.delete("/items/:id", verifyToken, requireRole("Citizen", "Business"), removeFromCart);

module.exports = router;
