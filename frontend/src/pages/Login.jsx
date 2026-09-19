import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PreferenceToggles from "../components/PreferenceToggles";

const ROLE_ROUTES = {
  Citizen: "/citizen/dashboard",
  Business: "/business/dashboard",
  Officer: "/officer/dashboard",
  Admin: "/admin/dashboard",
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_ROUTES[user.role] || "/");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-portal-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-portal-panel border border-portal-panel-border flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-portal-primary" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-portal-text">{t("app.name")}</h1>
        <p className="text-xs tracking-widest text-portal-accent mt-1 uppercase">{t("login.secureAccess")}</p>
      </div>

      <div className="w-full max-w-sm bg-portal-panel border border-portal-panel-border rounded-xl p-8">
        <h2 className="text-lg font-medium text-portal-text text-center mb-6">{t("login.heading")}</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5" htmlFor="email">{t("login.email")}</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5" htmlFor="password">{t("login.password")}</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 pr-10 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
              <button
                type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-portal-muted hover:text-portal-text text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
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
            {loading ? t("action.loading") : t("login.secureLogin")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-portal-muted">{t("login.noAccount")} </span>
          <a href="/register" className="text-sm text-portal-primary hover:underline">{t("action.register")}</a>
        </div>

        <div className="mt-3 text-center">
          <a href="/staff/login" className="text-xs text-portal-muted hover:underline">
            Officer / Admin? Use Staff Login →
          </a>
        </div>
      </div>

      <p className="mt-8 text-xs text-portal-muted text-center max-w-sm">
        Unauthorized access is strictly prohibited.<br />© 2026 {t("app.name")}.
      </p>
    </div>
  );
}
