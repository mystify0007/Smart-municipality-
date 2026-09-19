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

import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import MyRequests from "./pages/citizen/MyRequests";
import ApplyCertificate from "./pages/citizen/ApplyCertificate";
import TaxPayment from "./pages/citizen/TaxPayment";
import EsewaTaxPayment from "./pages/citizen/EsewaTaxPayment";
import Complaints from "./pages/citizen/Complaints";

import BusinessDashboard from "./pages/business/BusinessDashboard";
import MyProducts from "./pages/business/MyProducts";
import BusinessOrders from "./pages/business/BusinessOrders";

import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerApplications from "./pages/officer/OfficerApplications";
import OfficerComplaints from "./pages/officer/OfficerComplaints";
import OfficerReports from "./pages/officer/OfficerReports";
import OfficerProfile from "./pages/officer/OfficerProfile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import OfficerVerification from "./pages/admin/OfficerVerification";
import CitizenManagement from "./pages/admin/CitizenManagement";
import ApproveBusinesses from "./pages/admin/ApproveBusinesses";
import MunicipalServices from "./pages/admin/MunicipalServices";
import ApplicationManagement from "./pages/admin/ApplicationManagement";
import ComplaintManagement from "./pages/admin/ComplaintManagement";
import MarketplaceManagement from "./pages/admin/MarketplaceManagement";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminReports from "./pages/admin/AdminReports";
import SystemSettings from "./pages/admin/SystemSettings";
import AdminProfile from "./pages/admin/AdminProfile";

import Marketplace from "./pages/marketplace/Marketplace";
import Cart from "./pages/marketplace/Cart";
import MyOrders from "./pages/citizen/MyOrders";
import EsewaPayment from "./pages/payment/EsewaPayment";

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

          {/* Business */}
          <Route path="/business/dashboard" element={
            <ProtectedRoute allowedRoles={["Business"]}><BusinessDashboard /></ProtectedRoute>
          } />
          <Route path="/business/products" element={
            <ProtectedRoute allowedRoles={["Business"]}><MyProducts /></ProtectedRoute>
          } />
          <Route path="/business/orders" element={
            <ProtectedRoute allowedRoles={["Business"]}><BusinessOrders /></ProtectedRoute>
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

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/officers" element={
            <ProtectedRoute allowedRoles={["Admin"]}><OfficerVerification /></ProtectedRoute>
          } />
          <Route path="/admin/citizens" element={
            <ProtectedRoute allowedRoles={["Admin"]}><CitizenManagement /></ProtectedRoute>
          } />
          <Route path="/admin/businesses" element={
            <ProtectedRoute allowedRoles={["Admin"]}><ApproveBusinesses /></ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute allowedRoles={["Admin"]}><MunicipalServices /></ProtectedRoute>
          } />
          <Route path="/admin/applications" element={
            <ProtectedRoute allowedRoles={["Admin"]}><ApplicationManagement /></ProtectedRoute>
          } />
          <Route path="/admin/complaints" element={
            <ProtectedRoute allowedRoles={["Admin"]}><ComplaintManagement /></ProtectedRoute>
          } />
          <Route path="/admin/marketplace" element={
            <ProtectedRoute allowedRoles={["Admin"]}><MarketplaceManagement /></ProtectedRoute>
          } />
          <Route path="/admin/notices" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminNotices /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminReports /></ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={["Admin"]}><SystemSettings /></ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminProfile /></ProtectedRoute>
          } />

          {/* Marketplace — shared between Citizen and Business (as buyer) */}
          <Route path="/marketplace" element={
            <ProtectedRoute allowedRoles={["Citizen", "Business"]}><Marketplace /></ProtectedRoute>
          } />
          <Route path="/cart" element={
            <ProtectedRoute allowedRoles={["Citizen", "Business"]}><Cart /></ProtectedRoute>
          } />
          <Route path="/orders/mine" element={
            <ProtectedRoute allowedRoles={["Citizen", "Business"]}><MyOrders /></ProtectedRoute>
          } />
          <Route path="/payment/esewa/:orderId" element={
            <ProtectedRoute allowedRoles={["Citizen", "Business"]}><EsewaPayment /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
