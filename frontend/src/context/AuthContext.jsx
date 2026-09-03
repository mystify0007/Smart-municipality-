import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

// Maps backend role strings -> dashboard route.
// Adjust the keys here if your backend's role field uses different casing/values.
export const ROLE_DASHBOARD = {
  admin: '/admin',
  officer: '/officer',
  business: '/business',
  citizen: '/citizen',
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const persistSession = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    // Expecting { token, user: { role, ... } } — adjust field names to match
    // the actual backend response shape once we verify it against the README.
    const token = data.token
    const user = data.user
    persistSession(token, user)
    return user
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    if (data.token && data.user) {
      persistSession(data.token, data.user)
    }
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const value = { user, token, isAuthenticated: !!token, login, register, logout }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
