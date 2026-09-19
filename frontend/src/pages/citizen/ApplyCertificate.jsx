import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

const CERTIFICATE_TYPES = ["Birth", "Marriage", "Death", "Residence", "Business", "Character"];

export default function ApplyCertificate() {
  const { t } = useLanguage();
  const [certificateType, setCertificateType] = useState(CERTIFICATE_TYPES[0]);
  const [purpose, setPurpose] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      // multipart/form-data because a file may be attached
      const formData = new FormData();
      formData.append("certificate_type", certificateType);
      formData.append("purpose", purpose);
      if (file) formData.append("document", file);

      await api.post("/certificates/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Application submitted successfully!" });
      setPurpose("");
      setFile(null);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Submission failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title={t("title.applyCertificate")}>
      <div className="max-w-lg bg-portal-panel border border-portal-panel-border rounded-xl p-6">
        <h3 className="font-medium text-portal-text mb-4">Apply for a Certificate</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Certificate Type</label>
            <select
              value={certificateType} onChange={(e) => setCertificateType(e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            >
              {CERTIFICATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Purpose</label>
            <input
              required value={purpose} onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Bank account opening"
              className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Supporting Document (optional)</label>
            <input
              type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-portal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-portal-primary file:text-white file:text-sm hover:file:bg-portal-primary-hover"
            />
          </div>

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 border ${
              message.type === "success"
                ? "text-portal-success bg-portal-success/10 border-portal-success/30"
                : "text-portal-danger bg-portal-danger/10 border-portal-danger/30"
            }`}>
              {message.text}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
