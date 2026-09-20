import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function SystemSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    notify_email_enabled: "true", notify_sms_enabled: "false",
  });
  const [municipality, setMunicipality] = useState(null);
  const [municipalityForm, setMunicipalityForm] = useState({ office_address: "", contact_email: "", contact_phone: "" });
  const [departments, setDepartments] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: "", description: "" });
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [settingsRes, deptRes, municipalityRes] = await Promise.all([
        api.get("/admin/settings"),
        api.get("/admin/departments"),
        api.get("/admin/municipality"),
      ]);
      setSettings((s) => ({ ...s, ...settingsRes.data.settings }));
      setDepartments(deptRes.data.departments);
      setMunicipality(municipalityRes.data.municipality);
      setMunicipalityForm({
        office_address: municipalityRes.data.municipality.office_address || "",
        contact_email: municipalityRes.data.municipality.contact_email || "",
        contact_phone: municipalityRes.data.municipality.contact_phone || "",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function updateSetting(key, value) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.patch("/admin/settings", settings);
      setMessage({ type: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
  }

  function updateMunicipalityField(key, value) {
    setMunicipalityForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSaveMunicipality(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.patch("/admin/municipality", municipalityForm);
      setMessage({ type: "success", text: "Municipality details saved." });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
  }

  function startEditDept(d) {
    setEditingDeptId(d.department_id);
    setDeptForm({ name: d.name, description: d.description || "" });
  }

  function cancelEditDept() {
    setEditingDeptId(null);
    setDeptForm({ name: "", description: "" });
  }

  async function handleSaveDept(e) {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingDeptId) {
        await api.patch(`/admin/departments/${editingDeptId}`, deptForm);
        setMessage({ type: "success", text: "Department updated." });
      } else {
        await api.post("/admin/departments", deptForm);
        setMessage({ type: "success", text: "Department added." });
      }
      cancelEditDept();
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
  }

  async function handleDeleteDept(id) {
    setMessage(null);
    try {
      await api.delete(`/admin/departments/${id}`);
      setMessage({ type: "success", text: "Department deleted." });
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Delete failed" });
    }
  }

  if (loading) {
    return (
      <DashboardLayout title={t("title.systemSettings")}>
        <p className="text-portal-muted text-sm">Loading...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t("title.systemSettings")}>
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
          <h3 className="font-medium text-portal-text mb-4">Municipality Information</h3>
          {municipality && (
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <p className="text-xs text-portal-muted uppercase tracking-wide">Local Body</p>
                <p className="text-portal-text">{municipality.local_body_name} ({municipality.type_name})</p>
              </div>
              <div>
                <p className="text-xs text-portal-muted uppercase tracking-wide">Local Body ID</p>
                <p className="text-portal-text">{municipality.local_body_id}</p>
              </div>
              <div>
                <p className="text-xs text-portal-muted uppercase tracking-wide">District</p>
                <p className="text-portal-text">{municipality.district_name}</p>
              </div>
              <div>
                <p className="text-xs text-portal-muted uppercase tracking-wide">Province</p>
                <p className="text-portal-text">{municipality.province_name} (ID: {municipality.province_id})</p>
              </div>
            </div>
          )}
          <form onSubmit={handleSaveMunicipality} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Office Address</label>
              <input
                value={municipalityForm.office_address} onChange={(e) => updateMunicipalityField("office_address", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Contact Email</label>
                <input
                  type="email" value={municipalityForm.contact_email} onChange={(e) => updateMunicipalityField("contact_email", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Contact Phone</label>
                <input
                  value={municipalityForm.contact_phone} onChange={(e) => updateMunicipalityField("contact_phone", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
            </div>
            <button className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
              Save Municipality Details
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Notification Settings</h3>
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-portal-text">
              <input
                type="checkbox" checked={settings.notify_email_enabled === "true"}
                onChange={(e) => updateSetting("notify_email_enabled", String(e.target.checked))}
              />
              Email notifications enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-portal-text">
              <input
                type="checkbox" checked={settings.notify_sms_enabled === "true"}
                onChange={(e) => updateSetting("notify_sms_enabled", String(e.target.checked))}
              />
              SMS notifications enabled
            </label>
            <button className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
              Save Settings
            </button>
          </form>
        </div>
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Departments</h3>
          <form onSubmit={handleSaveDept} className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-2">
              <input
                required placeholder="Department name" value={deptForm.name}
                onChange={(e) => setDeptForm((f) => ({ ...f, name: e.target.value }))}
                className="rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2 text-sm text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
              <input
                placeholder="Description (optional)" value={deptForm.description}
                onChange={(e) => setDeptForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2 text-sm text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div className="flex gap-2">
              <button className="text-sm bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg px-4 py-2">
                {editingDeptId ? "Save" : "Add Department"}
              </button>
              {editingDeptId && (
                <button type="button" onClick={cancelEditDept} className="text-sm px-4 rounded-lg text-portal-muted hover:text-portal-text">
                  Cancel
                </button>
              )}
            </div>
          </form>

          {departments.length === 0 ? (
            <p className="text-portal-muted text-sm">No departments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {departments.map((d) => (
                <li key={d.department_id} className="flex items-center justify-between border-b border-portal-panel-border/50 pb-2">
                  <div>
                    <p className="text-portal-text">{d.name}</p>
                    {d.description && <p className="text-xs text-portal-muted">{d.description}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEditDept(d)} className="text-xs text-portal-primary hover:underline">Edit</button>
                    <button onClick={() => handleDeleteDept(d.department_id)} className="text-xs text-portal-danger hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </DashboardLayout>
  );
}
