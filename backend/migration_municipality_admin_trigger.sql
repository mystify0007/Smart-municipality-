-- OPTIONAL defense-in-depth: blocks a second Admin at the SAME level of
-- Nepal's three government layers — a second State Admin overall, a second
-- Admin for the SAME Province, or a second Admin for the SAME Municipality —
-- at the database level, on top of the checks already in
-- backend/controllers/authController.js (adminBootstrap / createProvinceAdmin /
-- createMunicipalityAdmin). The app works correctly without this — skip it
-- if it gives you trouble, nothing else depends on it.
--
-- Do NOT paste this file into phpMyAdmin's SQL tab as a script — its
-- DELIMITER handling for CREATE TRIGGER is unreliable across
-- phpMyAdmin/MariaDB versions and will throw a syntax error partway
-- through the statement. Instead, use phpMyAdmin's own Triggers UI, which
-- needs no DELIMITER at all because it builds the CREATE TRIGGER statement
-- itself from separate form fields:
--
--   Open the `users` table -> "Triggers" tab (or "Structure" -> "Triggers"
--   depending on your phpMyAdmin version) -> "Add trigger", and create all
--   SIX triggers below. For each, the Definition box gets ONLY the
--   IF ... END IF; body shown — no CREATE TRIGGER/BEGIN/END wrapper.
--
--   1. Name: trg_single_admin_state_insert   | Time: BEFORE | Event: INSERT
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'State' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'State') >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system already has a State Admin account.';
--        END IF;
--
--   2. Name: trg_single_admin_state_update   | Time: BEFORE | Event: UPDATE
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'State' AND OLD.admin_scope <> 'State' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'State') >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system already has a State Admin account.';
--        END IF;
--
--   3. Name: trg_single_admin_per_province_insert   | Time: BEFORE | Event: INSERT
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'Province' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Province' AND province_id = NEW.province_id) >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This province already has an Admin account.';
--        END IF;
--
--   4. Name: trg_single_admin_per_province_update   | Time: BEFORE | Event: UPDATE
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'Province' AND (OLD.admin_scope <> 'Province' OR OLD.province_id <> NEW.province_id) AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Province' AND province_id = NEW.province_id) >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This province already has an Admin account.';
--        END IF;
--
--   5. Name: trg_single_admin_per_municipality_insert   | Time: BEFORE | Event: INSERT
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'Municipality' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Municipality' AND municipality_id = NEW.municipality_id) >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This municipality already has an Admin account.';
--        END IF;
--
--   6. Name: trg_single_admin_per_municipality_update   | Time: BEFORE | Event: UPDATE
--
--        IF NEW.role = 'Admin' AND NEW.admin_scope = 'Municipality' AND (OLD.admin_scope <> 'Municipality' OR OLD.municipality_id <> NEW.municipality_id) AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Municipality' AND municipality_id = NEW.municipality_id) >= 1 THEN
--          SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This municipality already has an Admin account.';
--        END IF;
--
-- The statements below are the equivalent full SQL, kept only as reference
-- for a real MySQL client (mysql CLI, MySQL Workbench, DBeaver, etc.) where
-- DELIMITER works properly — not for phpMyAdmin's SQL tab.

DELIMITER $$

CREATE TRIGGER trg_single_admin_state_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'State' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'State') >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system already has a State Admin account.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_state_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'State' AND OLD.admin_scope <> 'State' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'State') >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The system already has a State Admin account.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_per_province_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'Province' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Province' AND province_id = NEW.province_id) >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This province already has an Admin account.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_per_province_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'Province' AND (OLD.admin_scope <> 'Province' OR OLD.province_id <> NEW.province_id) AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Province' AND province_id = NEW.province_id) >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This province already has an Admin account.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_per_municipality_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'Municipality' AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Municipality' AND municipality_id = NEW.municipality_id) >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This municipality already has an Admin account.';
  END IF;
END$$

CREATE TRIGGER trg_single_admin_per_municipality_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.role = 'Admin' AND NEW.admin_scope = 'Municipality' AND (OLD.admin_scope <> 'Municipality' OR OLD.municipality_id <> NEW.municipality_id) AND (SELECT COUNT(*) FROM users WHERE role = 'Admin' AND admin_scope = 'Municipality' AND municipality_id = NEW.municipality_id) >= 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This municipality already has an Admin account.';
  END IF;
END$$

DELIMITER ;
