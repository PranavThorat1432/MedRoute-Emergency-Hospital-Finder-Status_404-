import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { backendURL } from '../App'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${backendURL}/api/admin/login`, form)
      localStorage.setItem('adminToken', res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 tech-grid flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/2 translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-cyan-500/30 glow-cyan">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight">MedRoute Admin</h1>
          <p className="text-cyan-400/70 text-sm mt-1 font-medium">Hospital Management Panel</p>
        </div>

        {/* Card */}
        <div className="card p-8 shadow-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                placeholder="admin"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/50"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div className="mt-5 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-400 text-center">
            Default: <span className="text-cyan-400 font-mono">admin</span> / <span className="text-cyan-400 font-mono">medroute2024</span>
          </div>
        </div>
      </div>
    </div>
  )
}
