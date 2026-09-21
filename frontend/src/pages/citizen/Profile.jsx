import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Profile() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [citizenshipNo, setCitizenshipNo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api.get("/citizen/profile")
      .then((res) => {
        const p = res.data.profile;
        setProfile(p);
        setFullName(p.full_name || "");
        setPhone(p.phone || "");
        setAddress(p.address || "");
        setCitizenshipNo(p.citizenship_no || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await api.patch("/citizen/profile", {
        full_name: fullName,
        phone,
        address,
        citizenship_no: citizenshipNo,
      });
      setProfile((p) => ({ ...p, full_name: fullName, phone, address, citizenship_no: citizenshipNo }));
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title={t("title.citizenProfile")}>
      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : !profile ? (
        <p className="text-portal-muted text-sm">Failed to load profile.</p>
      ) : (
        <div className="max-w-lg bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">My Profile</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Full Name</label>
              <input
                required value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Phone</label>
              <input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Address</label>
              <input
                value={address} onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>

            <div>
              <label className="block text-sm text-portal-muted mb-1.5">
                Citizenship No.
              </label>
              <input
                value={citizenshipNo} onChange={(e) => setCitizenshipNo(e.target.value)}
                placeholder="e.g. 12-34-56-78901"
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
              <p className="text-xs text-portal-muted mt-1.5">
                Required before you can apply through e-Sifaris.
              </p>
            </div>

            {message && (
              <p className={`text-sm rounded-lg px-3 py-2 border ${
                message.type === "success"
                  ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                  : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
              }`}>
                {message.text}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                disabled={saving}
                className="bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              <Link to="/citizen/apply" className="text-sm text-portal-primary hover:underline">
                Go to e-Sifaris
              </Link>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
