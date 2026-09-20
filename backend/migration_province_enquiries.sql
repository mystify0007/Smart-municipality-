-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab),
-- any time after migration_municipality_nepal_structure.sql (needs the
-- `provinces` and `users` tables it creates).
--
-- Lets a Province Admin raise an enquiry to the State Admin when something
-- can't be resolved at the Province level, and lets the State Admin respond.
-- One enquiry belongs to exactly one Province; there is exactly one State
-- Admin to route it to (see adminBootstrap in authController.js), so no
-- "assigned to" column is needed.

CREATE TABLE IF NOT EXISTS province_enquiries (
  enquiry_id INT AUTO_INCREMENT PRIMARY KEY,
  province_id INT NOT NULL,
  raised_by INT NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('Open','Resolved') NOT NULL DEFAULT 'Open',
  response TEXT NULL,
  responded_by INT NULL,
  responded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(province_id),
  FOREIGN KEY (raised_by) REFERENCES users(user_id),
  FOREIGN KEY (responded_by) REFERENCES users(user_id)
);
