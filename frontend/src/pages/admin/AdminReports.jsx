import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

function Table({ title, columns, rows }) {
  return (
    <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
      <h3 className="font-medium text-portal-text mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-portal-muted text-sm">No data yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-portal-muted border-b border-portal-panel-border">
              {columns.map((c) => <th key={c.key} className="pb-2 font-normal">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-portal-panel-border/50">
                {columns.map((c) => (
                  <td key={c.key} className="py-2 text-portal-text">{row[c.key] ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminReports() {
  const { t } = useLanguage();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/reports").then((res) => setReport(res.data.report)).finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title={t("title.adminReports")}>
      {loading || !report ? (
        <p className="text-portal-muted text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <Table
            title="Citizens by Account Status"
            columns={[{ key: "status", label: "Status" }, { key: "count", label: "Count" }]}
            rows={report.citizenStats}
          />
          <Table
            title="Businesses by Status"
            columns={[{ key: "status", label: "Status" }, { key: "count", label: "Count" }]}
            rows={report.businessStats}
          />
          <Table
            title="Officers by Verification Status"
            columns={[{ key: "officer_status", label: "Status" }, { key: "count", label: "Count" }]}
            rows={report.officerStats}
          />
          <Table
            title="Complaints by Status"
            columns={[{ key: "status", label: "Status" }, { key: "count", label: "Count" }]}
            rows={report.complaintStats}
          />
          <Table
            title="Applications by Type & Status"
            columns={[
              { key: "certificate_type", label: "Type" },
              { key: "status", label: "Status" },
              { key: "count", label: "Count" },
            ]}
            rows={report.applicationStats}
          />
          <Table
            title="Orders by Status"
            columns={[
              { key: "order_status", label: "Status" },
              { key: "count", label: "Count" },
              { key: "total", label: "Total (Rs.)" },
            ]}
            rows={report.orderStats}
          />
          <Table
            title="Payments / Transactions"
            columns={[
              { key: "payment_method", label: "Method" },
              { key: "payment_status", label: "Status" },
              { key: "count", label: "Count" },
              { key: "total", label: "Total (Rs.)" },
            ]}
            rows={report.paymentStats}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
