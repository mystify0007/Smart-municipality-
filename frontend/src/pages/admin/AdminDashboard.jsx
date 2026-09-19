import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data.stats);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardLayout title={t("title.adminOverview")}>
      {error && <p className="text-portal-danger mb-4">{error}</p>}
      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
              <p className="text-xs text-portal-muted uppercase tracking-wide">Total Users</p>
              <p className="text-2xl font-semibold text-portal-text mt-1">{stats.total_users}</p>
            </div>
            <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
              <p className="text-xs text-portal-muted uppercase tracking-wide">Tax Revenue</p>
              <p className="text-2xl font-semibold text-portal-success mt-1">Rs. {stats.total_revenue}</p>
            </div>
            <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
              <p className="text-xs text-portal-muted uppercase tracking-wide">Pending Applications</p>
              <p className="text-2xl font-semibold text-portal-accent mt-1">{stats.pending_applications}</p>
            </div>
          </div>

          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
            <h3 className="font-medium text-portal-text mb-4">Users by Role</h3>
            <ul className="space-y-2 text-sm">
              {stats.users_by_role.map((r) => (
                <li key={r.role} className="flex justify-between border-b border-portal-panel-border/50 pb-2">
                  <span className="text-portal-text">{r.role}</span>
                  <span className="text-portal-muted">{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
