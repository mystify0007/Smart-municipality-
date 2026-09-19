import { useEffect, useRef, useState } from "react";
import api from "../api/axios";

// Polls for notifications every 30s and shows them in a dropdown. Styled to
// match PreferenceToggles' button language (same size/border/colors) since
// it sits right next to it in the dashboard topbar.
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  async function load() {
    try {
      const res = await api.get("/notifications/mine");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch {
      // Silent — a failed notification poll shouldn't disrupt the dashboard.
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkRead(id) {
    try {
      await api.patch(`/notifications/${id}/read`);
      load();
    } catch {
      // ignore
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.patch("/notifications/read-all");
      load();
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
        className="relative w-9 h-9 rounded-lg border border-portal-panel-border bg-portal-panel text-portal-text flex items-center justify-center hover:bg-white/5 transition-colors"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-portal-danger text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-portal-panel border border-portal-panel-border rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-portal-panel-border">
            <p className="text-sm font-medium text-portal-text">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-portal-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-portal-muted px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.notification_id}
                  onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                  className={`px-4 py-3 border-b border-portal-panel-border/50 last:border-0 cursor-pointer hover:bg-white/5 ${
                    n.is_read ? "" : "bg-portal-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-portal-text font-medium">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-portal-primary shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-portal-muted mt-0.5">{n.message}</p>
                  <p className="text-[11px] text-portal-muted/70 mt-1">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
