import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminNotices() {
  const { t } = useLanguage();
  const [notices, setNotices] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.post("/admin/notices", { title, description });
      setMessage({ type: "success", text: "Notice published." });
      setTitle("");
      setDescription("");
      loadNotices();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to publish" });
    }
  }

  return (
    <DashboardLayout title={t("title.notices")}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Publish a Notice</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Title</label>
              <input
                required value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Body</label>
              <textarea
                required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
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
            <button className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
              Publish
            </button>
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
                  <p className="text-portal-text font-medium">{n.title}</p>
                  <p className="text-portal-muted">{n.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
