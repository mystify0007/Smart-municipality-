import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = {
  full_name: "", email: "", password: "",
  district_id: "", local_body_id: "",
  office_address: "", contact_email: "", contact_phone: "",
};

export default function ProvinceDashboard() {
  const { t } = useLanguage();
  const [province, setProvince] = useState(null);
  const [municipalities, setMunicipalities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [localBodies, setLocalBodies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await api.get("/admin/province");
      setProvince(res.data.province);
      setMunicipalities(res.data.municipalities);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOverview(); }, []);

  useEffect(() => {
    api.get("/locations/districts?province_id=" + province?.province_id)
      .then((res) => setDistricts(res.data.districts))
      .catch(() => setDistricts([]));
  }, [province?.province_id]);

  useEffect(() => {
    if (!form.district_id) { setLocalBodies([]); return; }
    api.get(`/locations/local-bodies?district_id=${form.district_id}`)
      .then((res) => setLocalBodies(res.data.local_bodies))
      .catch(() => setLocalBodies([]));
  }, [form.district_id]);

  function update(field, value) {
    setForm((f) => {
      if (field === "district_id") return { ...f, district_id: value, local_body_id: "" };
      return { ...f, [field]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      await api.post("/admin/municipality-admins", {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        local_body_id: form.local_body_id,
        office_address: form.office_address || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
      });
      setMessage({ type: "success", text: "Municipality Admin account created." });
      setForm(EMPTY_FORM);
      loadOverview();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to create municipality admin" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout title={t("title.provinceOverview")}>
      {province && (
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 mb-6">
          <p className="text-xs text-portal-muted">Province ID {province.province_id}</p>
          <h2 className="text-xl font-semibold text-portal-text">{province.name}</h2>
          {province.nepali_name && <p className="text-sm text-portal-muted">{province.nepali_name}</p>}
        </div>
      )}

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
          <h3 className="font-medium text-portal-text mb-4">Onboard a New Municipality</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">District</label>
                <select
                  required value={form.district_id} onChange={(e) => update("district_id", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                >
                  <option value="">Select district</option>
                  {districts.map((d) => <option key={d.district_id} value={d.district_id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Local Body</label>
                <select
                  required disabled={!form.district_id} value={form.local_body_id}
                  onChange={(e) => update("local_body_id", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary disabled:opacity-50"
                >
                  <option value="">Select local body</option>
                  {localBodies.map((lb) => (
                    <option key={lb.local_body_id} value={lb.local_body_id}>{lb.name} ({lb.type_name})</option>
                  ))}
                </select>
              </div>
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

            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Office Address (optional)</label>
              <input
                value={form.office_address} onChange={(e) => update("office_address", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Contact Email (optional)</label>
                <input
                  type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Contact Phone (optional)</label>
                <input
                  value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
            </div>

            <button
              disabled={submitting}
              className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
            >
              {submitting ? "Creating..." : "Create Municipality Admin"}
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Municipalities in Your Province</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : municipalities.length === 0 ? (
            <p className="text-portal-muted text-sm">No municipalities onboarded yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {municipalities.map((m) => (
                <li key={m.municipality_id} className="border-b border-portal-panel-border/50 pb-3">
                  <p className="text-portal-text font-medium">{m.local_body_name} ({m.type_name})</p>
                  <p className="text-xs text-portal-muted">{m.district_name} District</p>
                  <p className="text-xs mt-1">
                    {m.admin_name ? (
                      <span className="text-portal-success">Admin: {m.admin_name} ({m.admin_email})</span>
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
