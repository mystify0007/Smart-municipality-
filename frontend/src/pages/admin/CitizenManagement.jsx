import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function CitizenManagement() {
  const { t } = useLanguage();
  const [citizens, setCitizens] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(null);

  async function loadCitizens() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await api.get(`/admin/citizens?${params.toString()}`);
      setCitizens(res.data.citizens);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(loadCitizens, 300);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  async function openDetail(id) {
    try {
      const res = await api.get(`/admin/citizens/${id}`);
      setSelected(res.data);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to load citizen" });
    }
  }

  async function toggleStatus(id, currentStatus) {
    const nextStatus = currentStatus === "Blocked" ? "Active" : "Blocked";
    setMessage(null);
    try {
      await api.patch(`/admin/users/${id}/status`, { status: nextStatus });
      setMessage({ type: "success", text: `Account ${nextStatus.toLowerCase()}.` });
      loadCitizens();
      if (selected?.citizen?.user_id === id) {
        setSelected((s) => ({ ...s, citizen: { ...s.citizen, status: nextStatus } }));
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.citizenManagement")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="flex gap-3 mb-4">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="flex-1 rounded-lg bg-portal-panel border border-portal-panel-border px-3 py-2.5 text-sm text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
        />
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-portal-panel border border-portal-panel-border px-3 py-2.5 text-sm text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Blocked">Blocked</option>
        </select>
      </div>

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : citizens.length === 0 ? (
          <p className="text-portal-muted text-sm">No citizens found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Name</th>
                <th className="pb-2 font-normal">Email</th>
                <th className="pb-2 font-normal">Phone</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {citizens.map((c) => (
                <tr key={c.user_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">
                    <button onClick={() => openDetail(c.user_id)} className="hover:underline">{c.full_name}</button>
                  </td>
                  <td className="py-3 text-portal-muted">{c.email}</td>
                  <td className="py-3 text-portal-muted">{c.phone || "—"}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${
                      c.status === "Blocked" ? "bg-portal-danger/15 text-portal-danger" : "bg-portal-success/15 text-portal-success"
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleStatus(c.user_id, c.status)}
                      className={`text-xs px-2.5 py-1 rounded-lg ${
                        c.status === "Blocked"
                          ? "bg-portal-success/15 text-portal-success hover:bg-portal-success/25"
                          : "bg-portal-danger/15 text-portal-danger hover:bg-portal-danger/25"
                      }`}
                    >
                      {c.status === "Blocked" ? "Activate" : "Deactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-portal-text">{selected.citizen.full_name}</h3>
              <button onClick={() => setSelected(null)} className="text-portal-muted hover:text-portal-text">✕</button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div><dt className="text-portal-muted">Email</dt><dd className="text-portal-text">{selected.citizen.email}</dd></div>
              <div><dt className="text-portal-muted">Phone</dt><dd className="text-portal-text">{selected.citizen.phone || "—"}</dd></div>
              <div><dt className="text-portal-muted">Citizenship No.</dt><dd className="text-portal-text">{selected.citizen.citizenship_no || "—"}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="text-portal-text">{selected.citizen.status}</dd></div>
            </dl>

            <p className="text-sm font-medium text-portal-text mb-2">Certificate Applications ({selected.certificates.length})</p>
            <ul className="space-y-1 mb-4 text-sm">
              {selected.certificates.length === 0 ? (
                <li className="text-portal-muted">None</li>
              ) : selected.certificates.map((c) => (
                <li key={c.certificate_id} className="text-portal-muted">
                  {c.certificate_type} — <span className="text-portal-text">{c.status}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium text-portal-text mb-2">Complaints ({selected.complaints.length})</p>
            <ul className="space-y-1 mb-4 text-sm">
              {selected.complaints.length === 0 ? (
                <li className="text-portal-muted">None</li>
              ) : selected.complaints.map((c) => (
                <li key={c.complaint_id} className="text-portal-muted">
                  {c.subject} — <span className="text-portal-text">{c.status}</span>
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium text-portal-text mb-2">Orders ({selected.orders.length})</p>
            <ul className="space-y-1 text-sm">
              {selected.orders.length === 0 ? (
                <li className="text-portal-muted">None</li>
              ) : selected.orders.map((o) => (
                <li key={o.order_id} className="text-portal-muted">
                  Order #{o.order_id} — Rs. {o.total_amount} — <span className="text-portal-text">{o.order_status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
