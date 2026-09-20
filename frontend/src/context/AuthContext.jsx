import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

function readStoredUser() {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // The axios interceptor reads the token from localStorage fresh on every
  // request, but this state was only read once at mount — so if a second
  // tab on the same origin logs into a different account, localStorage's
  // token/user get overwritten under this tab too, while this tab's React
  // state (and everything gated on it: nav, "Add to Cart", ProtectedRoute)
  // keeps showing the old account. Every request then silently goes out
  // authenticated as the OTHER tab's account and gets rejected, while the
  // UI still looks like the original one is logged in. Following the
  // storage event (fired in every tab but the one that made the change)
  // keeps this tab's identity in step with whichever session is actually
  // live in localStorage.
  useEffect(() => {
    function handleStorage(event) {
      if (event.key === "user" || event.key === "token" || event.key === null) {
        setUser(readStoredUser());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  // Same mechanism as login() above, just hitting the staff-only endpoint.
  // Deliberately reuses the exact same React state update path (setUser)
  // rather than a raw page reload, so the app picks up the new session
  // the same reliable way the citizen/business login already does.
  async function staffLogin(email, password) {
    const res = await api.post("/auth/staff/login", { email, password });
    const { token, user } = res.data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
    return user;
  }

  async function register(payload) {
    const res = await api.post("/auth/register", payload);
    return res.data;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, staffLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
