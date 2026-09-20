// controllers/locationController.js
// Nepal's official administrative hierarchy — Province -> District -> Local
// Body — plus the subset of Local Bodies actually onboarded onto this
// platform (a "Municipality"). Everything here is read-only reference data;
// the only place a new Municipality row is ever created is
// authController.adminBootstrap.
const { pool } = require("../config/db");

// GET /api/locations/provinces — all 7 provinces
async function listProvinces(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM provinces ORDER BY province_id ASC");
    res.json({ success: true, provinces: rows });
  } catch (err) {
    console.error("List provinces error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch provinces" });
  }
}

// GET /api/locations/districts?province_id= — all 77 districts, optionally
// filtered to one province
async function listDistricts(req, res) {
  try {
    const { province_id } = req.query;
    let sql = "SELECT * FROM districts";
    const params = [];
    if (province_id) {
      sql += " WHERE province_id = ?";
      params.push(province_id);
    }
    sql += " ORDER BY name ASC";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, districts: rows });
  } catch (err) {
    console.error("List districts error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch districts" });
  }
}

// GET /api/locations/local-bodies?district_id= — all 753 local bodies,
// optionally filtered to one district, each with its type name
async function listLocalBodies(req, res) {
  try {
    const { district_id } = req.query;
    let sql = `
      SELECT lb.*, t.name AS type_name
      FROM local_bodies lb
      JOIN local_level_types t ON lb.local_level_type_id = t.local_level_type_id
    `;
    const params = [];
    if (district_id) {
      sql += " WHERE lb.district_id = ?";
      params.push(district_id);
    }
    sql += " ORDER BY lb.name ASC";
    const [rows] = await pool.query(sql, params);
    res.json({ success: true, local_bodies: rows });
  } catch (err) {
    console.error("List local bodies error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch local bodies" });
  }
}

// GET /api/locations/municipalities — every Local Body actually onboarded
// onto this platform, with full province/district/type context. Feeds the
// Citizen and Officer registration dropdowns — you can only register under a
// Municipality that already exists (and therefore already has an Admin).
async function listMunicipalities(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT m.municipality_id, m.office_address, m.contact_email, m.contact_phone,
             lb.local_body_id, lb.name AS local_body_name, t.name AS type_name,
             d.district_id, d.name AS district_name,
             p.province_id, p.name AS province_name
      FROM municipalities m
      JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
      JOIN local_level_types t ON lb.local_level_type_id = t.local_level_type_id
      JOIN districts d ON lb.district_id = d.district_id
      JOIN provinces p ON d.province_id = p.province_id
      ORDER BY p.name ASC, d.name ASC, lb.name ASC
    `);
    res.json({ success: true, municipalities: rows });
  } catch (err) {
    console.error("List municipalities error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch municipalities" });
  }
}

// GET /api/admin/municipality — the calling Admin's own Municipality, with
// full Province/District/Local Body names AND ids (Province name + Province
// id must both be visible here).
async function getMyMunicipality(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT m.municipality_id, m.office_address, m.contact_email, m.contact_phone, m.created_at,
              lb.local_body_id, lb.name AS local_body_name, lb.nepali_name AS local_body_nepali_name,
              t.local_level_type_id, t.name AS type_name,
              d.district_id, d.name AS district_name,
              p.province_id, p.name AS province_name, p.nepali_name AS province_nepali_name
       FROM municipalities m
       JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
       JOIN local_level_types t ON lb.local_level_type_id = t.local_level_type_id
       JOIN districts d ON lb.district_id = d.district_id
       JOIN provinces p ON d.province_id = p.province_id
       WHERE m.municipality_id = ?`,
      [req.user.municipality_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "Municipality not found" });
    }
    res.json({ success: true, municipality: rows[0] });
  } catch (err) {
    console.error("Get my municipality error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch municipality" });
  }
}

// PATCH /api/admin/municipality — Admin edits their own Municipality's
// contact details. The Local Body itself (name/district/province) is fixed —
// it is Nepal's actual administrative identity, not something an Admin edits.
async function updateMyMunicipality(req, res) {
  try {
    const { office_address, contact_email, contact_phone } = req.body;

    const [existing] = await pool.query(
      "SELECT * FROM municipalities WHERE municipality_id = ?",
      [req.user.municipality_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: "Municipality not found" });
    }

    await pool.query(
      "UPDATE municipalities SET office_address = ?, contact_email = ?, contact_phone = ? WHERE municipality_id = ?",
      [
        office_address ?? existing[0].office_address,
        contact_email ?? existing[0].contact_email,
        contact_phone ?? existing[0].contact_phone,
        req.user.municipality_id,
      ]
    );

    res.json({ success: true, message: "Municipality details updated" });
  } catch (err) {
    console.error("Update my municipality error:", err);
    res.status(500).json({ success: false, error: "Failed to update municipality" });
  }
}

// GET /api/admin/province — the calling Province Admin's own Province, with
// every Municipality onboarded within it and that Municipality's Admin (if
// one has been created yet) — feeds the Province Admin's oversight dashboard.
async function getMyProvince(req, res) {
  try {
    const [provinceRows] = await pool.query(
      "SELECT province_id, name, nepali_name FROM provinces WHERE province_id = ?",
      [req.user.province_id]
    );
    if (provinceRows.length === 0) {
      return res.status(404).json({ success: false, error: "Province not found" });
    }

    const [municipalityRows] = await pool.query(
      `SELECT m.municipality_id, m.office_address, m.contact_email, m.contact_phone,
              lb.local_body_id, lb.name AS local_body_name, t.name AS type_name,
              d.district_id, d.name AS district_name,
              a.user_id AS admin_user_id, a.full_name AS admin_name, a.email AS admin_email
       FROM municipalities m
       JOIN local_bodies lb ON m.local_body_id = lb.local_body_id
       JOIN local_level_types t ON lb.local_level_type_id = t.local_level_type_id
       JOIN districts d ON lb.district_id = d.district_id
       LEFT JOIN users a
         ON a.municipality_id = m.municipality_id AND a.role = 'Admin' AND a.admin_scope = 'Municipality'
       WHERE d.province_id = ?
       ORDER BY d.name ASC, lb.name ASC`,
      [req.user.province_id]
    );

    res.json({ success: true, province: provinceRows[0], municipalities: municipalityRows });
  } catch (err) {
    console.error("Get my province error:", err);
    res.status(500).json({ success: false, error: "Failed to fetch province overview" });
  }
}

module.exports = {
  listProvinces, listDistricts, listLocalBodies, listMunicipalities,
  getMyMunicipality, updateMyMunicipality, getMyProvince,
};
