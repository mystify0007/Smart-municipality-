// controllers/cartController.js
// One cart row per user, cart_items holds line items. Cart is created lazily
// on first "add to cart" rather than at registration time.
const { pool } = require("../config/db");

async function getOrCreateCartId(userId) {
  const [existing] = await pool.query("SELECT cart_id FROM cart WHERE user_id = ?", [userId]);
  if (existing.length > 0) return existing[0].cart_id;

  const [result] = await pool.query(
    "INSERT INTO cart (user_id, created_at) VALUES (?, NOW())",
    [userId]
  );
  return result.insertId;
}

// GET /api/cart — MY cart with product details joined in
async function getMyCart(req, res) {
  try {
    const userId = req.user.user_id;

    const [cartRows] = await pool.query("SELECT cart_id FROM cart WHERE user_id = ?", [userId]);
    if (cartRows.length === 0) {
      return res.json({ success: true, items: [] });
    }

    const [items] = await pool.query(
      `SELECT ci.cart_item_id, ci.quantity, p.product_id, p.product_name AS name, p.price, p.image
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?`,
      [cartRows[0].cart_id]
    );

    res.json({ success: true, items });
  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch cart" });
  }
}

// POST /api/cart/items — add a product to MY cart
async function addToCart(req, res) {
  try {
    const userId = req.user.user_id;
    const { product_id, quantity } = req.body;

    if (!product_id) {
      return res.status(400).json({ success: false, error: "product_id is required" });
    }

    const cartId = await getOrCreateCartId(userId);
    const qty = quantity && quantity > 0 ? quantity : 1;

    // If this product is already in the cart, increase quantity instead of duplicating the row
    const [existingItem] = await pool.query(
      "SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [cartId, product_id]
    );

    if (existingItem.length > 0) {
      await pool.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE cart_item_id = ?",
        [qty, existingItem[0].cart_item_id]
      );
    } else {
      await pool.query(
        "INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)",
        [cartId, product_id, qty]
      );
    }

    res.status(201).json({ success: true, message: "Added to cart" });
  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ success: false, error: "Failed to add to cart" });
  }
}

// DELETE /api/cart/items/:id — remove one line item from MY cart
async function removeFromCart(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Verify the cart item actually belongs to this user before deleting —
    // otherwise a citizen could delete anyone's cart item by guessing IDs.
    const [rows] = await pool.query(
      `SELECT ci.cart_item_id
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Cart item not found" });
    }

    await pool.query("DELETE FROM cart_items WHERE cart_item_id = ?", [id]);
    res.json({ success: true, message: "Removed from cart" });
  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).json({ success: false, error: "Failed to remove item" });
  }
}

// PATCH /api/cart/items/:id — set an item's quantity directly.
// Sending quantity <= 0 removes the item entirely (same effect as the
// dedicated remove endpoint) so the frontend's "-" button can always
// call this one endpoint without a special case.
async function updateCartItemQuantity(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ success: false, error: "quantity is required" });
    }

    // Verify this cart item actually belongs to the logged-in user first
    const [rows] = await pool.query(
      `SELECT ci.cart_item_id
       FROM cart_items ci
       JOIN cart c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Cart item not found" });
    }

    if (quantity <= 0) {
      await pool.query("DELETE FROM cart_items WHERE cart_item_id = ?", [id]);
      return res.json({ success: true, message: "Item removed" });
    }

    await pool.query("UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?", [quantity, id]);
    res.json({ success: true, message: "Quantity updated" });
  } catch (err) {
    console.error("Update cart item error:", err);
    res.status(500).json({ success: false, error: "Failed to update quantity" });
  }
}

module.exports = { getMyCart, addToCart, removeFromCart, updateCartItemQuantity, getOrCreateCartId };
