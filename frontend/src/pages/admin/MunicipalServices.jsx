import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const EMPTY_FORM = {
  name: "", description: "", required_documents: "", fee: "", department_id: "", assigned_officer_id: "",
};

export default function MunicipalServices() {
  const { t } = useLanguage();
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [servicesRes, deptRes, officersRes] = await Promise.all([
        api.get("/admin/services"),
        api.get("/admin/departments"),
        api.get("/admin/officers?status=Approved"),
      ]);
      setServices(servicesRes.data.services);
      setDepartments(deptRes.data.departments);
      setOfficers(officersRes.data.officers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(service) {
    setEditingId(service.service_id);
    setForm({
      name: service.name,
      description: service.description || "",
      required_documents: service.required_documents || "",
      fee: service.fee,
      department_id: service.department_id || "",
      assigned_officer_id: service.assigned_officer_id || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const payload = {
      ...form,
      fee: form.fee === "" ? 0 : Number(form.fee),
      department_id: form.department_id || null,
      assigned_officer_id: form.assigned_officer_id || null,
    };
    try {
      if (editingId) {
        await api.patch(`/admin/services/${editingId}`, payload);
        setMessage({ type: "success", text: "Service updated." });
      } else {
        await api.post("/admin/services", payload);
        setMessage({ type: "success", text: "Service created." });
      }
      cancelEdit();
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Save failed" });
    }
  }

  async function toggleActive(service) {
    try {
      await api.patch(`/admin/services/${service.service_id}`, { is_active: !service.is_active });
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  async function handleDelete(id) {
    setMessage(null);
    try {
      await api.delete(`/admin/services/${id}`);
      setMessage({ type: "success", text: "Service deleted." });
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Delete failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.municipalServices")}>
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
          <h3 className="font-medium text-portal-text mb-4">{editingId ? "Edit Service" : "Add Service"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Service Name</label>
              <input
                required value={form.name} onChange={(e) => update("name", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Description</label>
              <textarea
                rows={2} value={form.description} onChange={(e) => update("description", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Required Documents</label>
              <input
                value={form.required_documents} onChange={(e) => update("required_documents", e.target.value)}
                placeholder="e.g. Citizenship copy, Photo"
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Fee (Rs.)</label>
                <input
                  type="number" min="0" step="0.01" value={form.fee} onChange={(e) => update("fee", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
              </div>
              <div>
                <label className="block text-sm text-portal-muted mb-1.5">Department</label>
                <select
                  value={form.department_id} onChange={(e) => update("department_id", e.target.value)}
                  className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                >
                  <option value="">—</option>
                  {departments.map((d) => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Responsible Officer</label>
              <select
                value={form.assigned_officer_id} onChange={(e) => update("assigned_officer_id", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                <option value="">—</option>
                {officers.map((o) => <option key={o.user_id} value={o.user_id}>{o.full_name}</option>)}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
                {editingId ? "Save Changes" : "Add Service"}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit} className="px-4 rounded-lg text-portal-muted hover:text-portal-text">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Services</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : services.length === 0 ? (
            <p className="text-portal-muted text-sm">No services yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {services.map((s) => (
                <li key={s.service_id} className="border-b border-portal-panel-border/50 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-portal-text font-medium">{s.name}</p>
                      <p className="text-xs text-portal-muted">
                        {s.department_name || "No department"} · {s.officer_name || "Unassigned"} · Rs. {s.fee}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs shrink-0 ${
                      s.is_active ? "bg-portal-success/15 text-portal-success" : "bg-portal-muted/15 text-portal-muted"
                    }`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => startEdit(s)} className="text-xs text-portal-primary hover:underline">Edit</button>
                    <button onClick={() => toggleActive(s)} className="text-xs text-portal-muted hover:underline">
                      {s.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button onClick={() => handleDelete(s.service_id)} className="text-xs text-portal-danger hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
