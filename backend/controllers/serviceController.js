// controllers/serviceController.js
// municipal_services: service_id, name, description, required_documents,
//                      fee, department_id, assigned_officer_id, is_active, created_at
const { pool } = require("../config/db");

// GET /api/admin/services
async function listServices(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, d.name AS department_name, u.full_name AS officer_name
      FROM municipal_services s
      LEFT JOIN departments d ON s.department_id = d.department_id
      LEFT JOIN users u ON s.assigned_officer_id = u.user_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, services: rows });
  } catch (err) {
    console.error("List services error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch services" });
  }
}

// POST /api/admin/services
async function createService(req, res) {
  try {
    const { name, description, required_documents, fee, department_id, assigned_officer_id } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "name is required" });
    }

    const [result] = await pool.query(
      `INSERT INTO municipal_services (name, description, required_documents, fee, department_id, assigned_officer_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, description || null, required_documents || null, fee || 0, department_id || null, assigned_officer_id || null]
    );

    res.status(201).json({ success: true, service_id: result.insertId });
  } catch (err) {
    console.error("Create service error:", err);
    res.status(500).json({ success: false, error: "Failed to create service" });
  }
}

// PATCH /api/admin/services/:id — edit, or flip is_active to deactivate/reactivate
async function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, description, required_documents, fee, department_id, assigned_officer_id, is_active } = req.body;

    const [existing] = await pool.query("SELECT * FROM municipal_services WHERE service_id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }
    const current = existing[0];

    await pool.query(
      `UPDATE municipal_services
       SET name = ?, description = ?, required_documents = ?, fee = ?,
           department_id = ?, assigned_officer_id = ?, is_active = ?
       WHERE service_id = ?`,
      [
        name || current.name,
        description ?? current.description,
        required_documents ?? current.required_documents,
        fee ?? current.fee,
        department_id ?? current.department_id,
        assigned_officer_id ?? current.assigned_officer_id,
        typeof is_active === "boolean" ? (is_active ? 1 : 0) : current.is_active,
        id,
      ]
    );

    res.json({ success: true, message: "Service updated" });
  } catch (err) {
    console.error("Update service error:", err);
    res.status(500).json({ success: false, error: "Failed to update service" });
  }
}

// DELETE /api/admin/services/:id
async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM municipal_services WHERE service_id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Service not found" });
    }
    res.json({ success: true, message: "Service deleted" });
  } catch (err) {
    console.error("Delete service error:", err);
    res.status(500).json({ success: false, error: "Failed to delete service" });
  }
}

module.exports = { listServices, createService, updateService, deleteService };
