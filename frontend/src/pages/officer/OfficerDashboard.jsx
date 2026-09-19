import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
};

export default function OfficerDashboard() {
  const { t } = useLanguage();
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  async function loadData() {
    try {
      const [queueRes, statsRes] = await Promise.all([
        api.get("/officer/queue"),
        api.get("/officer/stats"),
      ]);
      setQueue(queueRes.data.queue);
      setStats(statsRes.data.stats);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleDecision(certificateId, status) {
    setActionMessage(null);
    try {
      await api.patch(`/officer/applications/${certificateId}`, { status });
      setActionMessage({ type: "success", text: `Application ${status.toLowerCase()}.` });
      loadData();
    } catch (err) {
      setActionMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  const statCount = (status) => stats.find((s) => s.status === status)?.count || 0;

  return (
    <DashboardLayout title={t("title.officerDashboard")}>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["Pending", "Approved", "Rejected"].map((status) => (
          <div key={status} className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">{status}</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{statCount(status)}</p>
          </div>
        ))}
      </div>

      {actionMessage && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          actionMessage.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {actionMessage.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">Review Queue</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : queue.length === 0 ? (
          <p className="text-portal-muted text-sm">No applications in the queue.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Request ID</th>
                <th className="pb-2 font-normal">Citizen</th>
                <th className="pb-2 font-normal">Service Type</th>
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.certificate_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">REQ-{String(item.certificate_id).padStart(4, "0")}</td>
                  <td className="py-3 text-portal-text">{item.full_name}</td>
                  <td className="py-3 text-portal-text">{item.certificate_type}</td>
                  <td className="py-3 text-portal-muted">{new Date(item.applied_date).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[item.status] || ""}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    {item.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleDecision(item.certificate_id, "Approved")}
                          className="text-xs bg-portal-success/15 text-portal-success px-2.5 py-1 rounded-lg hover:bg-portal-success/25"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(item.certificate_id, "Rejected")}
                          className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
