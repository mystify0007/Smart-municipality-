import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const TARGET_ROLES = ["All", "Citizen", "Business", "Officer"];
const EMPTY_FORM = { title: "", description: "", target_role: "All" };

export default function AdminNotices() {
  const { t } = useLanguage();
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadNotices() {
    try {
      const res = await api.get("/notices");
      setNotices(res.data.notices);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadNotices(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(notice) {
    setEditingId(notice.notice_id);
    setForm({ title: notice.title, description: notice.description, target_role: notice.target_role });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      if (editingId) {
        await api.patch(`/admin/notices/${editingId}`, form);
        setMessage({ type: "success", text: "Announcement updated." });
      } else {
        await api.post("/admin/notices", form);
        setMessage({ type: "success", text: "Announcement published." });
      }
      cancelEdit();
      loadNotices();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to save" });
    }
  }

  async function handleDelete(id) {
    setMessage(null);
    try {
      await api.delete(`/admin/notices/${id}`);
      setMessage({ type: "success", text: "Announcement deleted." });
      loadNotices();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Delete failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.notices")}>
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
          <h3 className="font-medium text-portal-text mb-4">{editingId ? "Edit Announcement" : "Publish an Announcement"}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Title</label>
              <input
                required value={form.title} onChange={(e) => update("title", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Body</label>
              <textarea
                required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Audience</label>
              <select
                value={form.target_role} onChange={(e) => update("target_role", e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              >
                {TARGET_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
                {editingId ? "Save Changes" : "Publish"}
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
          <h3 className="font-medium text-portal-text mb-4">Notice Board</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : notices.length === 0 ? (
            <p className="text-portal-muted text-sm">No notices yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {notices.map((n) => (
                <li key={n.notice_id} className="border-b border-portal-panel-border/50 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-portal-text font-medium">{n.title}</p>
                    <span className="text-xs text-portal-accent shrink-0">{n.target_role}</span>
                  </div>
                  <p className="text-portal-muted">{n.description}</p>
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => startEdit(n)} className="text-xs text-portal-primary hover:underline">Edit</button>
                    <button onClick={() => handleDelete(n.notice_id)} className="text-xs text-portal-danger hover:underline">Delete</button>
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
