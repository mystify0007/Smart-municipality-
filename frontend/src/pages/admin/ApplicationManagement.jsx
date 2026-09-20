import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_FILTERS = ["All", "Pending", "Processing", "Approved", "Rejected", "Completed"];

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Processing: "bg-portal-primary/15 text-portal-primary",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
  Completed: "bg-portal-success/15 text-portal-success",
};

export default function ApplicationManagement() {
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [assignDrafts, setAssignDrafts] = useState({});

  async function loadApplications() {
    setLoading(true);
    try {
      const query = filter !== "All" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/applications${query}`);
      setApplications(res.data.applications);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApplications(); }, [filter]);

  useEffect(() => {
    api.get("/admin/officers?status=Approved").then((res) => setOfficers(res.data.officers));
  }, []);

  async function handleAssign(id) {
    const officerId = assignDrafts[id];
    if (!officerId) return;
    setMessage(null);
    try {
      await api.patch(`/admin/applications/${id}/assign`, { officer_id: officerId });
      setMessage({ type: "success", text: "Application assigned." });
      loadApplications();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Assignment failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.applicationManagement")}>
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
        <h3 className="font-medium text-portal-text mb-4">All Applications</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : applications.length === 0 ? (
          <p className="text-portal-muted text-sm">No applications in this category.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Request ID</th>
                <th className="pb-2 font-normal">Citizen</th>
                <th className="pb-2 font-normal">Type</th>
                <th className="pb-2 font-normal">Document</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Assigned Officer</th>
                <th className="pb-2 font-normal">Assign</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.certificate_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">REQ-{String(a.certificate_id).padStart(4, "0")}</td>
                  <td className="py-3 text-portal-text">
                    {a.citizen_name}
                    <p className="text-xs text-portal-muted">{a.citizen_email}</p>
                  </td>
                  <td className="py-3 text-portal-muted">{a.certificate_type}</td>
                  <td className="py-3">
                    {a.document_path ? (
                      <a href={a.document_path} target="_blank" rel="noreferrer" className="text-xs text-portal-primary hover:underline">
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-portal-muted">—</span>
                    )}
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[a.status] || ""}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3 text-portal-muted">{a.officer_name || "Unassigned"}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={assignDrafts[a.certificate_id] || ""}
                        onChange={(e) => setAssignDrafts((prev) => ({ ...prev, [a.certificate_id]: e.target.value }))}
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
                        onClick={() => handleAssign(a.certificate_id)}
                        className="text-xs bg-portal-primary/15 text-portal-primary px-2.5 py-1 rounded-lg hover:bg-portal-primary/25"
                      >
                        Assign
                      </button>
                    </div>
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
