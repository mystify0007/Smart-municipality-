import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PreferenceToggles from "../components/PreferenceToggles";

const ROLES = ["Citizen", "Business"];

export default function Register() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    role: "Citizen", address: "", citizenship_no: "",
    // business-only fields
    business_name: "", owner_name: "", business_type: "", pan_number: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), res.message?.includes("Awaiting") ? 2500 : 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const isBusiness = form.role === "Business";

  return (
    <div className="min-h-screen bg-portal-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />
      <div className="w-full max-w-md bg-portal-panel border border-portal-panel-border rounded-xl p-8">
        <h2 className="text-lg font-medium text-portal-text text-center mb-1">{t("register.heading")}</h2>
        <p className="text-sm text-portal-muted text-center mb-6">Smart Municipality Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">{t("register.iAmA")}</label>
            <select
              value={form.role} onChange={(e) => update("role", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">{t("register.fullName")}</label>
            <input
              required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Email</label>
            <input
              type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">{t("register.phone")}</label>
              <input
                value={form.phone} onChange={(e) => update("phone", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">{t("login.password")}</label>
              <input
                type="password" required value={form.password} onChange={(e) => update("password", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">{t("register.address")}</label>
            <input
              value={form.address} onChange={(e) => update("address", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          {!isBusiness && (
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Citizenship No. (optional)</label>
              <input
                value={form.citizenship_no} onChange={(e) => update("citizenship_no", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
          )}

          {isBusiness && (
            <div className="border-t border-portal-panel-border pt-4 space-y-4">
              <p className="text-xs text-portal-accent uppercase tracking-wide">Business Details</p>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Business Name</label>
                <input
                  required value={form.business_name} onChange={(e) => update("business_name", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Owner Name</label>
                <input
                  required value={form.owner_name} onChange={(e) => update("owner_name", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-portal-muted mb-1.5">Business Type</label>
                  <input
                    value={form.business_type} onChange={(e) => update("business_type", e.target.value)}
                    placeholder="e.g. Grocery"
                    className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm text-portal-muted mb-1.5">PAN Number</label>
                  <input
                    value={form.pan_number} onChange={(e) => update("pan_number", e.target.value)}
                    className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                  />
                </div>
              </div>
              <p className="text-xs text-portal-muted">
                Your business will need Admin approval before you can list products.
              </p>
            </div>
          )}

          {error && (
            <p className="text-sm text-portal-danger bg-portal-danger/10 border border-portal-danger/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-portal-success bg-portal-success/10 border border-portal-success/30 rounded-lg px-3 py-2">
              Account created! Redirecting to login...
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? t("action.loading") : t("action.register")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-portal-muted">{t("register.alreadyHave")} </span>
          <a href="/login" className="text-sm text-portal-primary hover:underline">{t("register.signIn")}</a>
        </div>

        <div className="mt-3 text-center">
          <a href="/staff/login" className="text-xs text-portal-muted hover:underline">
            Officer / Admin? Use Staff Login →
          </a>
        </div>
      </div>
    </div>
  );
}
