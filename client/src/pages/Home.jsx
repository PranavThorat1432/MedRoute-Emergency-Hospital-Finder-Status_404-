import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import Navbar from '../components/Navbar'
import HospitalCard from '../components/HospitalCard'
import FilterBar from '../components/FilterBar'
import MapView from '../components/MapView'
import EmergencyMode from '../components/EmergencyMode'
import { LangProvider, useLang } from '../context/LangContext'
import { backendURL } from '../App'
import { saveLastKnownLocation, getLastKnownLocation } from '../utils/sessionId'

function HomeContent() {
  const { t } = useLang()
  const location = useLocation()
  const [hospitals, setHospitals] = useState([])
  const [emergencyHospitals, setEmergencyHospitals] = useState([])
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(() => getLastKnownLocation() || null)
  const [locationError, setLocationError] = useState('')
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [view, setView] = useState('list') // 'list' | 'map'
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    beds: false,
    icu: false,
    ventilators: false,
    emergency: false,
  })
  const [bloodGroup, setBloodGroup] = useState('')

  const fetchHospitals = useCallback(
    async (lat, lng) => {
      setLoading(true)
      try {
        const params = { ...(lat && { lat, lng }), ...filters, search }
        if (bloodGroup) params.blood = bloodGroup
        // Convert boolean filters to string for query
        Object.keys(params).forEach((k) => {
          if (params[k] === false) delete params[k]
          if (params[k] === true) params[k] = 'true'
        })
        const res = await axios.get(`${backendURL}/api/hospitals`, { params })
        setHospitals(res.data.data)
      } catch {
        setHospitals([])
      } finally {
        setLoading(false)
      }
    },
    [filters, bloodGroup, search]
  )

  const fetchEmergency = useCallback(async (lat, lng) => {
    try {
      const params = lat ? { lat, lng } : {}
      const res = await axios.get(`${backendURL}/api/hospitals/emergency`, { params })
      setEmergencyHospitals(res.data.data)
    } catch {
      setEmergencyHospitals([])
    }
  }, [])

  const [navigateTarget, setNavigateTarget] = useState(location.state?.navigateTarget || null)

  useEffect(() => {
    if (location.state?.navigateTarget) {
      setView('map')
      setNavigateTarget(location.state.navigateTarget)
      // clear state so it doesn't persist on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  useEffect(() => {
    fetchHospitals(userLocation?.lat, userLocation?.lng)
  }, [fetchHospitals, userLocation])

  function handleGetLocation() {
    setLocationLoading(true)
    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        saveLastKnownLocation(loc.lat, loc.lng)
        fetchEmergency(loc.lat, loc.lng)
        setLocationLoading(false)
      },
      () => {
        setLocationError(t('locationDenied'))
        setLocationLoading(false)
        fetchEmergency()
      },
      { timeout: 8000 }
    )
  }

  function handleEmergency() {
    if (!emergencyHospitals.length) fetchEmergency(userLocation?.lat, userLocation?.lng)
    setEmergencyMode(true)
  }

  const stats = {
    total: hospitals.length,
    withBeds: hospitals.filter((h) => h.beds?.available > 0).length,
    withICU: hospitals.filter((h) => h.icu?.available > 0).length,
  }

  return (
    <div className="min-h-screen bg-slate-950 tech-grid">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-cyan-950/30 to-slate-900 text-white">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, cyan 1px, transparent 1px), radial-gradient(circle at 75% 75%, cyan 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 backdrop-blur-sm border border-cyan-500/30 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
              <span className="text-cyan-400">JALGAON DISTRICT • {stats.total} HOSPITALS</span>
            </div>

            <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
              {t('heroTitle')}
            </h1>
            <p className="text-slate-300 text-lg sm:text-xl mb-8 leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGetLocation}
                disabled={locationLoading}
                className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-200 active:scale-95 text-base border border-cyan-400/30"
              >
                {locationLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('detectingLocation')}
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    {t('useLocation')}
                  </>
                )}
              </button>

              <button
                onClick={handleEmergency}
                className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-200 active:scale-95 text-base animate-pulse-slow border border-red-400/30"
              >
                {t('emergencyMode')}
              </button>
            </div>

            {locationError && (
              <p className="mt-3 text-amber-400 text-sm flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                <span>⚠️</span> {locationError}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="flex gap-6 mt-10 pt-8 border-t border-slate-700/50">
            <StatBadge label="Total Hospitals" value={stats.total} icon="🏥" />
            <StatBadge label="Beds Available" value={stats.withBeds} icon="🛏️" />
            <StatBadge label="ICU Available" value={stats.withICU} icon="💉" />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex-1">
            <FilterBar
              filters={filters}
              setFilters={setFilters}
              search={search}
              setSearch={setSearch}
              bloodGroup={bloodGroup}
              setBloodGroup={setBloodGroup}
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-1 shadow-lg self-start sm:self-auto">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'list' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              ☰ {t('listView')}
            </button>
            <button
              onClick={() => setView('map')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === 'map' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
              }`}
            >
              🗺️ {t('mapView')}
            </button>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-xl text-white">
            {userLocation ? t('Hospitals Near Me') : t('All Hospitals')}
          </h2>
          {!loading && (
            <span className="text-sm text-cyan-400 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/30 px-3 py-1 rounded-full shadow-lg shadow-cyan-500/20">
              {hospitals.length} hospitals
            </span>
          )}
        </div>

        {/* Map View */}
        {view === 'map' && (
          <div className="mb-8 animate-fade-in">
            <MapView hospitals={hospitals} userLocation={userLocation} navigateTarget={navigateTarget} />
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <>
            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🏥</div>
                <h3 className="font-display font-bold text-xl text-slate-300">{t('noHospitals')}</h3>
                <p className="text-slate-500 mt-2">{t('tryDifferentFilter')}</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {hospitals.map((h) => (
                  <HospitalCard key={h._id} hospital={h} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Emergency Mode Overlay */}
      {emergencyMode && (
        <EmergencyMode
          hospitals={emergencyHospitals}
          onClose={() => setEmergencyMode(false)}
        />
      )}
    </div>
  )
}

function StatBadge({ label, value, icon }) {
  return (
    <div>
      <div className="font-display font-bold text-2xl text-white">
        {icon} {value}
      </div>
      <div className="text-cyan-400/70 text-xs mt-0.5 font-medium">{label}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-800/50" />
      <div className="p-4 bg-gradient-to-b from-slate-900/50 to-slate-800/50">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="h-14 bg-slate-700/50 rounded-xl" />
          <div className="h-14 bg-slate-700/50 rounded-xl" />
        </div>
        <div className="flex gap-1 mb-3">
          <div className="h-5 w-16 bg-slate-700/50 rounded-full" />
          <div className="h-5 w-20 bg-slate-700/50 rounded-full" />
        </div>
        <div className="h-4 bg-slate-700/50 rounded-full" />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <LangProvider>
      <HomeContent />
    </LangProvider>
  )
}
