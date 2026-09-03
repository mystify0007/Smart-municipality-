import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth, ROLE_DASHBOARD } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      const dest = ROLE_DASHBOARD[user?.role] || '/'
      navigate(dest, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen pt-3 relative"
      style={{
        backgroundImage:
          'linear-gradient(rgba(11,19,38,0.8), rgba(11,19,38,0.8)), linear-gradient(to top, #0b1326, rgba(11,19,38,0.5) 50%, rgba(11,19,38,0))',
        backgroundColor: '#0b1326',
      }}
    >
      <div className="flex flex-col gap-8 w-full max-w-[448px] px-4">
        {/* Brand header */}
        <div className="flex flex-col items-center gap-2">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dae2fd" strokeWidth="1.5">
            <path d="M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="font-semibold text-[#dae2fd] text-3xl text-center pt-2">
            Smart Municipality Portal
          </h1>
          <p className="font-mono font-medium text-[#ffb95f] text-xs tracking-[1.2px] uppercase">
            Secure Access
          </p>
        </div>

        {/* Auth card */}
        <div className="backdrop-blur-[10px] bg-[rgba(11,19,38,0.7)] border border-white/10 flex flex-col gap-6 p-8 rounded-xl shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <h2 className="font-medium text-[#dae2fd] text-xl text-center">Sign In</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-[#c3c6d7] text-sm">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[#0a0f1d] border border-white/10 rounded-lg px-4 py-3 text-[#dae2fd] placeholder:text-[#434655] outline-none focus:border-portal-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-[#c3c6d7] text-sm">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0a0f1d] border border-white/10 rounded-lg px-4 py-3 text-[#dae2fd] placeholder:text-[#434655] outline-none focus:border-portal-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d7] text-xs"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-portal-primary text-[#002a78] font-medium text-lg rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#c3c6d7] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-portal-link">
              Register
            </Link>
          </p>
        </div>

        <p className="text-center text-[#c3c6d7] text-sm opacity-70">
          Unauthorized access is strictly prohibited.
          <br />© 2026 Government of Nepal.
        </p>
      </div>
    </div>
  )
}
