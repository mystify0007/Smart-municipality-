import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api, { resolveUploadUrl } from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Complaints() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadComplaints() {
    try {
      const res = await api.get("/complaints/mine");
      setComplaints(res.data.complaints);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComplaints(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("location", location);
      if (media) formData.append("media", media);

      await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Complaint submitted." });
      setSubject("");
      setDescription("");
      setLocation("");
      setMedia(null);
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to submit" });
    }
  }

  function isVideo(path) {
    return /\.(mp4|webm|mov)$/i.test(path || "");
  }

  return (
    <DashboardLayout title={t("title.complaints")}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Submit a Complaint</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Subject</label>
              <input
                required value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Location</label>
              <input
                value={location} onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Ward 5"
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Description</label>
              <textarea
                required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Photo or Video Evidence (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                onChange={(e) => setMedia(e.target.files[0])}
                className="w-full text-sm text-portal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-portal-primary file:text-white file:text-sm hover:file:bg-portal-primary-hover"
              />
              <p className="text-xs text-portal-muted mt-1">Max 25MB. Images, PDF, or short video clips.</p>
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
              Submit
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">My Complaints</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : complaints.length === 0 ? (
            <p className="text-portal-muted text-sm">No complaints filed yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {complaints.map((c) => (
                <li key={c.complaint_id} className="border-b border-portal-panel-border/50 pb-2">
                  <p className="text-portal-text font-medium">{c.subject}</p>
                  {c.location && <p className="text-portal-muted text-xs">📍 {c.location}</p>}
                  <p className="text-portal-muted">{c.description}</p>
                  {c.image && (
                    isVideo(c.image) ? (
                      <video src={resolveUploadUrl(c.image)} controls className="mt-2 rounded-lg max-h-40" />
                    ) : (
                      <img src={resolveUploadUrl(c.image)} alt="evidence" className="mt-2 rounded-lg max-h-40 object-cover" />
                    )
                  )}
                  <div>
                    <span className="text-xs text-portal-accent">{c.status}</span>
                  </div>
                  {c.officer_response && (
                    <p className="text-xs text-portal-muted mt-1">
                      <span className="text-portal-text">Officer response:</span> {c.officer_response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
