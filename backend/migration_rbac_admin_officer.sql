-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab)
-- Adds the schema needed for strict role-based access control:
--   - a single, protected Admin account
--   - an Officer verification workflow (pending/approved/rejected/suspended)
--   - application/complaint assignment to Officers
--   - departments, municipal services, system settings
--   - a shared notifications table
--
-- Safe to run on the existing dump: every ALTER only adds columns/values,
-- nothing here drops or renames existing data.

-- ---------------------------------------------------------------------------
-- 1. Officer identity fields on users
-- ---------------------------------------------------------------------------
ALTER TABLE users
  ADD COLUMN department VARCHAR(100) NULL AFTER address,
  -- named `designation` rather than `position` because POSITION is a
  -- reserved word in MySQL's grammar (the POSITION(... IN ...) function)
  ADD COLUMN designation VARCHAR(100) NULL AFTER department,
  ADD COLUMN officer_status ENUM('Pending','Approved','Rejected','Suspended') NULL AFTER designation,
  ADD COLUMN rejection_reason TEXT NULL AFTER officer_status,
  ADD COLUMN verified_by INT NULL AFTER rejection_reason,
  ADD COLUMN verified_at DATETIME NULL AFTER verified_by;

-- Documents an Officer submits at registration (identification / qualification)
CREATE TABLE IF NOT EXISTS officer_documents (
  document_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- 2. Departments + Municipal Services
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  department_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS municipal_services (
  service_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT NULL,
  required_documents TEXT NULL,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  department_id INT NULL,
  assigned_officer_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 3. Application (certificates) assignment + expanded workflow
-- ---------------------------------------------------------------------------
ALTER TABLE certificates
  ADD COLUMN assigned_officer_id INT NULL AFTER user_id,
  ADD COLUMN additional_info_requested TEXT NULL AFTER remarks,
  ADD CONSTRAINT fk_certificates_assigned_officer
    FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE certificates
  MODIFY COLUMN status ENUM('Pending','Processing','Approved','Rejected','Completed') NOT NULL DEFAULT 'Pending';

-- ---------------------------------------------------------------------------
-- 4. Complaint assignment + escalation
-- ---------------------------------------------------------------------------
ALTER TABLE complaints
  ADD COLUMN assigned_officer_id INT NULL AFTER user_id,
  ADD COLUMN escalated TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN closed_at DATETIME NULL AFTER escalated,
  ADD CONSTRAINT fk_complaints_assigned_officer
    FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id) ON DELETE SET NULL;

ALTER TABLE complaints
  MODIFY COLUMN status ENUM('Pending','In Progress','Resolved','Escalated','Closed') NOT NULL DEFAULT 'Pending';

-- ---------------------------------------------------------------------------
-- 5. Business suspension
-- ---------------------------------------------------------------------------
ALTER TABLE businesses
  MODIFY COLUMN status ENUM('Pending','Approved','Rejected','Suspended') NOT NULL DEFAULT 'Pending';

-- ---------------------------------------------------------------------------
-- 5b. Marketplace moderation: hide a product from public listing without
--     deleting it, so Admin can remove inappropriate listings reversibly.
-- ---------------------------------------------------------------------------
ALTER TABLE products
  ADD COLUMN is_removed TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- ---------------------------------------------------------------------------
-- 6. Announcements: target a role (Citizen/Business/Officer/All)
-- ---------------------------------------------------------------------------
ALTER TABLE notices
  ADD COLUMN target_role ENUM('All','Citizen','Business','Officer') NOT NULL DEFAULT 'All' AFTER description,
  ADD COLUMN updated_at DATETIME NULL AFTER publish_date;

-- ---------------------------------------------------------------------------
-- 7. Shared notifications (assignment alerts, announcements, verification results)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  role_target ENUM('Citizen','Business','Officer','Admin','All') NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  related_type VARCHAR(50) NULL,
  related_id INT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- 8. System settings (municipality info, notification toggles, config) — key/value
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (setting_key, setting_value) VALUES
  ('municipality_name', 'Smart Municipality'),
  ('municipality_address', ''),
  ('contact_email', ''),
  ('contact_phone', ''),
  ('notify_email_enabled', 'true'),
  ('notify_sms_enabled', 'false')
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- ---------------------------------------------------------------------------
-- 9. DB-level single-Admin enforcement (defense in depth alongside the
--    application-layer check in authController.js) lives in its own file:
--    migration_single_admin_trigger.sql — kept separate because phpMyAdmin's
--    SQL tab handling of DELIMITER-based CREATE TRIGGER statements is
--    unreliable across versions/MariaDB, and a failure there should never
--    block the rest of this migration (everything above this line is plain
--    single-statement SQL and always safe to run as one script).
-- ---------------------------------------------------------------------------
