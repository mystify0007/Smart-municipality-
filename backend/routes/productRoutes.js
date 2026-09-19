const express = require("express");
const router = express.Router();
const {
  getAllProducts, getAllCategories, getMyProducts, createProduct,
} = require("../controllers/productController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");
const { uploadProductImage } = require("../middleware/uploadMiddleware");

router.get("/", getAllProducts);
router.get("/categories", getAllCategories);

router.get("/mine", verifyToken, requireRole("Business"), getMyProducts);
router.post("/", verifyToken, requireRole("Business"), uploadProductImage.single("image"), createProduct);

module.exports = router;
