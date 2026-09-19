import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
  Suspended: "bg-portal-danger/15 text-portal-danger",
};

export default function OfficerProfile() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    api.get("/officer/profile")
      .then((res) => {
        const p = res.data.profile;
        setProfile(p);
        setPhone(p.phone || "");
        setAddress(p.address || "");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      await api.patch("/officer/profile", { phone, address });
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage(null);
    try {
      await api.patch("/auth/change-password", passwordForm);
      setPasswordMessage({ type: "success", text: "Password changed." });
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.response?.data?.error || "Change failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.officerProfile")}>
      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 max-w-3xl">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
            <h3 className="font-medium text-portal-text mb-4">Account Details</h3>

            <dl className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <dt className="text-portal-muted">Full Name</dt>
                <dd className="text-portal-text">{profile.full_name}</dd>
              </div>
              <div>
                <dt className="text-portal-muted">Email</dt>
                <dd className="text-portal-text">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-portal-muted">Department</dt>
                <dd className="text-portal-text">{profile.department}</dd>
              </div>
              <div>
                <dt className="text-portal-muted">Designation</dt>
                <dd className="text-portal-text">{profile.designation}</dd>
              </div>
              <div>
                <dt className="text-portal-muted">Verification Status</dt>
                <dd>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[profile.officer_status] || ""}`}>
                    {profile.officer_status}
                  </span>
                </dd>
              </div>
            </dl>

            <form onSubmit={handleSubmit} className="space-y-4">
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

              {message && (
                <p className={`text-sm rounded-lg px-3 py-2 border ${
                  message.type === "success"
                    ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                    : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
                }`}>
                  {message.text}
                </p>
              )}

              <button
                disabled={saving}
                className="bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
            <h3 className="font-medium text-portal-text mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Current Password</label>
                <input
                  type="password" required value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">New Password</label>
                <input
                  type="password" required value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>

              {passwordMessage && (
                <p className={`text-sm rounded-lg px-3 py-2 border ${
                  passwordMessage.type === "success"
                    ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                    : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
                }`}>
                  {passwordMessage.text}
                </p>
              )}

              <button className="bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg px-4 py-2.5">
                Change Password
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
