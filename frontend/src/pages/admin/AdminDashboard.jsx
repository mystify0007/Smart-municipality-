import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const CARD_DEFS = [
  { key: "total_citizens", label: "Total Citizens" },
  { key: "total_businesses", label: "Total Businesses" },
  { key: "total_officers", label: "Total Officers" },
  { key: "pending_officer_verifications", label: "Pending Officer Verifications", accent: "text-portal-accent" },
  { key: "pending_applications", label: "Pending Applications", accent: "text-portal-accent" },
  { key: "pending_complaints", label: "Pending Complaints", accent: "text-portal-accent" },
  { key: "total_orders", label: "Total Orders" },
  { key: "pending_businesses", label: "Pending Business Approvals", accent: "text-portal-accent" },
];

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
      ) : !stats ? (
        <p className="text-portal-muted text-sm">No dashboard data available.</p>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {CARD_DEFS.map((card) => (
              <div key={card.key} className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
                <p className="text-xs text-portal-muted uppercase tracking-wide">{card.label}</p>
                <p className={`text-2xl font-semibold mt-1 ${card.accent || "text-portal-text"}`}>
                  {stats[card.key]}
                </p>
              </div>
            ))}
            <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
              <p className="text-xs text-portal-muted uppercase tracking-wide">Tax Revenue Collected</p>
              <p className="text-2xl font-semibold text-portal-success mt-1">Rs. {stats.total_revenue}</p>
            </div>
          </div>

          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
            <h3 className="font-medium text-portal-text mb-4">Recent Activity</h3>
            {stats.recent_activities.length === 0 ? (
              <p className="text-portal-muted text-sm">No recent activity.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {stats.recent_activities.map((a, i) => (
                  <li key={i} className="flex items-center justify-between border-b border-portal-panel-border/50 pb-2">
                    <div>
                      <span className="text-xs text-portal-primary uppercase tracking-wide mr-2">{a.type}</span>
                      <span className="text-portal-text">{a.description}</span>
                    </div>
                    <span className="text-xs text-portal-muted shrink-0 ml-3">
                      {new Date(a.occurred_at).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
