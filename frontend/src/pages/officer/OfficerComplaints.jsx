import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api, { resolveUploadUrl } from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_OPTIONS = ["Pending", "In Progress", "Resolved"];

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  "In Progress": "bg-portal-primary/15 text-portal-primary",
  Resolved: "bg-portal-success/15 text-portal-success",
  Escalated: "bg-portal-danger/15 text-portal-danger",
  Closed: "bg-portal-muted/15 text-portal-muted",
};

// Escalation and closing are Admin-only actions (see ComplaintManagement.jsx
// on the admin side) — once a complaint reaches either state, the officer's
// own status control is locked so they can't quietly revert it.
const LOCKED_STATUSES = ["Escalated", "Closed"];

function isVideo(path) {
  return /\.(mp4|webm|mov)$/i.test(path || "");
}

export default function OfficerComplaints() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState(null);

  async function loadComplaints() {
    try {
      const res = await api.get("/officer/complaints");
      setComplaints(res.data.complaints);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComplaints(); }, []);

  function draftFor(complaint) {
    return drafts[complaint.complaint_id] || {
      status: complaint.status,
      response: complaint.officer_response || "",
    };
  }

  function updateDraft(complaint, patch) {
    setDrafts((prev) => ({
      ...prev,
      [complaint.complaint_id]: { ...draftFor(complaint), ...patch },
    }));
  }

  async function handleSave(complaint) {
    setMessage(null);
    const draft = draftFor(complaint);
    try {
      await api.patch(`/officer/complaints/${complaint.complaint_id}`, {
        status: draft.status,
        response: draft.response,
      });
      setMessage({ type: "success", text: `Complaint #${complaint.complaint_id} updated.` });
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.officerComplaints")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">Citizen Complaints</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : complaints.length === 0 ? (
          <p className="text-portal-muted text-sm">No complaints filed yet.</p>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => {
              const draft = draftFor(c);
              const locked = LOCKED_STATUSES.includes(c.status);
              return (
                <div key={c.complaint_id} className="border border-portal-panel-border/60 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-portal-text font-medium">{c.subject}</p>
                      <p className="text-xs text-portal-muted">{c.full_name} • {c.email}</p>
                      {c.location && <p className="text-xs text-portal-muted">📍 {c.location}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${STATUS_STYLES[c.status] || ""}`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-sm text-portal-muted mt-2">{c.description}</p>

                  {c.image && (
                    isVideo(c.image) ? (
                      <video src={resolveUploadUrl(c.image)} controls className="mt-2 rounded-lg max-h-40" />
                    ) : (
                      <img src={resolveUploadUrl(c.image)} alt="evidence" className="mt-2 rounded-lg max-h-40 object-cover" />
                    )
                  )}

                  {locked ? (
                    <p className="text-xs text-portal-muted mt-3">
                      This complaint has been {c.status.toLowerCase()} by the Admin and can no longer be updated here.
                    </p>
                  ) : (
                    <div className="mt-3 grid grid-cols-[160px_1fr_auto] gap-3 items-start">
                      <select
                        value={draft.status}
                        onChange={(e) => updateDraft(c, { status: e.target.value })}
                        className="text-sm rounded-lg bg-[#0b1120] border border-portal-panel-border px-2.5 py-2 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Response to citizen (optional)"
                        value={draft.response}
                        onChange={(e) => updateDraft(c, { response: e.target.value })}
                        className="text-sm rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
                      />
                      <button
                        onClick={() => handleSave(c)}
                        className="text-sm bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg px-4 py-2"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
