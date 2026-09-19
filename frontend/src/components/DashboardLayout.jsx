// Shared sidebar + topbar shell matching the Figma dashboard screens
// (dark navy sidebar, active item highlighted, logout at the bottom).
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PreferenceToggles from "./PreferenceToggles";
import NotificationBell from "./NotificationBell";

// Nav items reference translation keys (translationKey), not literal text,
// so the sidebar relabels itself instantly when the language toggle is used.
const NAV_ITEMS = {
  Citizen: [
    { key: "nav.dashboard", path: "/citizen/dashboard" },
    { key: "nav.myRequests", path: "/citizen/requests" },
    { key: "nav.eSifaris", path: "/citizen/apply" },
    { key: "nav.taxPayment", path: "/citizen/tax" },
    { key: "nav.complaints", path: "/citizen/complaints" },
    { key: "nav.marketplace", path: "/marketplace" },
    { key: "nav.myCart", path: "/cart" },
    { key: "nav.myOrders", path: "/orders/mine" },
  ],
  Business: [
    { key: "nav.dashboard", path: "/business/dashboard" },
    { key: "nav.myProducts", path: "/business/products" },
    { key: "nav.orders", path: "/business/orders" },
    { key: "nav.marketplace", path: "/marketplace" },
  ],
  Officer: [
    { key: "nav.dashboard", path: "/officer/dashboard" },
    { key: "nav.myApplications", path: "/officer/applications" },
    { key: "nav.myComplaints", path: "/officer/complaints" },
    { key: "nav.reports", path: "/officer/reports" },
    { key: "nav.profile", path: "/officer/profile" },
  ],
  Admin: [
    { key: "nav.dashboard", path: "/admin/dashboard" },
    { key: "nav.officerVerification", path: "/admin/officers" },
    { key: "nav.citizenManagement", path: "/admin/citizens" },
    { key: "nav.businessApprovals", path: "/admin/businesses" },
    { key: "nav.municipalServices", path: "/admin/services" },
    { key: "nav.applicationManagement", path: "/admin/applications" },
    { key: "nav.complaintManagement", path: "/admin/complaints" },
    { key: "nav.marketplaceManagement", path: "/admin/marketplace" },
    { key: "nav.announcements", path: "/admin/notices" },
    { key: "nav.reports", path: "/admin/reports" },
    { key: "nav.systemSettings", path: "/admin/settings" },
    { key: "nav.profile", path: "/admin/profile" },
  ],
};

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navItems = NAV_ITEMS[user?.role] || [];

  return (
    <div className="min-h-screen portal-photo-bg flex">
      {/* Sidebar */}
      <aside className="w-60 bg-portal-panel border-r border-portal-panel-border flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-portal-panel-border">
          <p className="font-semibold text-portal-text leading-tight">{t("app.name")}</p>
          <p className="text-xs text-portal-muted">{t("app.tagline")}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-portal-primary text-white"
                    : "text-portal-muted hover:bg-white/5 hover:text-portal-text"
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-portal-panel-border">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-portal-danger hover:bg-portal-danger/10"
          >
            {t("action.logout")}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-portal-panel-border flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold text-portal-text">{title}</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <PreferenceToggles />
            <span className="text-sm text-portal-muted">{user?.full_name}</span>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
