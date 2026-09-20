import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  // Same mechanism as login() above, just hitting the staff-only endpoint.
  // Deliberately reuses the exact same React state update path (setUser)
  // rather than a raw page reload, so the app picks up the new session
  // the same reliable way the citizen login already does.
  async function staffLogin(email, password) {
    const res = await api.post("/auth/staff/login", { email, password });
    const { token, user } = res.data;
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  function logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  }

  // Some updates (e.g. a Citizen completing their profile and setting
  // municipality_id for the first time) change claims baked into the
  // current JWT, issued at login. The endpoint re-signs a fresh token in
  // that case and the caller passes it here, so the app picks up the
  // change immediately instead of needing a full logout/login.
  function refreshSession(token, user) {
    sessionStorage.setItem("token", token);
    sessionStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  }

  return (
    <AuthContext.Provider value={{ user, login, staffLogin, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
