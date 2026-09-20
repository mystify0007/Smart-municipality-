import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PreferenceToggles from "../components/PreferenceToggles";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    role: "Citizen", address: "", citizenship_no: "", municipality_id: "",
  });
  const [municipalities, setMunicipalities] = useState([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/locations/municipalities")
      .then((res) => setMunicipalities(res.data.municipalities))
      .catch(() => setMunicipalities([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Province -> District -> Municipality, all derived from the one
  // already-onboarded-municipalities list — a Citizen can only register
  // under a Local Body that's actually onboarded, so this only ever offers
  // real choices instead of any of Nepal's 753 Local Bodies.
  const provinces = [...new Map(municipalities.map((m) => [m.province_id, m.province_name])).entries()]
    .map(([province_id, province_name]) => ({ province_id, province_name }));

  const districts = [...new Map(
    municipalities.filter((m) => String(m.province_id) === String(provinceId))
      .map((m) => [m.district_id, m.district_name])
  ).entries()].map(([district_id, district_name]) => ({ district_id, district_name }));

  const municipalityOptions = municipalities.filter((m) => String(m.district_id) === String(districtId));

  function selectProvince(value) {
    setProvinceId(value);
    setDistrictId("");
    update("municipality_id", "");
  }

  function selectDistrict(value) {
    setDistrictId(value);
    update("municipality_id", "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(form);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1200);
      void res;
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen portal-photo-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />
      <div className="w-full max-w-md bg-portal-panel border border-portal-panel-border rounded-xl p-8">
        <h2 className="text-lg font-medium text-portal-text text-center mb-1">{t("register.heading")}</h2>
        <p className="text-sm text-portal-muted text-center mb-6">Smart Municipality Portal</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Province</label>
            <select
              required value={provinceId} onChange={(e) => selectProvince(e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            >
              <option value="">Select province</option>
              {provinces.map((p) => (
                <option key={p.province_id} value={p.province_id}>{p.province_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">District</label>
            <select
              required disabled={!provinceId} value={districtId} onChange={(e) => selectDistrict(e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary disabled:opacity-50"
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">{t("register.municipality")}</label>
            <select
              required disabled={!districtId} value={form.municipality_id}
              onChange={(e) => update("municipality_id", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary disabled:opacity-50"
            >
              <option value="">{t("register.selectMunicipality")}</option>
              {municipalityOptions.map((m) => (
                <option key={m.municipality_id} value={m.municipality_id}>
                  {m.local_body_name} ({m.type_name})
                </option>
              ))}
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

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Citizenship No. (optional)</label>
            <input
              value={form.citizenship_no} onChange={(e) => update("citizenship_no", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

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
          <a href="/portals" className="text-xs text-portal-muted hover:underline">
            Not a Citizen? Choose your portal →
          </a>
        </div>
      </div>
    </div>
  );
}
