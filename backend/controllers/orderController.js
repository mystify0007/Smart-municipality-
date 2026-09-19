// controllers/orderController.js
// orders: order_id, user_id, total_amount, order_status, payment_status,
//         order_date, payment_method ('COD'|'eSewa'), transaction_id
// order_items: order_item_id, order_id, product_id, quantity, price
const { pool } = require("../config/db");

const VALID_PAYMENT_METHODS = ["COD", "eSewa"];
const VALID_ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// POST /api/orders/checkout — convert MY cart into an order, all-or-nothing.
// Body: { payment_method: 'COD' | 'eSewa' }
// COD orders are marked payment_status='Pending' (paid when the delivery
// person collects cash). eSewa orders are ALSO left 'Pending' here — the
// frontend must redirect to the dummy eSewa page and call
// PATCH /api/orders/:id/confirm-payment to actually mark it Paid, mirroring
// how a real gateway redirect + callback works.
async function checkout(req, res) {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.user_id;
    const { payment_method } = req.body;

    if (!payment_method || !VALID_PAYMENT_METHODS.includes(payment_method)) {
      connection.release();
      return res.status(400).json({
        success: false,
        error: `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
      });
    }

    const [cartRows] = await connection.query("SELECT cart_id FROM cart WHERE user_id = ?", [userId]);
    if (cartRows.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }
    const cartId = cartRows[0].cart_id;

    const [items] = await connection.query(
      `SELECT ci.product_id, ci.quantity, p.price
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.product_id
       WHERE ci.cart_id = ?`,
      [cartId]
    );

    if (items.length === 0) {
      connection.release();
      return res.status(400).json({ success: false, error: "Cart is empty" });
    }

    const totalAmount = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

    await connection.beginTransaction();

    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, order_status, payment_status, payment_method, order_date)
       VALUES (?, ?, 'Pending', 'Pending', ?, NOW())`,
      [userId, totalAmount, payment_method]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    await connection.query("DELETE FROM cart_items WHERE cart_id = ?", [cartId]);

    await connection.commit();

    res.status(201).json({
      success: true,
      order_id: orderId,
      total_amount: totalAmount,
      payment_method,
      // Tells the frontend whether it needs to continue to the dummy eSewa
      // screen before the order is considered paid.
      requires_payment_confirmation: payment_method === "eSewa",
    });
  } catch (err) {
    await connection.rollback();
    console.error("Checkout error:", err);
    res.status(500).json({ success: false, error: "Checkout failed" });
  } finally {
    connection.release();
  }
}

// PATCH /api/orders/:id/confirm-payment — DUMMY eSewa confirmation.
// A real integration would verify a signature/callback from eSewa's servers;
// here we just simulate success and stamp a fake transaction id.
async function confirmEsewaPayment(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM orders WHERE order_id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    const order = rows[0];
    if (order.payment_method !== "eSewa") {
      return res.status(400).json({ success: false, error: "This order is not an eSewa payment" });
    }
    if (order.payment_status === "Paid") {
      return res.json({ success: true, message: "Already paid", transaction_id: order.transaction_id });
    }

    const dummyTransactionId = `ESW-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    await pool.query(
      "UPDATE orders SET payment_status = 'Paid', transaction_id = ? WHERE order_id = ?",
      [dummyTransactionId, id]
    );

    res.json({ success: true, message: "Payment confirmed", transaction_id: dummyTransactionId });
  } catch (err) {
    console.error("Confirm eSewa payment error:", err);
    res.status(500).json({ success: false, error: "Failed to confirm payment" });
  }
}

// GET /api/orders/mine — MY order history (buyer side, for order tracking)
async function getMyOrders(req, res) {
  try {
    const userId = req.user.user_id;
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC",
      [userId]
    );
    res.json({ success: true, orders });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
}

// GET /api/orders/business — incoming orders containing MY products (seller side)
async function getBusinessOrders(req, res) {
  try {
    const userId = req.user.user_id;

    const [businessRows] = await pool.query("SELECT business_id FROM businesses WHERE user_id = ?", [userId]);
    if (businessRows.length === 0) {
      return res.status(404).json({ success: false, error: "No business profile found for this account" });
    }
    const businessId = businessRows[0].business_id;

    const [rows] = await pool.query(
      `SELECT o.order_id, o.order_status, o.payment_status, o.payment_method, o.order_date, oi.quantity, oi.price,
              p.product_name, u.full_name AS buyer_name
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.order_id
       JOIN products p ON oi.product_id = p.product_id
       JOIN users u ON o.user_id = u.user_id
       WHERE p.business_id = ?
       ORDER BY o.order_date DESC`,
      [businessId]
    );

    res.json({ success: true, orders: rows });
  } catch (err) {
    console.error("Get business orders error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch orders" });
  }
}

// PATCH /api/orders/business/:id/status — business updates an order's
// tracking status. Verifies the order actually contains one of THIS
// business's products before allowing the update.
async function updateOrderStatus(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { order_status } = req.body;

    if (!order_status || !VALID_ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({
        success: false,
        error: `order_status must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
      });
    }

    const [businessRows] = await pool.query("SELECT business_id FROM businesses WHERE user_id = ?", [userId]);
    if (businessRows.length === 0) {
      return res.status(404).json({ success: false, error: "No business profile found for this account" });
    }
    const businessId = businessRows[0].business_id;

    const [ownsOrder] = await pool.query(
      `SELECT 1 FROM order_items oi
       JOIN products p ON oi.product_id = p.product_id
       WHERE oi.order_id = ? AND p.business_id = ?
       LIMIT 1`,
      [id, businessId]
    );

    if (ownsOrder.length === 0) {
      return res.status(403).json({ success: false, error: "This order does not contain any of your products" });
    }

    await pool.query("UPDATE orders SET order_status = ? WHERE order_id = ?", [order_status, id]);

    res.json({ success: true, message: `Order marked ${order_status}` });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ success: false, error: "Failed to update order status" });
  }
}

// PATCH /api/orders/business/:id/payment-status — COD only. There's no
// rider/delivery step that confirms cash was collected, so the business
// marks it manually once the buyer pays on delivery. eSewa orders are
// confirmed automatically via confirmEsewaPayment and can't be toggled here.
async function updatePaymentStatus(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!["Paid", "Pending"].includes(payment_status)) {
      return res.status(400).json({ success: false, error: "payment_status must be Paid or Pending" });
    }

    const [businessRows] = await pool.query("SELECT business_id FROM businesses WHERE user_id = ?", [userId]);
    if (businessRows.length === 0) {
      return res.status(404).json({ success: false, error: "No business profile found for this account" });
    }
    const businessId = businessRows[0].business_id;

    const [ownsOrder] = await pool.query(
      `SELECT o.payment_method FROM orders o
       JOIN order_items oi ON oi.order_id = o.order_id
       JOIN products p ON oi.product_id = p.product_id
       WHERE o.order_id = ? AND p.business_id = ?
       LIMIT 1`,
      [id, businessId]
    );

    if (ownsOrder.length === 0) {
      return res.status(403).json({ success: false, error: "This order does not contain any of your products" });
    }

    if (ownsOrder[0].payment_method !== "COD") {
      return res.status(400).json({ success: false, error: "Only Cash on Delivery orders can be marked here" });
    }

    await pool.query("UPDATE orders SET payment_status = ? WHERE order_id = ?", [payment_status, id]);

    res.json({ success: true, message: `Payment marked ${payment_status}` });
  } catch (err) {
    console.error("Update payment status error:", err);
    res.status(500).json({ success: false, error: "Failed to update payment status" });
  }
}

module.exports = {
  checkout, confirmEsewaPayment, getMyOrders, getBusinessOrders, updateOrderStatus, updatePaymentStatus,
};
