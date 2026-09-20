import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PreferenceToggles from "../../components/PreferenceToggles";

const ROLE_ROUTES = {
  Officer: "/officer/dashboard",
  Admin: "/admin/dashboard",
};

// Uses the SAME AuthContext.staffLogin mechanism as the regular login page
// (updates React state via setUser + SPA navigate), rather than a raw
// localStorage write + full page reload — that's what caused the earlier
// bounce-back bug, since a hard reload can race with React's first render.
export default function StaffLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { staffLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await staffLogin(email, password);
      const destination = ROLE_ROUTES[user.role];
      if (!destination) {
        // Defensive: if a role ever doesn't match Officer/Admin exactly,
        // surface that clearly instead of silently bouncing anywhere.
        setError(`Logged in, but role "${user.role}" has no staff dashboard configured.`);
        setLoading(false);
        return;
      }
      navigate(destination);
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen portal-photo-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-portal-panel border border-portal-panel-border flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-portal-primary" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-portal-text">Smart Municipality Portal</h1>
        <p className="text-xs tracking-widest text-portal-accent mt-1 uppercase">Staff Secure Access</p>
      </div>

      <div className="w-full max-w-sm bg-portal-panel border border-portal-panel-border rounded-xl p-8">
        <h2 className="text-lg font-medium text-portal-text text-center mb-6">Officer / Admin Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Official Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@municipality.gov.np"
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-portal-danger bg-portal-danger/10 border border-portal-danger/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-1">
          <p>
            <a href="/staff/register" className="text-sm text-portal-primary hover:underline">
              Register a new staff account
            </a>
          </p>
          <p>
            <a href="/login" className="text-sm text-portal-muted hover:underline">
              ← Citizen / Business Login
            </a>
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-portal-muted text-center max-w-sm">
        Unauthorized access is strictly prohibited. Secured by National Digital Identity framework.
      </p>
    </div>
  );
}
