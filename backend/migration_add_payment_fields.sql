-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab)
-- Adds payment method + a dummy transaction reference to the orders table,
-- and a matching transaction reference to tax_payments.
ALTER TABLE orders
  ADD COLUMN payment_method ENUM('COD','eSewa') NOT NULL DEFAULT 'COD' AFTER payment_status,
  ADD COLUMN transaction_id VARCHAR(50) NULL AFTER payment_method;

ALTER TABLE tax_payments
  ADD COLUMN transaction_id VARCHAR(50) NULL AFTER payment_status;
