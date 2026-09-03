import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'

import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Marketplace from './pages/Marketplace.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import OfficerDashboard from './pages/OfficerDashboard.jsx'
import BusinessDashboard from './pages/BusinessDashboard.jsx'
import CitizenDashboard from './pages/CitizenDashboard.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/marketplace" element={<Marketplace />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/officer"
        element={
          <ProtectedRoute allowedRoles={['officer']}>
            <OfficerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/business"
        element={
          <ProtectedRoute allowedRoles={['business']}>
            <BusinessDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
