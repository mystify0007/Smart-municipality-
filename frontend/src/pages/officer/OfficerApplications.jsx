import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_OPTIONS = ["Pending", "Processing", "Approved", "Rejected", "Completed"];

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Processing: "bg-portal-primary/15 text-portal-primary",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
  Completed: "bg-portal-success/15 text-portal-success",
};

export default function OfficerApplications() {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [infoModalFor, setInfoModalFor] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await api.get("/officer/queue");
      setQueue(res.data.queue);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadQueue(); }, []);

  function draftFor(item) {
    return drafts[item.certificate_id] || { status: item.status, remarks: item.remarks || "" };
  }

  function updateDraft(item, patch) {
    setDrafts((prev) => ({ ...prev, [item.certificate_id]: { ...draftFor(item), ...patch } }));
  }

  async function handleSave(item) {
    const draft = draftFor(item);
    setMessage(null);
    try {
      await api.patch(`/officer/applications/${item.certificate_id}`, {
        status: draft.status,
        remarks: draft.remarks,
      });
      setMessage({ type: "success", text: "Application updated." });
      loadQueue();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  async function handleSendInfoRequest() {
    if (!infoMessage) return;
    setMessage(null);
    try {
      await api.patch(`/officer/applications/${infoModalFor}/request-info`, { message: infoMessage });
      setMessage({ type: "success", text: "Request sent to citizen." });
      setInfoModalFor(null);
      setInfoMessage("");
      loadQueue();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to send request" });
    }
  }

  return (
    <DashboardLayout title={t("title.myApplications")}>
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
        <h3 className="font-medium text-portal-text mb-4">Applications Assigned to Me</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : queue.length === 0 ? (
          <p className="text-portal-muted text-sm">No applications assigned to you yet.</p>
        ) : (
          <div className="space-y-4">
            {queue.map((item) => {
              const draft = draftFor(item);
              return (
                <div key={item.certificate_id} className="border border-portal-panel-border/60 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-portal-text font-medium">
                        REQ-{String(item.certificate_id).padStart(4, "0")} — {item.certificate_type} Certificate
                      </p>
                      <p className="text-xs text-portal-muted">
                        {item.full_name} • {item.email}
                        {item.citizenship_no && ` • ID: ${item.citizenship_no}`}
                      </p>
                      <p className="text-xs text-portal-muted mt-1">Purpose: {item.purpose}</p>
                      {item.additional_info_requested && (
                        <p className="text-xs text-portal-accent mt-1">
                          Info requested from citizen: {item.additional_info_requested}
                        </p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${STATUS_STYLES[item.status] || ""}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    {item.document_path ? (
                      <a
                        href={item.document_path} target="_blank" rel="noreferrer"
                        className="text-xs text-portal-primary hover:underline"
                      >
                        View Document
                      </a>
                    ) : (
                      <span className="text-xs text-portal-muted">No document uploaded</span>
                    )}
                    <button
                      onClick={() => setInfoModalFor(item.certificate_id)}
                      className="text-xs text-portal-accent hover:underline"
                    >
                      Request More Info
                    </button>
                  </div>

                  <div className="grid grid-cols-[160px_1fr_auto] gap-3 items-start mt-3">
                    <select
                      value={draft.status}
                      onChange={(e) => updateDraft(item, { status: e.target.value })}
                      className="text-sm rounded-lg bg-portal-bg border border-portal-panel-border px-2.5 py-2 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input
                      type="text"
                      placeholder="Remarks"
                      value={draft.remarks}
                      onChange={(e) => updateDraft(item, { remarks: e.target.value })}
                      className="text-sm rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
                    />
                    <button
                      onClick={() => handleSave(item)}
                      className="text-sm bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg px-4 py-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {infoModalFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-medium text-portal-text mb-3">Request More Information</h3>
            <textarea
              rows={3} value={infoMessage} onChange={(e) => setInfoMessage(e.target.value)}
              placeholder="What does the citizen need to provide?"
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setInfoModalFor(null); setInfoMessage(""); }}
                className="text-sm px-4 py-2 rounded-lg text-portal-muted hover:text-portal-text"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInfoRequest}
                disabled={!infoMessage}
                className="text-sm px-4 py-2 rounded-lg bg-portal-primary text-white disabled:opacity-50"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
