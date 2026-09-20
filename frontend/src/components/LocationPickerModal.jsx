import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Leaflet's default marker icon resolves via relative URLs that break under
// Vite's bundling, so point it at the bundled asset URLs instead.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const NEPAL_CENTER = [28.3949, 84.124];

export default function LocationPickerModal({ onConfirm, onClose }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [coords, setCoords] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const map = L.map(mapRef.current).setView(NEPAL_CENTER, 7);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    function placeMarker(latlng) {
      if (markerRef.current) {
        markerRef.current.setLatLng(latlng);
      } else {
        markerRef.current = L.marker(latlng, { draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => setCoords(markerRef.current.getLatLng()));
      }
      setCoords(latlng);
    }

    map.on("click", (e) => placeMarker(e.latlng));

    // Best-effort convenience: center on the citizen's current position, but
    // never block the map on it — they still browse and click to confirm.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    return () => map.remove();
  }, []);

  async function handleConfirm() {
    if (!coords) return;
    setConfirming(true);
    const coordsText = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    let address = "";
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        address = data.display_name || "";
      }
    } catch {
      // Reverse geocoding is best-effort; the raw coordinates are still useful on their own.
    }
    onConfirm((address ? `${address} (${coordsText})` : coordsText).slice(0, 255));
    setConfirming(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-portal-panel border border-portal-panel-border rounded-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-portal-panel-border">
          <h3 className="font-medium text-portal-text">Browse the map to pick a location</h3>
          <button type="button" onClick={onClose} className="text-portal-muted hover:text-portal-text text-sm">✕</button>
        </div>

        <div ref={mapRef} className="h-80 w-full" />

        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-portal-panel-border">
          <p className="text-xs text-portal-muted">
            {coords
              ? `Selected: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
              : "Click anywhere on the map, or drag the pin, to choose the exact spot."}
          </p>
          <div className="flex gap-2 shrink-0">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-sm text-portal-muted hover:bg-white/5">
              Cancel
            </button>
            <button
              type="button" onClick={handleConfirm} disabled={!coords || confirming}
              className="px-4 py-2 rounded-lg bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white text-sm"
            >
              {confirming ? "Confirming..." : "Confirm location"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
