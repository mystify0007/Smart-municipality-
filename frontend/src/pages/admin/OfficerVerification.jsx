import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const STATUS_FILTERS = ["All", "Pending", "Approved", "Rejected", "Suspended"];

const STATUS_STYLES = {
  Pending: "bg-portal-accent/15 text-portal-accent",
  Approved: "bg-portal-success/15 text-portal-success",
  Rejected: "bg-portal-danger/15 text-portal-danger",
  Suspended: "bg-portal-danger/15 text-portal-danger",
};

export default function OfficerVerification() {
  const { t } = useLanguage();
  const [officers, setOfficers] = useState([]);
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectFor, setShowRejectFor] = useState(null);

  async function loadOfficers() {
    setLoading(true);
    try {
      const query = filter !== "All" ? `?status=${filter}` : "";
      const res = await api.get(`/admin/officers${query}`);
      setOfficers(res.data.officers);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOfficers(); }, [filter]);

  async function openDetail(officerId) {
    try {
      const res = await api.get(`/admin/officers/${officerId}`);
      setSelected(res.data.officer);
      setDocuments(res.data.documents);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to load officer" });
    }
  }

  async function runAction(officerId, action, body) {
    setMessage(null);
    try {
      await api.patch(`/admin/officers/${officerId}/${action}`, body);
      setMessage({ type: "success", text: `Officer ${action}d.` });
      setSelected(null);
      setShowRejectFor(null);
      setRejectReason("");
      loadOfficers();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Action failed" });
    }
  }

  return (
    <DashboardLayout title={t("title.officerVerification")}>
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
        <h3 className="font-medium text-portal-text mb-4">Officer Registrations</h3>
        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : officers.length === 0 ? (
          <p className="text-portal-muted text-sm">No officers in this category.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-portal-muted border-b border-portal-panel-border">
                <th className="pb-2 font-normal">Name</th>
                <th className="pb-2 font-normal">Email</th>
                <th className="pb-2 font-normal">Department</th>
                <th className="pb-2 font-normal">Designation</th>
                <th className="pb-2 font-normal">Status</th>
                <th className="pb-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.user_id} className="border-b border-portal-panel-border/50">
                  <td className="py-3 text-portal-text">
                    <button onClick={() => openDetail(o.user_id)} className="hover:underline">{o.full_name}</button>
                  </td>
                  <td className="py-3 text-portal-muted">{o.email}</td>
                  <td className="py-3 text-portal-muted">{o.department}</td>
                  <td className="py-3 text-portal-muted">{o.designation}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_STYLES[o.officer_status] || ""}`}>
                      {o.officer_status}
                    </span>
                  </td>
                  <td className="py-3 space-x-2">
                    {o.officer_status === "Pending" && (
                      <>
                        <button
                          onClick={() => runAction(o.user_id, "approve")}
                          className="text-xs bg-portal-success/15 text-portal-success px-2.5 py-1 rounded-lg hover:bg-portal-success/25"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setShowRejectFor(o.user_id)}
                          className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {o.officer_status === "Approved" && (
                      <button
                        onClick={() => runAction(o.user_id, "suspend")}
                        className="text-xs bg-portal-danger/15 text-portal-danger px-2.5 py-1 rounded-lg hover:bg-portal-danger/25"
                      >
                        Suspend
                      </button>
                    )}
                    {o.officer_status === "Suspended" && (
                      <button
                        onClick={() => runAction(o.user_id, "activate")}
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

      {showRejectFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-medium text-portal-text mb-3">Reject Officer</h3>
            <textarea
              rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection"
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowRejectFor(null); setRejectReason(""); }}
                className="text-sm px-4 py-2 rounded-lg text-portal-muted hover:text-portal-text"
              >
                Cancel
              </button>
              <button
                onClick={() => runAction(showRejectFor, "reject", { reason: rejectReason })}
                disabled={!rejectReason}
                className="text-sm px-4 py-2 rounded-lg bg-portal-danger text-white disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-portal-text">{selected.full_name}</h3>
              <button onClick={() => setSelected(null)} className="text-portal-muted hover:text-portal-text">✕</button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div><dt className="text-portal-muted">Email</dt><dd className="text-portal-text">{selected.email}</dd></div>
              <div><dt className="text-portal-muted">Phone</dt><dd className="text-portal-text">{selected.phone || "—"}</dd></div>
              <div><dt className="text-portal-muted">Department</dt><dd className="text-portal-text">{selected.department}</dd></div>
              <div><dt className="text-portal-muted">Designation</dt><dd className="text-portal-text">{selected.designation}</dd></div>
              <div><dt className="text-portal-muted">Address</dt><dd className="text-portal-text">{selected.address || "—"}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="text-portal-text">{selected.officer_status}</dd></div>
              {selected.rejection_reason && (
                <div className="col-span-2">
                  <dt className="text-portal-muted">Rejection Reason</dt>
                  <dd className="text-portal-text">{selected.rejection_reason}</dd>
                </div>
              )}
            </dl>
            <p className="text-sm text-portal-muted mb-2">Submitted Documents</p>
            {documents.length === 0 ? (
              <p className="text-sm text-portal-muted">No documents submitted.</p>
            ) : (
              <ul className="space-y-1">
                {documents.map((d) => (
                  <li key={d.document_id}>
                    <a
                      href={d.file_path} target="_blank" rel="noreferrer"
                      className="text-sm text-portal-primary hover:underline"
                    >
                      View document ({new Date(d.uploaded_at).toLocaleDateString()})
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
