// controllers/marketplaceAdminController.js — Admin oversight of the
// marketplace: every product and order, system-wide, plus the ability to
// pull an inappropriate listing without deleting its order history.
const { pool } = require("../config/db");

// GET /api/admin/marketplace/products
async function adminListProducts(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, b.business_name, c.category_name
      FROM products p
      LEFT JOIN businesses b ON p.business_id = b.business_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, products: rows });
  } catch (err) {
    console.error("Admin list products error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch products" });
  }
}

// PATCH /api/admin/marketplace/products/:id/remove — hide from public listing
async function removeProduct(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("UPDATE products SET is_removed = 1 WHERE product_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, message: "Product removed from marketplace" });
  } catch (err) {
    console.error("Remove product error:", err);
    res.status(500).json({ success: false, error: "Failed to remove product" });
  }
}

// PATCH /api/admin/marketplace/products/:id/restore
async function restoreProduct(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("UPDATE products SET is_removed = 0 WHERE product_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    res.json({ success: true, message: "Product restored" });
  } catch (err) {
    console.error("Restore product error:", err);
    res.status(500).json({ success: false, error: "Failed to restore product" });
  }
}

// GET /api/admin/marketplace/orders — every order, system-wide
async function adminListOrders(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT o.order_id, o.order_status, o.payment_status, o.payment_method,
             o.total_amount, o.order_date, u.full_name AS buyer_name, u.email AS buyer_email
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      ORDER BY o.order_date DESC
    `);
    res.json({ success: true, orders: rows });
  } catch (err) {
    console.error("Admin list orders error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
}

module.exports = { adminListProducts, removeProduct, restoreProduct, adminListOrders };
