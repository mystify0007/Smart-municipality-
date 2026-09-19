-- Run this once in phpMyAdmin (Database: smart_municipality_portal -> SQL tab)
-- Lets an officer write a response back to the citizen when handling a complaint.
ALTER TABLE complaints
  ADD COLUMN officer_response TEXT NULL AFTER status;
