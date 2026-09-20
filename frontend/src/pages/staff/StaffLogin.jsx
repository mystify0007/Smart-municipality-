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
        <div className="w-12 h-12 rounded-full bg-[#101a30] border border-slate-700 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">Smart Municipality Portal</h1>
        <p className="text-xs tracking-widest text-amber-500 mt-1 uppercase">Staff Secure Access</p>
      </div>

      <div className="w-full max-w-sm bg-[#101a30] border border-slate-700 rounded-xl p-8">
        <h2 className="text-lg font-medium text-slate-100 text-center mb-6">Officer / Admin Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Official Email</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@municipality.gov.np"
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Authenticating..." : "Secure Login"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-1">
          <p>
            <a href="/staff/register" className="text-sm text-blue-400 hover:underline">
              Register a new staff account
            </a>
          </p>
          <p>
            <a href="/login" className="text-sm text-slate-500 hover:underline">
              ← Citizen Login
            </a>
          </p>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center max-w-sm">
        Unauthorized access is strictly prohibited. Secured by National Digital Identity framework.
      </p>
    </div>
  );
}
