-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab),
-- BEFORE migration_nepal_locations_seed.sql (which only INSERTs into the
-- tables created here).
--
-- This migration re-architects the platform around Nepal's real
-- administrative hierarchy and removes the Business role entirely:
--   - Province -> District -> Local Body (the official government structure)
--   - Municipality = one onboarded Local Body running this platform
--   - Exactly ONE Admin per Municipality (not one Admin globally any more)
--   - Citizen, Officer and Admin all belong to a Municipality
--   - Certificates/Complaints are scoped to the Municipality they were filed in
--   - The Business role, and everything that only existed to serve it
--     (marketplace, cart, orders, products, categories), is dropped.

-- ---------------------------------------------------------------------------
-- 1. Nepal's official administrative hierarchy (reference data — populated by
--    migration_nepal_locations_seed.sql immediately after this file runs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS provinces (
  province_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nepali_name VARCHAR(100) NULL
);

CREATE TABLE IF NOT EXISTS districts (
  district_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nepali_name VARCHAR(100) NULL,
  province_id INT NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(province_id)
);

CREATE TABLE IF NOT EXISTS local_level_types (
  local_level_type_id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  nepali_name VARCHAR(50) NULL
);

-- A "Local Body" is one of Nepal's 753 official local levels (Metropolitan
-- City, Sub-Metropolitan City, Municipality, or Rural Municipality). Not
-- every Local Body is necessarily running this platform yet — see
-- `municipalities` below for the ones that are.
CREATE TABLE IF NOT EXISTS local_bodies (
  local_body_id INT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  nepali_name VARCHAR(100) NULL,
  district_id INT NOT NULL,
  local_level_type_id INT NOT NULL,
  FOREIGN KEY (district_id) REFERENCES districts(district_id),
  FOREIGN KEY (local_level_type_id) REFERENCES local_level_types(local_level_type_id)
);

-- ---------------------------------------------------------------------------
-- 2. Municipality = a Local Body actually onboarded onto this platform.
--    Everything else (users, certificates, complaints) belongs to exactly
--    one row here. Created the moment that Local Body's Admin is bootstrapped
--    (see authController.adminBootstrap).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS municipalities (
  municipality_id INT AUTO_INCREMENT PRIMARY KEY,
  local_body_id INT NOT NULL UNIQUE,
  office_address VARCHAR(255) NULL,
  contact_email VARCHAR(150) NULL,
  contact_phone VARCHAR(30) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (local_body_id) REFERENCES local_bodies(local_body_id)
);

-- ---------------------------------------------------------------------------
-- 3. users: drop the Business role, scope every account to a Municipality
-- ---------------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN role ENUM('Citizen','Officer','Admin') NOT NULL;

ALTER TABLE users
  ADD COLUMN municipality_id INT NULL AFTER role,
  ADD CONSTRAINT fk_users_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 4. Certificates and complaints are scoped to the Municipality they were
--    filed in, so each Municipality's Admin only ever sees their own work.
-- ---------------------------------------------------------------------------
ALTER TABLE certificates
  ADD COLUMN municipality_id INT NULL AFTER user_id,
  ADD CONSTRAINT fk_certificates_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

ALTER TABLE complaints
  ADD COLUMN municipality_id INT NULL AFTER user_id,
  ADD CONSTRAINT fk_complaints_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 4b. Departments and municipal services are each Municipality's own
--     internal structure now, not one global list — two different
--     Municipalities both having a "Revenue" department is normal, so the
--     old global UNIQUE(name) has to become UNIQUE(name, municipality_id).
-- ---------------------------------------------------------------------------
ALTER TABLE departments
  ADD COLUMN municipality_id INT NULL AFTER name,
  ADD CONSTRAINT fk_departments_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id),
  DROP INDEX name,
  ADD UNIQUE KEY uq_departments_name_municipality (name, municipality_id);

ALTER TABLE municipal_services
  ADD COLUMN municipality_id INT NULL AFTER name,
  ADD CONSTRAINT fk_services_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 5. Announcements no longer have a Business audience, and are scoped to the
--    Municipality that published them.
-- ---------------------------------------------------------------------------
ALTER TABLE notices
  MODIFY COLUMN target_role ENUM('All','Citizen','Officer') NOT NULL DEFAULT 'All',
  ADD COLUMN municipality_id INT NULL AFTER created_by,
  ADD CONSTRAINT fk_notices_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 6. Notifications no longer target a Business audience. A role-broadcast
--    notification (role_target set) is also scoped to one Municipality, so
--    an Admin's announcement never leaks into another Municipality's feed —
--    a direct notification (user_id set instead) doesn't need this, since
--    it already targets one specific account.
-- ---------------------------------------------------------------------------
ALTER TABLE notifications
  MODIFY COLUMN role_target ENUM('Citizen','Officer','Admin','All') NULL,
  ADD COLUMN municipality_id INT NULL AFTER role_target,
  ADD CONSTRAINT fk_notifications_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 7. Drop the Business role and everything that only served it. Order
--    matters: child tables (foreign keys) before their parents.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS businesses;

-- ---------------------------------------------------------------------------
-- 8. The old global "municipality_name/address/contact_*" settings are
--    superseded by the `municipalities` table (one row per Municipality
--    instead of one global key/value). Remove the stale global keys.
-- ---------------------------------------------------------------------------
DELETE FROM system_settings
  WHERE setting_key IN ('municipality_name', 'municipality_address', 'contact_email', 'contact_phone');

-- ---------------------------------------------------------------------------
-- 9. DB-level "one Admin per Municipality" enforcement (defense in depth
--    alongside the application-layer check in authController.js) lives in
--    its own file, migration_municipality_admin_trigger.sql — same
--    phpMyAdmin DELIMITER caveat as before, see that file for details.
-- ---------------------------------------------------------------------------
