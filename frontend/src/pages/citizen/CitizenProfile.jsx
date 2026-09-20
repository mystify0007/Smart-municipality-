import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = { full_name: "", phone: "", address: "", citizenship_no: "", municipality_id: "" };

export default function CitizenProfile() {
  const { t } = useLanguage();
  const { refreshSession } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [municipalities, setMunicipalities] = useState([]);
  const [provinceId, setProvinceId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, municipalitiesRes] = await Promise.all([
          api.get("/citizen/profile"),
          api.get("/locations/municipalities"),
        ]);
        const p = profileRes.data.profile;
        const allMunicipalities = municipalitiesRes.data.municipalities;
        setMunicipalities(allMunicipalities);
        setForm({
          full_name: p.full_name || "",
          phone: p.phone || "",
          address: p.address || "",
          citizenship_no: p.citizenship_no || "",
          municipality_id: p.municipality_id || "",
        });
        // Pre-select the Province/District that already contains the
        // citizen's current municipality, so editing shows the right
        // cascading state instead of starting from scratch.
        if (p.municipality_id) {
          const current = allMunicipalities.find((m) => m.municipality_id === p.municipality_id);
          if (current) {
            setProvinceId(current.province_id);
            setDistrictId(current.district_id);
          }
        }
      } catch (err) {
        setMessage({ type: "error", text: err.response?.data?.error || "Failed to load profile" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

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
    setMessage(null);
    setSaving(true);
    try {
      const res = await api.patch("/citizen/profile", form);
      refreshSession(res.data.token, res.data.user);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <p className="text-portal-muted text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile">
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Full Name</label>
            <input
              required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Phone</label>
            <input
              required value={form.phone} onChange={(e) => update("phone", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Address</label>
            <input
              value={form.address} onChange={(e) => update("address", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
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
              <label className="block text-sm text-portal-muted mb-1.5">Municipality</label>
              <select
                required disabled={!districtId} value={form.municipality_id}
                onChange={(e) => update("municipality_id", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary disabled:opacity-50"
              >
                <option value="">Select municipality</option>
                {municipalityOptions.map((m) => (
                  <option key={m.municipality_id} value={m.municipality_id}>
                    {m.local_body_name} ({m.type_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">
              Citizenship No. (optional — link your nagarikta if you have one)
            </label>
            <input
              value={form.citizenship_no} onChange={(e) => update("citizenship_no", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <button
            disabled={saving}
            className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
