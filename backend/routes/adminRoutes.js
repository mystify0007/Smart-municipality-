const express = require("express");
const router = express.Router();

const {
  getAdminStats,
  createNotice, updateNotice, deleteNotice,
  getCitizens, getCitizenDetail,
  getBusinesses, getBusinessDetail, updateBusinessStatus,
  updateUserStatus,
  getAdminProfile, updateAdminProfile,
} = require("../controllers/adminController");

const {
  listOfficers, getOfficerDetail, approveOfficer, rejectOfficer, suspendOfficer, activateOfficer,
} = require("../controllers/officerVerificationController");

const { listServices, createService, updateService, deleteService } = require("../controllers/serviceController");

const {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  getSettings, updateSettings,
} = require("../controllers/settingsController");

const { adminListApplications, assignApplication } = require("../controllers/certificateController");
const {
  adminListComplaints, assignComplaint, escalateComplaint, closeComplaint,
} = require("../controllers/complaintController");
const {
  adminListProducts, removeProduct, restoreProduct, adminListOrders,
} = require("../controllers/marketplaceAdminController");
const { getSystemReports } = require("../controllers/reportsController");

const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Every route below is Admin-only — this file is the entire surface of
// "Full system access" from the access-control spec. Officer never appears
// in any requireRole() call here.

// Dashboard overview
router.get("/stats", verifyToken, requireRole("Admin"), getAdminStats);

// Officer verification — the ONLY place officer_status can change
router.get("/officers", verifyToken, requireRole("Admin"), listOfficers);
router.get("/officers/:id", verifyToken, requireRole("Admin"), getOfficerDetail);
router.patch("/officers/:id/approve", verifyToken, requireRole("Admin"), approveOfficer);
router.patch("/officers/:id/reject", verifyToken, requireRole("Admin"), rejectOfficer);
router.patch("/officers/:id/suspend", verifyToken, requireRole("Admin"), suspendOfficer);
router.patch("/officers/:id/activate", verifyToken, requireRole("Admin"), activateOfficer);

// Citizen management
router.get("/citizens", verifyToken, requireRole("Admin"), getCitizens);
router.get("/citizens/:id", verifyToken, requireRole("Admin"), getCitizenDetail);

// Business management
router.get("/businesses", verifyToken, requireRole("Admin"), getBusinesses);
router.get("/businesses/:id", verifyToken, requireRole("Admin"), getBusinessDetail);
router.patch("/businesses/:id", verifyToken, requireRole("Admin"), updateBusinessStatus);

// Generic account activate/deactivate (citizens and businesses)
router.patch("/users/:id/status", verifyToken, requireRole("Admin"), updateUserStatus);

// Municipal services
router.get("/services", verifyToken, requireRole("Admin"), listServices);
router.post("/services", verifyToken, requireRole("Admin"), createService);
router.patch("/services/:id", verifyToken, requireRole("Admin"), updateService);
router.delete("/services/:id", verifyToken, requireRole("Admin"), deleteService);

// Departments (management view — see also the public GET /api/departments)
router.get("/departments", verifyToken, requireRole("Admin"), listDepartments);
router.post("/departments", verifyToken, requireRole("Admin"), createDepartment);
router.patch("/departments/:id", verifyToken, requireRole("Admin"), updateDepartment);
router.delete("/departments/:id", verifyToken, requireRole("Admin"), deleteDepartment);

// System settings
router.get("/settings", verifyToken, requireRole("Admin"), getSettings);
router.patch("/settings", verifyToken, requireRole("Admin"), updateSettings);

// Application management
router.get("/applications", verifyToken, requireRole("Admin"), adminListApplications);
router.patch("/applications/:id/assign", verifyToken, requireRole("Admin"), assignApplication);

// Complaint management
router.get("/complaints", verifyToken, requireRole("Admin"), adminListComplaints);
router.patch("/complaints/:id/assign", verifyToken, requireRole("Admin"), assignComplaint);
router.patch("/complaints/:id/escalate", verifyToken, requireRole("Admin"), escalateComplaint);
router.patch("/complaints/:id/close", verifyToken, requireRole("Admin"), closeComplaint);

// Marketplace oversight
router.get("/marketplace/products", verifyToken, requireRole("Admin"), adminListProducts);
router.patch("/marketplace/products/:id/remove", verifyToken, requireRole("Admin"), removeProduct);
router.patch("/marketplace/products/:id/restore", verifyToken, requireRole("Admin"), restoreProduct);
router.get("/marketplace/orders", verifyToken, requireRole("Admin"), adminListOrders);

// Announcements (GET is public — see routes/noticeRoutes.js)
router.post("/notices", verifyToken, requireRole("Admin"), createNotice);
router.patch("/notices/:id", verifyToken, requireRole("Admin"), updateNotice);
router.delete("/notices/:id", verifyToken, requireRole("Admin"), deleteNotice);

// Reports & analytics — system-wide, never exposed to Officer
router.get("/reports", verifyToken, requireRole("Admin"), getSystemReports);

// Admin's own profile
router.get("/profile", verifyToken, requireRole("Admin"), getAdminProfile);
router.patch("/profile", verifyToken, requireRole("Admin"), updateAdminProfile);

module.exports = router;
