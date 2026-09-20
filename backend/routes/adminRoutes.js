const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  getMyMunicipalityNotices, createNotice, updateNotice, deleteNotice,
  getCitizens, getCitizenDetail,
  updateUserStatus,
  getAdminProfile, updateAdminProfile,
} = require("../controllers/adminController");

const {
  createOfficer, listOfficers, getOfficerDetail, approveOfficer, rejectOfficer, suspendOfficer, activateOfficer,
} = require("../controllers/officerVerificationController");

const { listServices, createService, updateService, deleteService } = require("../controllers/serviceController");

const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSettings, updateSettings,
} = require("../controllers/settingsController");

const {
  getMyMunicipality, updateMyMunicipality, getMyProvince, getStateOverview,
} = require("../controllers/locationController");

const { adminListApplications, assignApplication } = require("../controllers/certificateController");
const {
  adminListComplaints, assignComplaint, escalateComplaint, closeComplaint,
} = require("../controllers/complaintController");
const { getSystemReports } = require("../controllers/reportsController");

const { verifyToken, requireRole, requireAdminScope } = require("../middleware/authMiddleware");
const {
  createProvinceAdmin, updateProvinceAdminStatus, createMunicipalityAdmin,
} = require("../controllers/authController");
const {
  createEnquiry, listMyEnquiries, listAllEnquiries, respondToEnquiry,
} = require("../controllers/enquiryController");

// Every route below (other than /state, /province-admins*, /province,
// /municipality-admins) is scoped to a Municipality Admin — this file is the
// entire surface of "Full system access" from the access-control spec, but
// only over that Admin's own Municipality. A Province or State Admin's
// token is rejected here outright rather than being allowed to run these
// queries against a NULL municipality_id. Officer never appears in any
// requireRole() call here.

// Dashboard overview
router.get("/stats", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getAdminStats);

// State Admin's own privileges — oversee every Province, create each
// Province's one Admin account, and manage (activate/block) it afterward.
router.get("/state", verifyToken, requireRole("Admin"), requireAdminScope("State"), getStateOverview);
router.post(
  "/province-admins",
  verifyToken,
  requireRole("Admin"),
  requireAdminScope("State"),
  createProvinceAdmin
);
router.patch(
  "/province-admins/:id/status",
  verifyToken,
  requireRole("Admin"),
  requireAdminScope("State"),
  updateProvinceAdminStatus
);
// Enquiries every Province Admin has raised — the State Admin reads and
// responds to all of them, regardless of which Province raised each one.
router.get("/state/enquiries", verifyToken, requireRole("Admin"), requireAdminScope("State"), listAllEnquiries);
router.patch(
  "/state/enquiries/:id/respond",
  verifyToken,
  requireRole("Admin"),
  requireAdminScope("State"),
  respondToEnquiry
);

// Province Admin's own privileges — oversee every Municipality onboarded in
// their Province, onboard a new Local Body by creating its one Municipality
// Admin account, and raise an enquiry to the State Admin when something
// can't be resolved at the Province level.
router.get("/province", verifyToken, requireRole("Admin"), requireAdminScope("Province"), getMyProvince);
router.post(
  "/municipality-admins",
  verifyToken,
  requireRole("Admin"),
  requireAdminScope("Province"),
  createMunicipalityAdmin
);
router.post("/enquiries", verifyToken, requireRole("Admin"), requireAdminScope("Province"), createEnquiry);
router.get("/enquiries", verifyToken, requireRole("Admin"), requireAdminScope("Province"), listMyEnquiries);

// Officer accounts — the Municipality Admin creates them directly (no
// public Officer registration) and is the ONLY place officer_status changes
router.post("/officers", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), createOfficer);
router.get("/officers", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), listOfficers);
router.get("/officers/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getOfficerDetail);
router.patch("/officers/:id/approve", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), approveOfficer);
router.patch("/officers/:id/reject", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), rejectOfficer);
router.patch("/officers/:id/suspend", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), suspendOfficer);
router.patch("/officers/:id/activate", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), activateOfficer);

// Citizen management
router.get("/citizens", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getCitizens);
router.get("/citizens/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getCitizenDetail);

// Generic account activate/deactivate
router.patch("/users/:id/status", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateUserStatus);

// The Admin's own Municipality — Province name+id, District, Local Body, and
// editable contact details
router.get("/municipality", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getMyMunicipality);
router.patch("/municipality", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateMyMunicipality);

// Municipal services
router.get("/services", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), listServices);
router.post("/services", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), createService);
router.patch("/services/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateService);
router.delete("/services/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), deleteService);

// Departments (management view — see also the public GET /api/departments)
router.get("/departments", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), listDepartments);
router.post("/departments", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), createDepartment);
router.patch("/departments/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateDepartment);
router.delete("/departments/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), deleteDepartment);

// System settings
router.get("/settings", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getSettings);
router.patch("/settings", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateSettings);

// Application management
router.get("/applications", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), adminListApplications);
router.patch("/applications/:id/assign", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), assignApplication);

// Complaint management
router.get("/complaints", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), adminListComplaints);
router.patch("/complaints/:id/assign", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), assignComplaint);
router.patch("/complaints/:id/escalate", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), escalateComplaint);
router.patch("/complaints/:id/close", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), closeComplaint);

// Announcements — GET here is the Admin's own Municipality's notices
// (the public, unauthenticated equivalent lives in routes/noticeRoutes.js)
router.get("/notices", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getMyMunicipalityNotices);
router.post("/notices", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), createNotice);
router.patch("/notices/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateNotice);
router.delete("/notices/:id", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), deleteNotice);

// Reports & analytics — system-wide, never exposed to Officer
router.get("/reports", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getSystemReports);

// Admin's own profile
router.get("/profile", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), getAdminProfile);
router.patch("/profile", verifyToken, requireRole("Admin"), requireAdminScope("Municipality"), updateAdminProfile);

module.exports = router;
