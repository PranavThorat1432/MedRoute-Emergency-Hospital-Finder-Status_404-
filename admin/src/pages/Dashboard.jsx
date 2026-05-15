import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import AvailabilityEditor from '../components/AvailabilityEditor'

function StatusDot({ available, total }) {
  const pct = total ? available / total : 0
  const color = pct === 0 ? 'bg-red-500' : pct <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [hospitals, setHospitals] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, emergency: 0, withBeds: 0 })
  const [holds, setHolds] = useState([])
  const [holdAction, setHoldAction] = useState(null)

  async function loadHolds() {
    try {
      const res = await api.get('/holds?status=active')
      setHolds(res.data.data || [])
    } catch {
      setHolds([])
    }
  }

  async function load() {
    setLoading(true)
    try {
      const res = await api.get('/hospitals')
      setHospitals(res.data.data)
      setStats({
        total: res.data.data.length,
        emergency: res.data.data.filter((h) => h.emergency).length,
        withBeds: res.data.data.filter((h) => h.beds?.available > 0).length,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    loadHolds()
    const t = setInterval(loadHolds, 12000)
    return () => clearInterval(t)
  }, [])

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await api.delete(`/hospitals/${id}`)
      await load()
    } finally {
      setDeleting(null)
    }
  }

  function handleLogout() {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  const filtered = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 tech-grid">
      {/* Top Nav */}
      <nav className="glass border-b border-slate-700/50 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 glow-cyan">
            <span className="text-lg">🏥</span>
          </div>
          <div>
            <span className="font-display font-bold text-white text-lg tracking-tight">MedRoute</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-cyan-400 font-mono">ADMIN PANEL</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {holds.length > 0 && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg shadow-lg shadow-amber-500/20">
              Active holds: {holds.length}
            </span>
          )}
          <button
            onClick={() => navigate('/hospitals/new')}
            className="btn-primary flex items-center gap-1.5"
          >
            <span>+</span>
            <span className="hidden sm:inline">Add Hospital</span>
          </button>
          <button onClick={handleLogout} className="btn-ghost">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active bed holds */}
        <div className="card border border-amber-500/30 mb-8 overflow-hidden bg-amber-500/5">
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between bg-amber-500/10">
            <h2 className="font-display font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-lg shadow-amber-500/50" />
              Active patient holds (20 min)
            </h2>
            <button type="button" onClick={() => { loadHolds(); load() }} className="text-xs text-cyan-400 hover:underline">
              Refresh
            </button>
          </div>
          {holds.length === 0 ? (
            <p className="text-slate-500 text-sm px-4 py-6">No active holds. New holds appear here within ~12s.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left text-xs text-slate-400 uppercase">
                    <th className="px-4 py-2">Hospital</th>
                    <th className="px-4 py-2">Resource</th>
                    <th className="px-4 py-2 hidden sm:table-cell">Session</th>
                    <th className="px-4 py-2">Expires</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {holds.map((h) => (
                    <tr key={h._id} className="border-b border-slate-700/30 text-slate-300 hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-2 font-medium text-white">
                        {h.hospital?.name || '—'}
                      </td>
                      <td className="px-4 py-2">{h.resourceType}</td>
                      <td className="px-4 py-2 hidden sm:table-cell font-mono text-xs truncate max-w-[140px] text-cyan-400">
                        {h.sessionId}
                      </td>
                      <td className="px-4 py-2 text-xs whitespace-nowrap">
                        {new Date(h.expiresAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            disabled={holdAction === h._id}
                            onClick={async () => {
                              if (!confirm('Confirm this hold? Slot stays reserved for incoming patient.')) return
                              setHoldAction(h._id)
                              try {
                                await api.post(`/holds/${h._id}/confirm`)
                                await loadHolds()
                                await load()
                              } finally {
                                setHoldAction(null)
                              }
                            }}
                            className="btn bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30 px-2 py-1"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            disabled={holdAction === h._id}
                            onClick={async () => {
                              if (!confirm('Cancel hold and free this slot?')) return
                              setHoldAction(h._id)
                              try {
                                await api.post(`/holds/${h._id}/cancel`)
                                await loadHolds()
                                await load()
                              } finally {
                                setHoldAction(null)
                              }
                            }}
                            className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30 px-2 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard icon="🏥" label="Total Hospitals" value={stats.total} color="bg-cyan-500/10 border-cyan-500/30" />
          <StatCard icon="🚨" label="Emergency Ready" value={stats.emergency} color="bg-red-500/10 border-red-500/30" />
          <StatCard icon="🛏️" label="Beds Available" value={stats.withBeds} color="bg-emerald-500/10 border-emerald-500/30" />
        </div>

        {/* Title + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
          <h2 className="font-display font-bold text-xl text-white flex-1">Hospital Management</h2>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 w-64 bg-slate-800/50 border-slate-700/50 focus:border-cyan-500/50 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading hospitals...
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Hospital</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Beds</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">ICU</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Emergency</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((h) => (
                    <Fragment key={h._id}>
                      <tr
                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={h.image}
                              alt={h.name}
                              className="w-10 h-10 rounded-xl object-cover flex-shrink-0 border border-slate-700/50"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                            <div>
                              <div className="font-semibold text-white text-sm">{h.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5 hidden sm:block">{h.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <StatusDot available={h.beds?.available} total={h.beds?.total} />
                            <span className="text-sm text-slate-300">
                              {h.beds?.available}/{h.beds?.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <StatusDot available={h.icu?.available} total={h.icu?.total} />
                            <span className="text-sm text-slate-300">
                              {h.icu?.available}/{h.icu?.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                            h.emergency
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                          }`}>
                            {h.emergency ? '🚨 Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingId(editingId === h._id ? null : h._id)}
                              className="btn bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs border border-cyan-500/30"
                            >
                              📊 Beds
                            </button>
                            <button
                              onClick={() => navigate(`/hospitals/${h._id}/edit`)}
                              className="btn bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-xs border border-slate-600/50"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(h._id, h.name)}
                              disabled={deleting === h._id}
                              className="btn bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs border border-red-500/30"
                            >
                              {deleting === h._id ? '...' : '🗑️'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {editingId === h._id && (
                        <tr className="bg-slate-800/50">
                          <td colSpan={5} className="px-4 py-4">
                            <AvailabilityEditor
                              hospital={h}
                              onSave={() => { load(); setEditingId(null) }}
                              onCancel={() => setEditingId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-500">No hospitals found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className={`card border ${color} p-4 sm:p-5 backdrop-blur-sm`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-display font-bold text-2xl text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}
