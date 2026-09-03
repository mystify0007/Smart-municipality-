-- ============================================================
-- FINAL MIGRATION SCRIPT
-- Run this ONCE in phpMyAdmin's SQL tab on smart_municipality_portal
-- ============================================================

-- 1. Add missing columns needed by the backend
ALTER TABLE users ADD COLUMN status ENUM('Active','Blocked') DEFAULT 'Active';
ALTER TABLE certificates ADD COLUMN document_path VARCHAR(255) DEFAULT NULL;
ALTER TABLE complaints ADD COLUMN image VARCHAR(255) DEFAULT NULL;

-- 2. Create reviews table (citizens rating/reviewing purchased products)
CREATE TABLE reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  order_id INT NOT NULL,
  rating INT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (order_id) REFERENCES orders(order_id)
);

-- 3. Create departments table (admin manages municipality departments)
CREATE TABLE departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Fix existing seed users so they can actually log in.
-- Your original dump had PLAIN TEXT passwords (e.g. '123456'), but the API
-- uses bcrypt to check passwords, so plain text will never match. This
-- updates all of them to a real bcrypt hash of "123456" so you can log in
-- immediately with that password for testing.
UPDATE users
SET password = '$2b$10$6XtmwwSXblNWPKfynbvNeO1Y3a/2Cu7JTTsB9Hir0K.IAv3IowsmC'
WHERE email IN (
  'jennie22@gmail.com',
  'shilpa34@gmail.com',
  'harry@gmail.com',
  'admin@gmail.com'
);
-- After this runs, ALL of the above can log in with password: 123456

-- 5. Fix the broken/empty seed rows from your dump (user_id 1 and 8 have
-- blank names/emails/passwords). We can't DELETE user_id 1 because it's
-- referenced by existing certificates/complaints/tax_payments rows (foreign
-- key constraint would block it) — so we fix its data in place instead.
UPDATE users SET
  full_name = 'Legacy Test User',
  email = 'legacyuser@test.com',
  password = '$2b$10$6XtmwwSXblNWPKfynbvNeO1Y3a/2Cu7JTTsB9Hir0K.IAv3IowsmC',
  role = 'Citizen'
WHERE user_id = 1;

-- user_id 8 has no existing foreign key references, so it's safe to delete outright
DELETE FROM users WHERE user_id = 8;
