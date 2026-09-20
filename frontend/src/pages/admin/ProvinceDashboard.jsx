import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = {
  full_name: "", email: "", password: "",
  district_id: "", local_body_id: "",
  office_address: "", contact_email: "", contact_phone: "",
};

const EMPTY_ENQUIRY_FORM = { subject: "", message: "" };

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
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [enquiryForm, setEnquiryForm] = useState(EMPTY_ENQUIRY_FORM);
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);

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

  async function loadEnquiries() {
    try {
      const res = await api.get("/admin/enquiries");
      setEnquiries(res.data.enquiries);
    } catch {
      setEnquiries([]);
    }
  }

  useEffect(() => { loadOverview(); loadEnquiries(); }, []);

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

  async function handleEnquirySubmit(e) {
    e.preventDefault();
    setMessage(null);
    setSubmittingEnquiry(true);
    try {
      await api.post("/admin/enquiries", enquiryForm);
      setMessage({ type: "success", text: "Enquiry submitted to the State Admin." });
      setEnquiryForm(EMPTY_ENQUIRY_FORM);
      loadEnquiries();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to submit enquiry" });
    } finally {
      setSubmittingEnquiry(false);
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

      <div className="grid grid-cols-2 gap-6 mb-6">
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
                      <button onClick={() => setSelectedAdmin(m)} className="text-portal-success hover:underline">
                        Admin: {m.admin_name} ({m.admin_email})
                      </button>
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

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Raise an Enquiry to the State Admin</h3>
          <form onSubmit={handleEnquirySubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Subject</label>
              <input
                required value={enquiryForm.subject}
                onChange={(e) => setEnquiryForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Message</label>
              <textarea
                required rows={4} value={enquiryForm.message}
                onChange={(e) => setEnquiryForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Describe what can't be resolved at the Province level..."
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <button
              disabled={submittingEnquiry}
              className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5"
            >
              {submittingEnquiry ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Your Enquiries</h3>
          {enquiries.length === 0 ? (
            <p className="text-portal-muted text-sm">No enquiries raised yet.</p>
          ) : (
            <ul className="space-y-4 text-sm">
              {enquiries.map((e) => (
                <li key={e.enquiry_id} className="border-b border-portal-panel-border/50 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-portal-text font-medium">{e.subject}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${
                      e.status === "Open" ? "bg-portal-accent/15 text-portal-accent" : "bg-portal-success/15 text-portal-success"
                    }`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-portal-muted mt-0.5">{new Date(e.created_at).toLocaleString()}</p>
                  <p className="text-portal-text mt-1">{e.message}</p>
                  {e.response && (
                    <div className="mt-2 pl-3 border-l-2 border-portal-success/40">
                      <p className="text-xs text-portal-muted">
                        State Admin response{e.responded_at ? ` · ${new Date(e.responded_at).toLocaleString()}` : ""}
                      </p>
                      <p className="text-portal-text">{e.response}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {selectedAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-portal-text">{selectedAdmin.admin_name}</h3>
              <button onClick={() => setSelectedAdmin(null)} className="text-portal-muted hover:text-portal-text">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-portal-muted">Email</dt><dd className="text-portal-text">{selectedAdmin.admin_email}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="text-portal-text">{selectedAdmin.admin_status || "—"}</dd></div>
              <div><dt className="text-portal-muted">Municipality</dt><dd className="text-portal-text">{selectedAdmin.local_body_name} ({selectedAdmin.type_name})</dd></div>
              <div><dt className="text-portal-muted">District</dt><dd className="text-portal-text">{selectedAdmin.district_name}</dd></div>
              {selectedAdmin.office_address && (
                <div className="col-span-2"><dt className="text-portal-muted">Office Address</dt><dd className="text-portal-text">{selectedAdmin.office_address}</dd></div>
              )}
              {selectedAdmin.admin_created_at && (
                <div><dt className="text-portal-muted">Admin Since</dt><dd className="text-portal-text">{new Date(selectedAdmin.admin_created_at).toLocaleDateString()}</dd></div>
              )}
            </dl>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
