import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEFAULT_ROUTE_BY_ROLE = {
  Citizen: "/citizen/dashboard",
  Officer: "/officer/dashboard",
  Admin: "/admin/dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Logged in, just not allowed on THIS route (e.g. an Officer account on a
  // Citizen-only page) — send them to their own dashboard, not the login
  // screen. Bouncing an authenticated user to /login on a role mismatch
  // reads as "you got logged out", which isn't what happened.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={DEFAULT_ROUTE_BY_ROLE[user.role] || "/login"} replace />;
  }

  return children;
}
