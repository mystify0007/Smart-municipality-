import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminProfile() {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: "", phone: "", address: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    api.get("/admin/profile")
      .then((res) => {
        const p = res.data.profile;
        setProfile(p);
        setForm({ full_name: p.full_name, phone: p.phone || "", address: p.address || "" });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.patch("/admin/profile", form);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
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

  if (loading || !profile) {
    return (
      <DashboardLayout title={t("title.adminProfile")}>
        <p className="text-portal-muted text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("title.adminProfile")}>
      <div className="grid grid-cols-2 gap-6 max-w-3xl">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Profile Details</h3>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Full Name</label>
              <input
                required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Email</label>
              <input
                disabled value={profile.email}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Phone</label>
              <input
                value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Address</label>
              <input
                value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
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

            <button className="bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg px-4 py-2.5">
              Save Changes
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
    </DashboardLayout>
  );
}
