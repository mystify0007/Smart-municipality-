import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
  Suspended: "bg-portal-danger/15 text-portal-danger",
};

export default function ApproveBusinesses() {
  const { t } = useLanguage();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(null);

  async function loadBusinesses() {
    try {
      const res = await api.get("/admin/businesses");
      setBusinesses(res.data.businesses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBusinesses(); }, []);

  async function openDetail(id) {
    try {
      const res = await api.get(`/admin/businesses/${id}`);
      setSelected(res.data);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to load business" });
    }
  }

  async function handleDecision(businessId, status) {
    setMessage(null);
    try {
      await api.patch(`/admin/businesses/${businessId}`, { status });
      setMessage({ type: "success", text: `Business ${status.toLowerCase()}.` });
      loadBusinesses();
      setSelected(null);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Update failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.businessApprovals")}>
      {message && (
        <p className={`mb-4 text-sm rounded-lg px-3 py-2 border inline-block ${
          message.type === "success"
            ? "text-portal-success bg-portal-success/10 border-portal-success/30"
            : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
        }`}>
          {message.text}
        </p>
      )}

      <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">All Business Registrations</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : businesses.length === 0 ? (
          <p className="text-portal-muted text-sm">No businesses registered yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Business Name</th>
                <th className="pb-2 font-normal">Owner</th>
                <th className="pb-2 font-normal">Type</th>
                <th className="pb-2 font-normal">Contact</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.business_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">
                    <button onClick={() => openDetail(b.business_id)} className="hover:underline">{b.business_name}</button>
                  </td>
                  <td className="py-3 text-portal-text">{b.owner_name}</td>
                  <td className="py-3 text-portal-muted">{b.business_type || "—"}</td>
                  <td className="py-3 text-portal-muted">{b.email}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[b.status] || ""}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    {b.status === "Pending" && (
                      <>
                        <button
                          onClick={() => handleDecision(b.business_id, "Approved")}
                          className="text-xs bg-portal-success/15 text-portal-success px-2.5 py-1 rounded-lg hover:bg-portal-success/25"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecision(b.business_id, "Rejected")}
                          className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === "Approved" && (
                      <button
                        onClick={() => handleDecision(b.business_id, "Suspended")}
                        className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                      >
                        Suspend
                      </button>
                    )}
                    {b.status === "Suspended" && (
                      <button
                        onClick={() => handleDecision(b.business_id, "Approved")}
                        className="text-xs bg-portal-success/15 text-portal-success px-2.5 py-1 rounded-lg hover:bg-portal-success/25"
                      >
                        Reactivate
                      </button>
                    )}
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
              <h3 className="font-medium text-portal-text">{selected.business.business_name}</h3>
              <button onClick={() => setSelected(null)} className="text-portal-muted hover:text-portal-text">✕</button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div><dt className="text-portal-muted">Owner</dt><dd className="text-portal-text">{selected.business.owner_name}</dd></div>
              <div><dt className="text-portal-muted">Type</dt><dd className="text-portal-text">{selected.business.business_type || "—"}</dd></div>
              <div><dt className="text-portal-muted">PAN Number</dt><dd className="text-portal-text">{selected.business.pan_number || "—"}</dd></div>
              <div><dt className="text-portal-muted">Contact</dt><dd className="text-portal-text">{selected.business.email} / {selected.business.phone || "—"}</dd></div>
              <div><dt className="text-portal-muted">Address</dt><dd className="text-portal-text">{selected.business.address || "—"}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="text-portal-text">{selected.business.status}</dd></div>
            </dl>

            <p className="text-sm font-medium text-portal-text mb-2">Products ({selected.products.length})</p>
            <ul className="space-y-1 text-sm">
              {selected.products.length === 0 ? (
                <li className="text-portal-muted">No products listed</li>
              ) : selected.products.map((p) => (
                <li key={p.product_id} className="text-portal-muted">
                  {p.product_name} — Rs. {p.price} — <span className="text-portal-text">{p.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
