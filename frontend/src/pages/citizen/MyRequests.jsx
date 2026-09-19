import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Processing: "bg-portal-primary/15 text-portal-primary",
  Approved: "bg-portal-success/15 text-portal-success",
  Completed: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
};

export default function MyRequests() {
  const { t } = useLanguage();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/citizen/requests")
      .then((res) => setRequests(res.data.requests))
      .catch((err) => setError(err.response?.data?.error || "Failed to load requests"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={t("title.myRequests")}>
      {error && <p className="text-portal-danger mb-4">{error}</p>}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="text-portal-muted text-sm">
            No requests yet. Use "e-Sifaris" in the sidebar to apply for a certificate.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Request ID</th>
                <th className="pb-2 font-normal">Service</th>
                <th className="pb-2 font-normal">Purpose</th>
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.certificate_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text align-top">REQ-{String(r.certificate_id).padStart(4, "0")}</td>
                  <td className="py-3 text-portal-text align-top">{r.certificate_type} Certificate</td>
                  <td className="py-3 text-portal-muted align-top">{r.purpose}</td>
                  <td className="py-3 text-portal-muted align-top">{new Date(r.applied_date).toLocaleDateString()}</td>
                  <td className="py-3 align-top">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 text-portal-muted align-top">
                    {r.remarks || "—"}
                    {r.additional_info_requested && (
                      <p className="text-xs text-portal-accent mt-1">
                        Officer needs more info: {r.additional_info_requested}
                      </p>
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
