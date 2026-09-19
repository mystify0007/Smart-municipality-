import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const CARD_STATUSES = ["Pending", "Processing", "Approved", "Rejected", "Completed"];

export default function OfficerDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState([]);
  const [assignedComplaints, setAssignedComplaints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/officer/stats")
      .then((res) => {
        setStats(res.data.stats);
        setAssignedComplaints(res.data.assigned_complaints);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCount = (status) => stats.find((s) => s.status === status)?.count || 0;
  const totalAssigned = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <DashboardLayout title={t("title.officerDashboard")}>
      {loading ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">Assigned Applications</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{totalAssigned}</p>
          </div>
          {CARD_STATUSES.map((status) => (
            <div key={status} className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
              <p className="text-xs text-portal-muted uppercase tracking-wide">{status} Applications</p>
              <p className="text-2xl font-semibold text-portal-text mt-1">{statCount(status)}</p>
            </div>
          ))}
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">Assigned Complaints</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{assignedComplaints}</p>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
