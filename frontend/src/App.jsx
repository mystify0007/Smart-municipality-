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

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNotices from "./pages/admin/AdminNotices";
import ApproveBusinesses from "./pages/admin/ApproveBusinesses";

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
          <Route path="/officer/queue" element={
            <ProtectedRoute allowedRoles={["Officer"]}><OfficerDashboard /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/notices" element={
            <ProtectedRoute allowedRoles={["Admin"]}><AdminNotices /></ProtectedRoute>
          } />
          <Route path="/admin/businesses" element={
            <ProtectedRoute allowedRoles={["Admin"]}><ApproveBusinesses /></ProtectedRoute>
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
