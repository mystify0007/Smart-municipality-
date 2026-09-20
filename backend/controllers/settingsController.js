// controllers/settingsController.js
// departments: department_id, name, municipality_id, description, created_at
// system_settings: setting_key (PK), setting_value, updated_at
const { pool } = require("../config/db");

// GET /api/departments?municipality_id= — public (feeds the department
// dropdown on the Officer registration form, before login) — or, when
// called by a logged-in Admin (GET /api/admin/departments), scoped to their
// own Municipality automatically instead.
async function listDepartments(req, res) {
  try {
    const municipalityId = req.user ? req.user.municipality_id : req.query.municipality_id;
    if (!municipalityId) {
      return res.status(400).json({ success: false, error: "municipality_id is required" });
    }
    const [rows] = await pool.query(
      "SELECT * FROM departments WHERE municipality_id = ? ORDER BY name ASC",
      [municipalityId]
    );
    res.json({ success: true, departments: rows });
  } catch (err) {
    console.error("List departments error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch departments" });
  }
}

// POST /api/admin/departments
async function createDepartment(req, res) {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: "name is required" });
    }

    const [result] = await pool.query(
      "INSERT INTO departments (name, municipality_id, description) VALUES (?, ?, ?)",
      [name, req.user.municipality_id, description || null]
    );
    res.status(201).json({ success: true, department_id: result.insertId });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, error: "A department with this name already exists" });
    }
    console.error("Create department error:", err);
    res.status(500).json({ success: false, error: "Failed to create department" });
  }
}

// PATCH /api/admin/departments/:id
async function updateDepartment(req, res) {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM departments WHERE department_id = ? AND municipality_id = ?",
      [id, req.user.municipality_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Department not found" });
    }

    await pool.query(
      "UPDATE departments SET name = ?, description = ? WHERE department_id = ?",
      [name || existing[0].name, description ?? existing[0].description, id]
    );

    res.json({ success: true, message: "Department updated" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ success: false, error: "A department with this name already exists" });
    }
    console.error("Update department error:", err);
    res.status(500).json({ success: false, error: "Failed to update department" });
  }
}

// DELETE /api/admin/departments/:id
async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      "DELETE FROM departments WHERE department_id = ? AND municipality_id = ?",
      [id, req.user.municipality_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Department not found" });
    }
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    console.error("Delete department error:", err);
    res.status(500).json({ success: false, error: "Failed to delete department" });
  }
}

// GET /api/admin/settings
async function getSettings(req, res) {
  try {
    const [rows] = await pool.query("SELECT setting_key, setting_value FROM system_settings");
    const settings = {};
    rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    res.json({ success: true, settings });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch settings" });
  }
}

// PATCH /api/admin/settings — body: a flat { key: value, ... } map. Any key
// is accepted, so the Admin can add municipality info, notification toggles,
// or other config without a schema change.
async function updateSettings(req, res) {
  try {
    const entries = Object.entries(req.body || {});
    if (entries.length === 0) {
      return res.status(400).json({ success: false, error: "No settings provided" });
    }

    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, String(value)]
      );
    }

    res.json({ success: true, message: "Settings updated" });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ success: false, error: "Failed to update settings" });
  }
}

module.exports = {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSettings, updateSettings,
};
