import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useLanguage } from "../context/LanguageContext";
import PreferenceToggles from "../components/PreferenceToggles";

// Public page — no login required, matches GET /api/notices which is
// intentionally unauthenticated on the backend.
export default function PublicNotices() {
  const { t } = useLanguage();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/notices")
      .then((res) => setNotices(res.data.notices))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-portal-bg text-portal-text">
      <header className="border-b border-portal-panel-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold flex items-center gap-2">
            🏛️ {t("app.name")}
          </Link>
          <div className="flex items-center gap-3">
            <PreferenceToggles />
            <Link to="/login" className="text-sm text-portal-primary hover:underline">
              Login / Register
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-semibold mb-6">Notices & Announcements</h1>

        {loading ? (
          <p className="text-portal-muted text-sm">Loading...</p>
        ) : notices.length === 0 ? (
          <p className="text-portal-muted text-sm">No notices published yet.</p>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <div key={n.notice_id} className="bg-portal-panel border border-portal-panel-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-portal-text">{n.title}</p>
                  <span className="text-xs text-portal-muted">
                    {new Date(n.publish_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-portal-muted">{n.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
