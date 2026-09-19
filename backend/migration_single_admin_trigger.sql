-- OPTIONAL defense-in-depth: blocks a second Admin row at the database
-- level, on top of the check already in backend/controllers/authController.js
-- (adminBootstrap). The app works correctly without this — skip it if it
-- gives you trouble, nothing else depends on it.
--
-- Do NOT paste this file into phpMyAdmin's SQL tab as a script — its
-- DELIMITER handling for CREATE TRIGGER is unreliable across
-- phpMyAdmin/MariaDB versions and will throw a syntax error partway
-- through the statement. Instead, use phpMyAdmin's own Triggers UI, which
-- needs no DELIMITER at all because it builds the CREATE TRIGGER statement
-- itself from separate form fields:
--
--   1. Open the `users` table -> "Triggers" tab (or "Structure" -> "Triggers"
--      depending on your phpMyAdmin version) -> "Add trigger".
--   2. First trigger:
--        Name:  trg_single_admin_insert
--        Time:  BEFORE
--        Event: INSERT
--        Definition (paste ONLY this — no CREATE TRIGGER/BEGIN/END wrapper):
--
--          IF NEW.role = 'Admin' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin') >= 1 THEN
--            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one Admin account is allowed in the system.';
--          END IF;
--
--   3. Second trigger:
--        Name:  trg_single_admin_update
--        Time:  BEFORE
--        Event: UPDATE
--        Definition:
--
--          IF NEW.role = 'Admin' AND OLD.role <> 'Admin' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin') >= 1 THEN
--            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one Admin account is allowed in the system.';
--          END IF;
--
-- The two statements below are the equivalent full SQL, kept only as
-- reference for a real MySQL client (mysql CLI, MySQL Workbench, DBeaver,
-- etc.) where DELIMITER works properly — not for phpMyAdmin's SQL tab.

DELIMITER $$

CREATE TRIGGER trg_single_admin_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin') >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one Admin account is allowed in the system.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND OLD.role <> 'Admin' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin') >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Only one Admin account is allowed in the system.';
  END IF;
END$$

DELIMITER ;
