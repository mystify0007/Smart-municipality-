import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import HomePage from "./pages/HomePage";
import PublicNotices from "./pages/PublicNotices";
import StaffLogin from "./pages/staff/StaffLogin";
import StaffRegister from "./pages/staff/StaffRegister";
import OfficerLogin from "./pages/officer/OfficerLogin";
import MunicipalityAdminLogin from "./pages/admin/MunicipalityAdminLogin";
import ProvinceAdminLogin from "./pages/admin/ProvinceAdminLogin";
import StateAdminLogin from "./pages/admin/StateAdminLogin";

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import MyRequests from "./pages/citizen/MyRequests";
import ApplyCertificate from "./pages/citizen/ApplyCertificate";
import TaxPayment from "./pages/citizen/TaxPayment";
import EsewaTaxPayment from "./pages/citizen/EsewaTaxPayment";
import Complaints from "./pages/citizen/Complaints";

import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerApplications from "./pages/officer/OfficerApplications";
import OfficerComplaints from "./pages/officer/OfficerComplaints";
import OfficerReports from "./pages/officer/OfficerReports";
import OfficerProfile from "./pages/officer/OfficerProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StateDashboard from "./pages/admin/StateDashboard";
import ProvinceDashboard from "./pages/admin/ProvinceDashboard";
import OfficerVerification from "./pages/admin/OfficerVerification";
import CitizenManagement from "./pages/admin/CitizenManagement";
import MunicipalServices from "./pages/admin/MunicipalServices";
import ApplicationManagement from "./pages/admin/ApplicationManagement";
import ComplaintManagement from "./pages/admin/ComplaintManagement";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminReports from "./pages/admin/AdminReports";
import SystemSettings from "./pages/admin/SystemSettings";
import AdminProfile from "./pages/admin/AdminProfile";

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/notices" element={<PublicNotices />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/register" element={<StaffRegister />} />
          <Route path="/officer/login" element={<OfficerLogin />} />
          <Route path="/admin/login" element={<MunicipalityAdminLogin />} />
          <Route path="/admin/province/login" element={<ProvinceAdminLogin />} />
          <Route path="/admin/state/login" element={<StateAdminLogin />} />

          {/* Citizen */}
          <Route path="/citizen/dashboard" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><CitizenDashboard /></ProtectedRoute>
          } />
          <Route path="/citizen/requests" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><MyRequests /></ProtectedRoute>
          } />
          <Route path="/citizen/apply" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><ApplyCertificate /></ProtectedRoute>
          } />
          <Route path="/citizen/tax" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><TaxPayment /></ProtectedRoute>
          } />
          <Route path="/citizen/tax/esewa/:paymentId" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><EsewaTaxPayment /></ProtectedRoute>
          } />
          <Route path="/citizen/complaints" element={
            <ProtectedRoute allowedRoles={["Citizen"]}><Complaints /></ProtectedRoute>
          } />

          {/* Officer */}
          <Route path="/officer/dashboard" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerDashboard /></ProtectedRoute>
          } />
          <Route path="/officer/applications" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerApplications /></ProtectedRoute>
          } />
          <Route path="/officer/complaints" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerComplaints /></ProtectedRoute>
          } />
          <Route path="/officer/reports" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerReports /></ProtectedRoute>
          } />
          <Route path="/officer/profile" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerProfile /></ProtectedRoute>
          } />

          {/* State Admin — oversees every Province */}
          <Route path="/admin/state/dashboard" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["State"]}><StateDashboard /></ProtectedRoute>
          } />

          {/* Province Admin — oversees every Municipality in one Province */}
          <Route path="/admin/province/dashboard" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Province"]}><ProvinceDashboard /></ProtectedRoute>
          } />

          {/* Municipality Admin — runs one Municipality day to day */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/officers" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><OfficerVerification /></ProtectedRoute>
          } />
          <Route path="/admin/citizens" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><CitizenManagement /></ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><MunicipalServices /></ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><ApplicationManagement /></ProtectedRoute>
          } />
          <Route path="/admin/complaints" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><ComplaintManagement /></ProtectedRoute>
          } />
          <Route path="/admin/notices" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><AdminNotices /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><AdminReports /></ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><SystemSettings /></ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={["Admin"]} allowedAdminScopes={["Municipality"]}><AdminProfile /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
