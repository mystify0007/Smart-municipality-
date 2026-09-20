-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab),
-- BEFORE migration_nepal_locations_seed.sql (which only INSERTs into the
-- tables created here).
--
-- This migration re-architects the platform around Nepal's real
-- administrative hierarchy and removes the Business role entirely:
--   - Province -> District -> Local Body (the official government structure)
--   - Municipality = one onboarded Local Body running this platform
--   - TWO admin tiers, mirroring Nepal's own government layers:
--       - Province Admin: exactly one per Province, oversees every
--         Municipality onboarded within it and creates their Admins
--       - Municipality Admin: exactly one per Municipality, manages that
--         Municipality's citizens/officers and assigns work to its officers
--   - Citizen, Officer, and Municipality Admin all belong to a Municipality;
--     a Province Admin belongs to a Province instead
--   - Certificates/Complaints are scoped to the Municipality they were filed in
--   - The Business role, and everything that only existed to serve it
--     (marketplace, cart, orders, products, categories), is dropped.
--
-- Order matters a lot in this file: every table/row that references a
-- Business-role user (or targets 'Business' in an ENUM) has to be cleaned up
-- BEFORE the `users.role` column is narrowed to drop 'Business' from its
-- ENUM — MySQL refuses ENUM truncation (#1265) if any existing row still
-- holds the value being removed, and it refuses to DROP a still-referenced
-- table's row via a parent DELETE if a foreign key would go dangling.

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
-- 3. Drop the Business role and everything that only served it — BEFORE any
--    ENUM narrowing below, so nothing is left referencing a 'Business' row.
--    Foreign-key checks are disabled for this block rather than relying on a
--    specific drop order: everything that could reference any of these
--    tables is itself one of these tables (or gets cleaned up in step 3b
--    below), so there is nothing left dangling once checks are re-enabled —
--    and this avoids failing on a foreign key from a table this migration's
--    author doesn't know an installation added independently.
-- ---------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS cart;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS businesses;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------------
-- 3b. Any Business account may, under the old rules, have personally filed a
--     certificate/complaint/tax payment or authored a notice — clean those up
--     (or retarget them) before the account itself is deleted, otherwise the
--     DELETE below fails on a dangling foreign key.
-- ---------------------------------------------------------------------------
DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM users WHERE role = 'Business');
DELETE FROM tax_payments WHERE user_id IN (SELECT user_id FROM users WHERE role = 'Business');
DELETE FROM complaints WHERE user_id IN (SELECT user_id FROM users WHERE role = 'Business');
DELETE FROM certificates WHERE user_id IN (SELECT user_id FROM users WHERE role = 'Business');
DELETE FROM notices WHERE created_by IN (SELECT user_id FROM users WHERE role = 'Business');

-- A notice/notification *targeting* 'Business' as an audience (rather than
-- authored by one) is retargeted to 'All' rather than deleted, since the
-- announcement content itself is still meaningful.
UPDATE notices SET target_role = 'All' WHERE target_role = 'Business';
UPDATE notifications SET role_target = 'All' WHERE role_target = 'Business';

-- Now it is finally safe to remove the Business accounts themselves.
DELETE FROM users WHERE role = 'Business';

-- ---------------------------------------------------------------------------
-- 4. users: drop the Business role, scope every account to a Municipality
--    (or, for a Province/State Admin, one level higher instead). admin_scope
--    is NULL for Citizen/Officer and only ever set for role='Admin', mirroring
--    Nepal's own three government layers:
--      'State'        -> province_id NULL, municipality_id NULL (oversees everything)
--      'Province'     -> province_id set, municipality_id NULL
--      'Municipality' -> municipality_id set, province_id NULL
-- ---------------------------------------------------------------------------
ALTER TABLE users
  MODIFY COLUMN role ENUM('Citizen','Officer','Admin') NOT NULL;

ALTER TABLE users
  ADD COLUMN admin_scope ENUM('State','Province','Municipality') NULL AFTER role,
  ADD COLUMN province_id INT NULL AFTER admin_scope,
  ADD COLUMN municipality_id INT NULL AFTER province_id,
  ADD CONSTRAINT fk_users_province
    FOREIGN KEY (province_id) REFERENCES provinces(province_id),
  ADD CONSTRAINT fk_users_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 5. Certificates and complaints are scoped to the Municipality they were
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
-- 5b. Departments and municipal services are each Municipality's own
--     internal structure now, not one global list — two different
--     Municipalities both having a "Revenue" department is normal, so the
--     old global UNIQUE(name) has to become UNIQUE(name, municipality_id).
-- ---------------------------------------------------------------------------
ALTER TABLE departments
  ADD COLUMN municipality_id INT NULL AFTER name,
  ADD CONSTRAINT fk_departments_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- The old UNIQUE(name) constraint's index isn't necessarily called `name` —
-- that's only what an inline `UNIQUE` column attribute is auto-named on a
-- freshly-created table. An installation whose `departments` table has any
-- other history (a different server version, a manual phpMyAdmin edit) can
-- have that same constraint under a different index name, and a hardcoded
-- `DROP INDEX name` fails outright if so — look the real name up instead.
SET @old_unique_index := (
  SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'departments'
    AND COLUMN_NAME = 'name' AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'
  LIMIT 1
);
SET @drop_old_unique := IF(@old_unique_index IS NOT NULL,
  CONCAT('ALTER TABLE departments DROP INDEX `', @old_unique_index, '`'),
  'DO 0');
PREPARE stmt FROM @drop_old_unique;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE departments
  ADD UNIQUE KEY uq_departments_name_municipality (name, municipality_id);

ALTER TABLE municipal_services
  ADD COLUMN municipality_id INT NULL AFTER name,
  ADD CONSTRAINT fk_services_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 6. Announcements no longer have a Business audience, and are scoped to the
--    Municipality that published them. (Any pre-existing 'Business'-targeted
--    notice was already retargeted to 'All' in step 3b, above.)
-- ---------------------------------------------------------------------------
ALTER TABLE notices
  MODIFY COLUMN target_role ENUM('All','Citizen','Officer') NOT NULL DEFAULT 'All',
  ADD COLUMN municipality_id INT NULL AFTER created_by,
  ADD CONSTRAINT fk_notices_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 7. Notifications no longer target a Business audience either. A
--    role-broadcast notification (role_target set) is also scoped to one
--    Municipality, so an Admin's announcement never leaks into another
--    Municipality's feed — a direct notification (user_id set instead)
--    doesn't need this, since it already targets one specific account.
-- ---------------------------------------------------------------------------
ALTER TABLE notifications
  MODIFY COLUMN role_target ENUM('Citizen','Officer','Admin','All') NULL,
  ADD COLUMN municipality_id INT NULL AFTER role_target,
  ADD CONSTRAINT fk_notifications_municipality
    FOREIGN KEY (municipality_id) REFERENCES municipalities(municipality_id);

-- ---------------------------------------------------------------------------
-- 8. The old global "municipality_name/address/contact_*" settings are
--    superseded by the `municipalities` table (one row per Municipality
--    instead of one global key/value). Remove the stale global keys.
-- ---------------------------------------------------------------------------
DELETE FROM system_settings
  WHERE setting_key IN ('municipality_name', 'municipality_address', 'contact_email', 'contact_phone');

-- ---------------------------------------------------------------------------
-- 9. DB-level "one Admin per Province, one Admin per Municipality"
--    enforcement (defense in depth alongside the application-layer checks in
--    authController.js) lives in its own file,
--    migration_municipality_admin_trigger.sql — same phpMyAdmin DELIMITER
--    caveat as before, see that file for details.
-- ---------------------------------------------------------------------------
