// controllers/taxController.js
// tax_payments: payment_id, user_id, tax_type, amount, payment_method,
//               payment_status, payment_date, transaction_id (added below)
const { pool } = require("../config/db");

const VALID_TAX_TYPES = ["House Tax", "Land Tax", "Business Tax", "Water Bill"];
const VALID_PAYMENT_METHODS = ["Cash", "eSewa", "Khalti", "Bank"];

// POST /api/tax/pay
// Cash/Khalti/Bank are treated as settled immediately (counter payment or
// bank transfer already confirmed). eSewa mirrors the marketplace checkout:
// the row is created 'Pending' and only flips to 'Paid' once the dummy
// eSewa login+pay step completes via confirmTaxPayment below.
async function payTax(req, res) {
  try {
    const userId = req.user.user_id;
    const { tax_type, amount, payment_method } = req.body;

    if (!req.user.municipality_id) {
      return res.status(400).json({
        success: false,
        error: "Complete your profile (select your municipality) before paying tax.",
      });
    }

    if (!tax_type || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: "tax_type, amount, and payment_method are required",
      });
    }

    if (!VALID_TAX_TYPES.includes(tax_type)) {
      return res.status(400).json({
        success: false,
        error: `tax_type must be one of: ${VALID_TAX_TYPES.join(", ")}`,
      });
    }

    if (!VALID_PAYMENT_METHODS.includes(payment_method)) {
      return res.status(400).json({
        success: false,
        error: `payment_method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
      });
    }

    const initialStatus = payment_method === "eSewa" ? "Pending" : "Paid";

    const [result] = await pool.query(
      `INSERT INTO tax_payments (user_id, tax_type, amount, payment_method, payment_status, payment_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, tax_type, amount, payment_method, initialStatus]
    );

    res.status(201).json({
      success: true,
      message: initialStatus === "Paid" ? "Payment recorded" : "Payment created, awaiting eSewa confirmation",
      payment_id: result.insertId,
      payment_method,
      requires_payment_confirmation: payment_method === "eSewa",
    });
  } catch (err) {
    console.error("Pay tax error:", err);
    res.status(500).json({ success: false, error: "Failed to process payment" });
  }
}

// PATCH /api/tax/:id/confirm-payment — DUMMY eSewa confirmation, same shape
// as the marketplace order confirmation. The frontend only calls this AFTER
// the user completes the fake eSewa login (ID + PIN) — see EsewaGateway.
async function confirmTaxPayment(req, res) {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM tax_payments WHERE payment_id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    const payment = rows[0];
    if (payment.payment_method !== "eSewa") {
      return res.status(400).json({ success: false, error: "This payment is not an eSewa payment" });
    }
    if (payment.payment_status === "Paid") {
      return res.json({ success: true, message: "Already paid" });
    }

    const dummyTransactionId = `ESW-TAX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    await pool.query(
      "UPDATE tax_payments SET payment_status = 'Paid', transaction_id = ? WHERE payment_id = ?",
      [dummyTransactionId, id]
    );

    res.json({ success: true, message: "Payment confirmed", transaction_id: dummyTransactionId });
  } catch (err) {
    console.error("Confirm tax payment error:", err);
    res.status(500).json({ success: false, error: "Failed to confirm payment" });
  }
}

module.exports = { payTax, confirmTaxPayment, VALID_TAX_TYPES, VALID_PAYMENT_METHODS };
