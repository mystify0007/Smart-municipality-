import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = { full_name: "", email: "", password: "", province_id: "" };

export default function StateDashboard() {
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await api.get("/admin/state");
      setProvinces(res.data.provinces);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOverview(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await api.post("/admin/province-admins", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        province_id: form.province_id,
      });
      setMessage({ type: "success", text: "Province Admin account created." });
      setForm(EMPTY_FORM);
      loadOverview();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to create province admin" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title={t("title.stateOverview")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Create a Province Admin</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Province</label>
              <select
                required value={form.province_id} onChange={(e) => update("province_id", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                <option value="">Select province</option>
                {provinces.map((p) => (
                  <option key={p.province_id} value={p.province_id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Admin Full Name</label>
              <input
                required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Admin Email</label>
                <input
                  type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Password</label>
                <input
                  type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
            >
              {submitting ? "Creating..." : "Create Province Admin"}
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Provinces</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {provinces.map((p) => (
                <li key={p.province_id} className="border-b border-portal-panel-border/50 pb-3">
                  <p className="text-portal-text font-medium">{p.name}</p>
                  <p className="text-xs text-portal-muted">Province ID {p.province_id}</p>
                  <p className="text-xs mt-1">
                    {p.admin_name ? (
                      <span className="text-portal-success">Admin: {p.admin_name} ({p.admin_email})</span>
                    ) : (
                      <span className="text-portal-danger">No admin assigned yet</span>
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
