import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import PreferenceToggles from "../../components/PreferenceToggles";

// Officer is the ONLY role this form can submit — there is no role selector
// here at all, so an Admin account can never be created (or even requested)
// through public registration. See backend/controllers/authController.js
// (adminBootstrap) for the sole, protected path that creates the system's
// one Admin account.
export default function StaffRegister() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
    address: "", department: "", designation: "",
  });
  const [departments, setDepartments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/departments")
      .then((res) => setDepartments(res.data.departments))
      .catch(() => setDepartments([]));
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      documents.forEach((file) => formData.append("documents", file));

      await api.post("/auth/staff/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => navigate("/staff/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen portal-photo-bg flex flex-col items-center justify-center px-4 py-12 relative">
      <PreferenceToggles className="absolute top-4 right-4" />

      <div className="w-full max-w-md bg-portal-panel border border-portal-panel-border rounded-xl p-8">
        <h2 className="text-lg font-medium text-portal-text text-center mb-1">Officer Registration</h2>
        <p className="text-sm text-portal-muted text-center mb-6">
          Submitted registrations are reviewed by the Admin before you can log in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Full Name</label>
            <input
              required value={form.full_name} onChange={(e) => update("full_name", e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Official Email</label>
              <input
                type="email" required value={form.email} onChange={(e) => update("email", e.target.value)}
                placeholder="name@gov.np"
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Mobile Number</label>
              <input
                value={form.phone} onChange={(e) => update("phone", e.target.value)}
                placeholder="+977..."
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Department</label>
              <input
                required list="department-options" value={form.department}
                onChange={(e) => update("department", e.target.value)}
                placeholder="e.g. Revenue"
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
              <datalist id="department-options">
                {departments.map((d) => <option key={d.department_id} value={d.name} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm text-portal-muted mb-1.5">Designation</label>
              <input
                required value={form.designation} onChange={(e) => update("designation", e.target.value)}
                placeholder="e.g. Tax Officer"
                className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text placeholder-portal-muted/60 focus:outline-none focus:ring-2 focus:ring-portal-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">Secure Password</label>
            <input
              type="password" required value={form.password} onChange={(e) => update("password", e.target.value)}
              className="w-full rounded-lg bg-portal-bg border border-portal-panel-border px-3 py-2.5 text-portal-text focus:outline-none focus:ring-2 focus:ring-portal-primary"
            />
          </div>

          <div>
            <label className="block text-sm text-portal-muted mb-1.5">
              Identification / Qualification Documents
            </label>
            <input
              type="file" multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setDocuments(Array.from(e.target.files))}
              className="w-full text-sm text-portal-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-portal-primary file:text-white file:text-sm hover:file:bg-portal-primary-hover"
            />
            <p className="text-xs text-portal-muted mt-1">Up to 5 files, 5MB each. Images or PDF.</p>
          </div>

          {error && (
            <p className="text-sm text-portal-danger bg-portal-danger/10 border border-portal-danger/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-portal-success bg-portal-success/10 border border-portal-success/30 rounded-lg px-3 py-2">
              Registration submitted. Your account is pending Admin verification — redirecting to login...
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-portal-primary hover:bg-portal-primary-hover disabled:opacity-60 text-white font-medium rounded-lg py-2.5 transition-colors"
          >
            {loading ? "Submitting..." : "Submit Registration"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-portal-muted">Already verified? </span>
          <a href="/staff/login" className="text-sm text-portal-primary hover:underline">Log in here</a>
        </div>
      </div>

      <p className="mt-6 text-xs text-portal-muted text-center max-w-sm">
        🛡 Secured by National Digital Identity framework
      </p>
    </div>
  );
}
