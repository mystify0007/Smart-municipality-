import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PreferenceToggles from "../../components/PreferenceToggles";

const STAFF_ROLES = ["Officer", "Admin"];

export default function StaffRegister() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    role: "Officer", address: "", employee_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/staff/register", form);
      setSuccess(true);
      setTimeout(() => navigate("/staff/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1120] flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />

      <div className="w-full max-w-md bg-[#101a30] border border-slate-700 rounded-xl p-8">
        <h2 className="text-lg font-medium text-slate-100 text-center mb-1">Staff Registration</h2>
        <p className="text-sm text-slate-400 text-center mb-6">Secure access for municipality officials</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Role</label>
            <select
              value={form.role} onChange={(e) => update("role", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Full Name</label>
            <input
              required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Government Employee ID</label>
            <input
              value={form.employee_id} onChange={(e) => update("employee_id", e.target.value)}
              placeholder="e.g. GOV-NPL-10294"
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Official Email</label>
              <input
                type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="name@gov.np"
                className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Mobile Number</label>
              <input
                value={form.phone} onChange={(e) => update("phone", e.target.value)}
                placeholder="+977..."
                className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Secure Password</label>
            <input
              type="password" required value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-lg bg-[#0b1120] border border-slate-700 px-3 py-2.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              Staff account created! Redirecting to login...
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Registering..." : "Register Administrator"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-slate-400">Already have clearance? </span>
          <a href="/staff/login" className="text-sm text-blue-400 hover:underline">Authenticate Here</a>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 text-center max-w-sm">
        🛡 Secured by National Digital Identity framework
      </p>
    </div>
  );
}
