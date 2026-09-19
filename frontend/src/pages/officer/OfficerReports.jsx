import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

function toCsv(certificateReport, complaintReport) {
  const lines = ["Report,Category,Status,Count"];
  certificateReport.forEach((r) =>
    lines.push(`Certificates,${r.certificate_type},${r.status},${r.count}`)
  );
  complaintReport.forEach((r) => lines.push(`Complaints,-,${r.status},${r.count}`));
  return lines.join("\n");
}

export default function OfficerReports() {
  const { t } = useLanguage();
  const [certificateReport, setCertificateReport] = useState([]);
  const [complaintReport, setComplaintReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/officer/reports")
      .then((res) => {
        setCertificateReport(res.data.certificateReport);
        setComplaintReport(res.data.complaintReport);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleDownload() {
    const csv = toCsv(certificateReport, complaintReport);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `municipality-service-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const totalCertificates = certificateReport.reduce((sum, r) => sum + r.count, 0);
  const totalComplaints = complaintReport.reduce((sum, r) => sum + r.count, 0);

  return (
    <DashboardLayout title={t("title.officerReports")}>
      <div className="flex items-center justify-between mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">Total Certificate Applications</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{totalCertificates}</p>
          </div>
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
            <p className="text-xs text-portal-muted uppercase tracking-wide">Total Complaints</p>
            <p className="text-2xl font-semibold text-portal-text mt-1">{totalComplaints}</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="text-sm bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2.5"
        >
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Certificates by Type &amp; Status</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : certificateReport.length === 0 ? (
            <p className="text-portal-muted text-sm">No certificate applications yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                  <th className="pb-2 font-normal">Type</th>
                  <th className="pb-2 font-normal">Status</th>
                  <th className="pb-2 font-normal">Count</th>
                </tr>
              </thead>
              <tbody>
                {certificateReport.map((r, i) => (
                  <tr key={i} className="border-b border-portal-panel-border/50">
                    <td className="py-2 text-portal-text">{r.certificate_type}</td>
                    <td className="py-2 text-portal-muted">{r.status}</td>
                    <td className="py-2 text-portal-text">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Complaints by Status</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : complaintReport.length === 0 ? (
            <p className="text-portal-muted text-sm">No complaints filed yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                  <th className="pb-2 font-normal">Status</th>
                  <th className="pb-2 font-normal">Count</th>
                </tr>
              </thead>
              <tbody>
                {complaintReport.map((r, i) => (
                  <tr key={i} className="border-b border-portal-panel-border/50">
                    <td className="py-2 text-portal-text">{r.status}</td>
                    <td className="py-2 text-portal-text">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
