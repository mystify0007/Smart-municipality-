import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DEFAULT_ROUTE_BY_ROLE = {
  Citizen: "/citizen/dashboard",
  Officer: "/officer/dashboard",
  Admin: "/admin/dashboard",
};

// Admin has three scopes (State oversees Provinces, Province oversees
// Municipalities, Municipality runs one day-to-day) that live under separate
// route trees — a role match alone isn't enough to know which dashboard an
// Admin belongs on.
export function defaultRouteFor(user) {
  if (user?.role === "Admin" && user.admin_scope === "State") {
    return "/admin/state/dashboard";
  }
  if (user?.role === "Admin" && user.admin_scope === "Province") {
    return "/admin/province/dashboard";
  }
  return DEFAULT_ROUTE_BY_ROLE[user?.role] || "/login";
}

export default function ProtectedRoute({ children, allowedRoles, allowedAdminScopes }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Logged in, just not allowed on THIS route (e.g. an Officer account on a
  // Citizen-only page) — send them to their own dashboard, not the login
  // screen. Bouncing an authenticated user to /login on a role mismatch
  // reads as "you got logged out", which isn't what happened.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user)} replace />;
  }

  // A Province Admin and a Municipality Admin share role "Admin" but hit
  // completely disjoint API routes (see backend requireAdminScope) — reject
  // the wrong scope here too, rather than letting the page render and then
  // fail every API call it makes with a 403.
  if (allowedAdminScopes && user.role === "Admin" && !allowedAdminScopes.includes(user.admin_scope)) {
    return <Navigate to={defaultRouteFor(user)} replace />;
  }

  return children;
}
