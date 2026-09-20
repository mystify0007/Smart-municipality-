const express = require("express");
const router = express.Router();

const {
  listProvinces, listDistricts, listLocalBodies, listMunicipalities,
} = require("../controllers/locationController");

// All public — these feed registration dropdowns (Citizen, Officer) and the
// Admin bootstrap form, none of which have a logged-in user yet.
router.get("/provinces", listProvinces);
router.get("/districts", listDistricts);
router.get("/local-bodies", listLocalBodies);
router.get("/municipalities", listMunicipalities);

module.exports = router;
