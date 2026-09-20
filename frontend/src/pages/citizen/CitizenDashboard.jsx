import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Processing: "bg-portal-primary/15 text-portal-primary",
  Approved: "bg-portal-success/15 text-portal-success",
  Completed: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
};

export default function CitizenDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [reqRes, statsRes] = await Promise.all([
          api.get("/citizen/requests"),
          api.get("/citizen/stats"),
        ]);
        setRequests(reqRes.data.requests);
        setStats(statsRes.data.stats);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCount = (status) => stats.find((s) => s.status === status)?.count || 0;

  return (
    <DashboardLayout title={t("title.citizenDashboard")}>
      <div className="bg-gradient-to-r from-portal-primary/20 to-transparent border border-portal-panel-border rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-portal-text">👋 Welcome back{user?.full_name ? `, ${user.full_name}` : ""}</h2>
        <p className="text-portal-muted text-sm mt-1">Here's what's happening in your account today.</p>
      </div>

      {!user?.municipality_id && (
        <div className="bg-portal-accent/10 border border-portal-accent/30 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-portal-text">
            Complete your profile — add your name, address, and municipality — to apply for certificates, pay tax, or file complaints.
          </p>
          <Link
            to="/citizen/profile"
            className="shrink-0 text-sm px-4 py-2 rounded-lg bg-portal-primary text-white hover:bg-portal-primary-hover"
          >
            Complete Profile
          </Link>
        </div>
      )}

      {error && <p className="text-portal-danger mb-4">{error}</p>}

      <div className="grid grid-cols-5 gap-4 mb-6">
        {["Pending", "Processing", "Approved", "Rejected"].map((status) => (
          <div key={status} className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">{status}</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{statCount(status)}</p>
          </div>
        ))}
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
          <p className="text-xs text-portal-muted uppercase tracking-wide">Total Requests</p>
          <p className="text-2xl font-semibold text-portal-text mt-1">{requests.length}</p>
        </div>
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">Recent Requests</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-portal-muted text-sm">No requests yet. Apply for a certificate to get started.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Request ID</th>
                <th className="pb-2 font-normal">Service</th>
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.certificate_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">REQ-{String(r.certificate_id).padStart(4, "0")}</td>
                  <td className="py-3 text-portal-text">{r.certificate_type} Certificate</td>
                  <td className="py-3 text-portal-muted">{new Date(r.applied_date).toLocaleDateString()}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[r.status] || ""}`}>
                      {r.status}
                    </span>
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
