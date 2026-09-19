// controllers/productController.js
// businesses: business_id, user_id, business_name, owner_name, business_type,
//             pan_number, address, status ('Pending'|'Approved'|'Rejected')
// categories: category_id, category_name, description
// products: product_id, business_id, category_id, product_name, description,
//           price, stock, image, status ('Available'|'Out of Stock'), created_at
const { pool } = require("../config/db");

// GET /api/products — public browsing, optional ?category_id=. Never
// includes a product an Admin has removed for being inappropriate.
async function getAllProducts(req, res) {
  try {
    const { category_id } = req.query;

    let sql = `
      SELECT p.*, b.business_name, c.category_name
      FROM products p
      LEFT JOIN businesses b ON p.business_id = b.business_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.is_removed = 0
    `;
    const params = [];

    if (category_id) {
      sql += " AND p.category_id = ?";
      params.push(category_id);
    }

    sql += " ORDER BY p.created_at DESC";

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
}

// GET /api/products/categories — public
async function getAllCategories(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM categories ORDER BY category_name ASC");
    res.json({ success: true, categories: rows });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch categories" });
  }
}

// Shared helper: look up the caller's business row, or null if none/not approved yet
async function getApprovedBusiness(userId) {
  const [rows] = await pool.query(
    "SELECT business_id, status FROM businesses WHERE user_id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// GET /api/products/mine — MY listings (business role)
async function getMyProducts(req, res) {
  try {
    const business = await getApprovedBusiness(req.user.user_id);
    if (!business) {
      return res.status(404).json({ success: false, error: "No business profile found for this account" });
    }

    const [rows] = await pool.query(
      "SELECT * FROM products WHERE business_id = ? ORDER BY created_at DESC",
      [business.business_id]
    );
    res.json({ success: true, products: rows, business_status: business.status });
  } catch (err) {
    console.error("Get my products error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch your products" });
  }
}

// POST /api/products — create a listing. Blocked until Admin approves the business.
async function createProduct(req, res) {
  try {
    const { product_name, description, price, stock, category_id } = req.body;

    if (!product_name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        error: "product_name, price, and category_id are required",
      });
    }

    const business = await getApprovedBusiness(req.user.user_id);
    if (!business) {
      return res.status(404).json({ success: false, error: "No business profile found for this account" });
    }

    if (business.status !== "Approved") {
      return res.status(403).json({
        success: false,
        error: `Your business profile is currently '${business.status}'. An admin must approve it before you can list products.`,
      });
    }

    const imagePath = req.file ? `/uploads/products/${req.file.filename}` : null;

    const [result] = await pool.query(
      `INSERT INTO products (business_id, category_id, product_name, description, price, stock, image, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Available', NOW())`,
      [business.business_id, category_id, product_name, description || null, price, stock || 0, imagePath]
    );

    res.status(201).json({ success: true, product_id: result.insertId });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ success: false, error: "Failed to create product" });
  }
}

module.exports = { getAllProducts, getAllCategories, getMyProducts, createProduct };
