import PreferenceToggles from "../../components/PreferenceToggles";

// Officer and the three Admin scopes each have their own dedicated login
// page/route now (see OfficerLogin.jsx, MunicipalityAdminLogin.jsx,
// ProvinceAdminLogin.jsx, StateAdminLogin.jsx) instead of one shared form —
// this page is just the entry point that routes a visitor to the right one.
const PORTALS = [
  {
    label: "Officer",
    href: "/officer/login",
    description: "Verify citizens, and manage your assigned applications and complaints.",
  },
  {
    label: "Municipality Admin",
    href: "/admin/login",
    description: "Run one Municipality's day-to-day operations.",
  },
  {
    label: "Province Admin",
    href: "/admin/province/login",
    description: "Oversee every Municipality onboarded in one Province.",
  },
  {
    label: "State Admin",
    href: "/admin/state/login",
    description: "Oversee every Province across the platform.",
  },
];

export default function StaffLogin() {
  return (
    <div className="min-h-screen portal-photo-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />

      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-[#101a30] border border-slate-700 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">Smart Municipality Portal</h1>
        <p className="text-xs tracking-widest text-amber-500 mt-1 uppercase">Staff Secure Access</p>
      </div>

      <div className="w-full max-w-sm bg-[#101a30] border border-slate-700 rounded-xl p-8">
        <h2 className="text-lg font-medium text-slate-100 text-center mb-6">Which portal do you need?</h2>

        <div className="space-y-3">
          {PORTALS.map((p) => (
            <a
              key={p.href}
              href={p.href}
              className="block rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 hover:border-blue-500 transition-colors"
            >
              <p className="text-slate-100 font-medium">{p.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
            </a>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-slate-500 hover:underline">
            ← Citizen Login
          </a>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-500 text-center max-w-sm">
        Unauthorized access is strictly prohibited. Secured by National Digital Identity framework.
      </p>
    </div>
  );
}
