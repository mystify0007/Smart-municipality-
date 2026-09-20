import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = { full_name: "", email: "", password: "", province_id: "" };

export default function StateDashboard() {
  const { t } = useLanguage();
  const [provinces, setProvinces] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);

  async function loadOverview() {
    setLoading(true);
    try {
      const res = await api.get("/admin/state");
      setProvinces(res.data.provinces);
    } finally {
      setLoading(false);
    }
  }

  async function loadEnquiries() {
    try {
      const res = await api.get("/admin/state/enquiries");
      setEnquiries(res.data.enquiries);
    } catch {
      setEnquiries([]);
    }
  }

  useEffect(() => { loadOverview(); loadEnquiries(); }, []);

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

  async function toggleAdminStatus(adminUserId, currentStatus) {
    const nextStatus = currentStatus === "Blocked" ? "Active" : "Blocked";
    setMessage(null);
    try {
      await api.patch(`/admin/province-admins/${adminUserId}/status`, { status: nextStatus });
      setMessage({ type: "success", text: `Province Admin ${nextStatus.toLowerCase()}.` });
      setSelectedAdmin((s) => (s ? { ...s, admin_status: nextStatus } : s));
      loadOverview();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update province admin" });
    }
  }

  async function sendReply(enquiryId) {
    if (!replyText.trim()) return;
    setMessage(null);
    try {
      await api.patch(`/admin/state/enquiries/${enquiryId}/respond`, { response: replyText });
      setMessage({ type: "success", text: "Response sent." });
      setReplyingTo(null);
      setReplyText("");
      loadEnquiries();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to send response" });
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

      <div className="grid grid-cols-2 gap-6 mb-6">
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
                  <p className="text-xs text-portal-muted">
                    Province ID {p.province_id} · {p.municipality_count} municipalit{p.municipality_count === 1 ? "y" : "ies"} onboarded
                  </p>
                  {p.admin_name ? (
                    <p className="text-xs mt-1">
                      <button
                        onClick={() => setSelectedAdmin(p)}
                        className={`hover:underline ${p.admin_status === "Blocked" ? "text-portal-danger" : "text-portal-success"}`}
                      >
                        Admin: {p.admin_name} ({p.admin_email}) — {p.admin_status}
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs mt-1 text-portal-danger">No admin assigned yet</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">Enquiries from Province Admins</h3>
        {enquiries.length === 0 ? (
          <p className="text-portal-muted text-sm">No enquiries yet.</p>
        ) : (
          <ul className="space-y-4 text-sm">
            {enquiries.map((e) => (
              <li key={e.enquiry_id} className="border-b border-portal-panel-border/50 pb-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-portal-text font-medium">{e.subject}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${
                    e.status === "Open" ? "bg-portal-accent/15 text-portal-accent" : "bg-portal-success/15 text-portal-success"
                  }`}>
                    {e.status}
                  </span>
                </div>
                <p className="text-xs text-portal-muted mt-0.5">
                  {e.province_name} · {e.raised_by_name} ({e.raised_by_email}) · {new Date(e.created_at).toLocaleString()}
                </p>
                <p className="text-portal-text mt-2">{e.message}</p>

                {e.response && (
                  <div className="mt-2 pl-3 border-l-2 border-portal-success/40">
                    <p className="text-xs text-portal-muted">
                      Response{e.responded_at ? ` · ${new Date(e.responded_at).toLocaleString()}` : ""}
                    </p>
                    <p className="text-portal-text">{e.response}</p>
                  </div>
                )}

                {e.status === "Open" && (
                  replyingTo === e.enquiry_id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={2} value={replyText} onChange={(ev) => setReplyText(ev.target.value)}
                        placeholder="Write a response..."
                        className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReply(e.enquiry_id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-portal-primary text-white hover:bg-portal-primary-hover"
                        >
                          Send Response
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          className="text-xs px-3 py-1.5 rounded-lg text-portal-muted hover:text-portal-text"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(e.enquiry_id); setReplyText(""); }}
                      className="mt-2 text-xs text-portal-primary hover:underline"
                    >
                      Respond
                    </button>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-portal-text">{selectedAdmin.admin_name}</h3>
              <button onClick={() => setSelectedAdmin(null)} className="text-portal-muted hover:text-portal-text">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><dt className="text-portal-muted">Email</dt><dd className="text-portal-text">{selectedAdmin.admin_email}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="text-portal-text">{selectedAdmin.admin_status}</dd></div>
              <div><dt className="text-portal-muted">Province</dt><dd className="text-portal-text">{selectedAdmin.name}</dd></div>
              <div><dt className="text-portal-muted">Province ID</dt><dd className="text-portal-text">{selectedAdmin.province_id}</dd></div>
            </dl>
            <p className="text-sm font-medium text-portal-text mb-2">Province Activity</p>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><dt className="text-portal-muted">Municipalities onboarded</dt><dd className="text-portal-text">{selectedAdmin.municipality_count}</dd></div>
              <div><dt className="text-portal-muted">Citizens</dt><dd className="text-portal-text">{selectedAdmin.citizen_count}</dd></div>
              <div><dt className="text-portal-muted">Officers</dt><dd className="text-portal-text">{selectedAdmin.officer_count}</dd></div>
              <div><dt className="text-portal-muted">Certificates</dt><dd className="text-portal-text">{selectedAdmin.pending_certificates} pending, {selectedAdmin.completed_certificates} completed</dd></div>
              <div><dt className="text-portal-muted">Complaints</dt><dd className="text-portal-text">{selectedAdmin.pending_complaints} pending, {selectedAdmin.resolved_complaints} resolved</dd></div>
            </dl>
            <button
              onClick={() => toggleAdminStatus(selectedAdmin.admin_user_id, selectedAdmin.admin_status)}
              className={`w-full text-sm px-4 py-2 rounded-lg ${
                selectedAdmin.admin_status === "Blocked"
                  ? "bg-portal-success/15 text-portal-success hover:bg-portal-success/25"
                  : "bg-portal-danger/15 text-portal-danger hover:bg-portal-danger/25"
              }`}
            >
              {selectedAdmin.admin_status === "Blocked" ? "Activate" : "Deactivate"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
