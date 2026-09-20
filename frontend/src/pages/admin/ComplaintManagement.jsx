import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_FILTERS = ["All", "Pending", "In Progress", "Resolved", "Escalated", "Closed"];

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  "In Progress": "bg-portal-primary/15 text-portal-primary",
  Resolved: "bg-portal-success/15 text-portal-success",
  Escalated: "bg-portal-danger/15 text-portal-danger",
  Closed: "bg-portal-muted/15 text-portal-muted",
};

export default function ComplaintManagement() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [assignDrafts, setAssignDrafts] = useState({});

  async function loadComplaints() {
    setLoading(true);
    try {
      const query = filter !== "All" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/complaints${query}`);
      setComplaints(res.data.complaints);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadComplaints(); }, [filter]);

  useEffect(() => {
    api.get("/admin/officers?status=Approved").then((res) => setOfficers(res.data.officers));
  }, []);

  async function handleAssign(id) {
    const officerId = assignDrafts[id];
    if (!officerId) return;
    setMessage(null);
    try {
      await api.patch(`/admin/complaints/${id}/assign`, { officer_id: officerId });
      setMessage({ type: "success", text: "Complaint assigned." });
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Assignment failed" });
    }
  }

  async function handleEscalate(id) {
    setMessage(null);
    try {
      await api.patch(`/admin/complaints/${id}/escalate`);
      setMessage({ type: "success", text: "Complaint escalated." });
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Escalation failed" });
    }
  }

  async function handleClose(id) {
    setMessage(null);
    try {
      await api.patch(`/admin/complaints/${id}/close`);
      setMessage({ type: "success", text: "Complaint closed." });
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Close failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.complaintManagement")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="flex gap-2 mb-4">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border ${
              filter === s
                ? "bg-portal-primary text-white border-portal-primary"
                : "bg-portal-panel text-portal-muted border-portal-panel-border hover:text-portal-text"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">All Complaints</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : complaints.length === 0 ? (
          <p className="text-portal-muted text-sm">No complaints in this category.</p>
        ) : (
          <div className="space-y-4">
            {complaints.map((c) => (
              <div key={c.complaint_id} className="border border-portal-panel-border/60 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-portal-text font-medium">{c.subject}</p>
                    <p className="text-xs text-portal-muted">{c.citizen_name} • {c.citizen_email}</p>
                    {c.location && <p className="text-xs text-portal-muted">📍 {c.location}</p>}
                    <p className="text-xs text-portal-muted mt-1">Officer: {c.officer_name || "Unassigned"}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs shrink-0 ${STATUS_STYLES[c.status] || ""}`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-sm text-portal-muted mt-2">{c.description}</p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <select
                    value={assignDrafts[c.complaint_id] || ""}
                    onChange={(e) => setAssignDrafts((prev) => ({ ...prev, [c.complaint_id]: e.target.value }))}
                    className="text-xs rounded-lg bg-[#0b1120] border border-portal-panel-border px-2 py-1.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
                  >
                    <option value="">Select officer</option>
                    {officers.map((o) => (
                      <option key={o.user_id} value={o.user_id}>
                        {o.full_name} — {o.active_workload === 0 ? "Free" : `Busy (${o.active_workload})`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssign(c.complaint_id)}
                    className="text-xs bg-portal-primary/15 text-portal-primary px-2.5 py-1 rounded-lg hover:bg-portal-primary/25"
                  >
                    Assign
                  </button>
                  {c.status !== "Escalated" && c.status !== "Closed" && (
                    <button
                      onClick={() => handleEscalate(c.complaint_id)}
                      className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                    >
                      Escalate
                    </button>
                  )}
                  {c.status !== "Closed" && (
                    <button
                      onClick={() => handleClose(c.complaint_id)}
                      className="text-xs bg-portal-muted/15 text-portal-muted px-2.5 py-1 rounded-lg hover:bg-portal-muted/25"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
