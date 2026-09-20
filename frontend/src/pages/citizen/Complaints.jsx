import { useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

function extractCoords(text) {
  const m = /(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/.exec(text || "");
  return m ? { lat: m[1], lng: m[2] } : null;
}

export default function Complaints() {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [media, setMedia] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  async function loadComplaints() {
    try {
      const res = await api.get("/complaints/mine");
      setComplaints(res.data.complaints);
    } finally {
      setLoading(false);
    }
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation isn't supported by your browser. Please type your location manually.");
      return;
    }
    setLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordsText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        let address = "";
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { Accept: "application/json" } }
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name || "";
          }
        } catch {
          // Reverse geocoding is best-effort; the raw coordinates below are enough on their own.
        }
        setLocation((address ? `${address} (${coordsText})` : coordsText).slice(0, 255));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Please enable it or type your location manually."
            : "Couldn't detect your location. Please type it manually."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  useEffect(() => {
    loadComplaints();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("location", location);
      if (media) formData.append("media", media);

      await api.post("/complaints", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage({ type: "success", text: "Complaint submitted." });
      setSubject("");
      setDescription("");
      setLocation("");
      setMedia(null);
      loadComplaints();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to submit" });
    }
  }

  function isVideo(path) {
    return /\.(mp4|webm|mov)$/i.test(path || "");
  }

  return (
    <DashboardLayout title={t("title.complaints")}>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">Submit a Complaint</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Subject</label>
              <input
                required value={subject} onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Location</label>
              <div className="flex gap-2">
                <input
                  value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder={locating ? "Detecting your current location..." : "e.g. Ward 5, Suryabinayak"}
                  className="flex-1 rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
                />
                <button
                  type="button" onClick={detectLocation} disabled={locating}
                  className="shrink-0 px-3 py-2.5 rounded-lg bg-portal-primary/80 hover:bg-portal-primary disabled:opacity-60 text-white text-sm whitespace-nowrap"
                >
                  {locating ? "Detecting..." : "📍 Use my location"}
                </button>
              </div>
              {locationError ? (
                <p className="text-xs text-portal-danger mt-1">{locationError}</p>
              ) : (
                <p className="text-xs text-portal-muted mt-1">
                  Type the location yourself, or click "Use my location" to fill it in from your GPS.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Description</label>
              <textarea
                required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-[#0b1120] border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Photo or Video Evidence (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf,video/mp4,video/webm,video/quicktime"
                onChange={(e) => setMedia(e.target.files[0])}
                className="w-full text-sm text-portal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-portal-primary file:text-white file:text-sm hover:file:bg-portal-primary-hover"
              />
              <p className="text-xs text-portal-muted mt-1">Max 25MB. Images, PDF, or short video clips.</p>
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
            <button className="w-full bg-portal-primary hover:bg-portal-primary-hover text-white font-medium rounded-lg py-2.5">
              Submit
            </button>
          </form>
        </div>

        <div className="bg-portal-panel border border-portal-panel-border rounded-xl p-6">
          <h3 className="font-medium text-portal-text mb-4">My Complaints</h3>
          {loading ? (
            <p className="text-portal-muted text-sm">Loading...</p>
          ) : complaints.length === 0 ? (
            <p className="text-portal-muted text-sm">No complaints filed yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {complaints.map((c) => (
                <li key={c.complaint_id} className="border-b border-portal-panel-border/50 pb-2">
                  <p className="text-portal-text font-medium">{c.subject}</p>
                  {c.location && (
                    <p className="text-portal-muted text-xs">
                      📍 {c.location}
                      {extractCoords(c.location) && (
                        <a
                          href={`https://www.google.com/maps?q=${extractCoords(c.location).lat},${extractCoords(c.location).lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-portal-primary underline ml-1"
                        >
                          View on map
                        </a>
                      )}
                    </p>
                  )}
                  <p className="text-portal-muted">{c.description}</p>
                  {c.image && (
                    isVideo(c.image) ? (
                      <video src={c.image} controls className="mt-2 rounded-lg max-h-40" />
                    ) : (
                      <img src={c.image} alt="evidence" className="mt-2 rounded-lg max-h-40 object-cover" />
                    )
                  )}
                  <div>
                    <span className="text-xs text-portal-accent">{c.status}</span>
                  </div>
                  {c.officer_response && (
                    <p className="text-xs text-portal-muted mt-1">
                      <span className="text-portal-text">Officer response:</span> {c.officer_response}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
