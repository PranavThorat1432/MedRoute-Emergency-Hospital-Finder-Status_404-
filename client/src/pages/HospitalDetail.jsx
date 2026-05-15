import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getBedStatus } from '../utils/distance'
import { LangProvider, useLang } from '../context/LangContext'
import Navbar from '../components/Navbar'
import { backendURL } from '../App'
import { getOrCreateSessionId, getLastKnownLocation } from '../utils/sessionId'
import { formatTravelMinutes, travelSourceLabel } from '../utils/formatTravel'

function BedProgress({ label, icon, available, total, status }) {
  const percent = total ? Math.round((available / total) * 100) : 0
  const barColor = {
    available: 'bg-emerald-400 shadow-lg shadow-emerald-500/50',
    limited: 'bg-amber-400 shadow-lg shadow-amber-500/50',
    full: 'bg-red-400 shadow-lg shadow-red-500/50',
  }[status]

  const bgColor = {
    available: 'bg-emerald-500/10 border-emerald-500/30',
    limited: 'bg-amber-500/10 border-amber-500/30',
    full: 'bg-red-500/10 border-red-500/30',
  }[status]

  const textColor = {
    available: 'text-emerald-400',
    limited: 'text-amber-400',
    full: 'text-red-400',
  }[status]

  return (
    <div className={`rounded-2xl border p-4 backdrop-blur-sm ${bgColor}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-semibold text-slate-300 text-sm">{label}</span>
        </div>
        <span className={`font-bold text-lg text-white`}>
          {available}
          <span className="font-normal text-sm text-slate-400">/{total}</span>
        </span>
      </div>
      <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-400">{percent}% available</span>
        <span className={`text-xs font-bold uppercase tracking-wide ${textColor}`}>
          {status}
        </span>
      </div>
    </div>
  )
}

const RESOURCE_KEYS = ['beds', 'icu', 'ventilators', 'emergencySlots']

function HoldCountdown({ expiresAt }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(expiresAt) - Date.now()))

  useEffect(() => {
    const tmr = setInterval(() => {
      setLeft(Math.max(0, new Date(expiresAt) - Date.now()))
    }, 1000)
    return () => clearInterval(tmr)
  }, [expiresAt])

  const m = Math.floor(left / 60000)
  const s = Math.floor((left % 60000) / 1000)
  return (
    <span className="font-mono font-bold text-amber-900">
      {m}:{s.toString().padStart(2, '0')}
    </span>
  )
}

function DetailContent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [hospital, setHospital] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [holdMsg, setHoldMsg] = useState('')
  const [holdSubmitting, setHoldSubmitting] = useState(false)

  const loadHospital = useCallback(async () => {
    const loc = getLastKnownLocation()
    const sessionId = getOrCreateSessionId()
    const params = { sessionId }
    if (loc) {
      params.lat = loc.lat
      params.lng = loc.lng
    }
    const r = await axios.get(`${backendURL}/api/hospitals/${id}`, { params })
    setHospital(r.data.data)
  }, [id])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    loadHospital()
      .catch(() => {
        if (!cancelled) setError('Hospital not found')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, loadHospital])

  useEffect(() => {
    const hasHold = Boolean(hospital?.activeHold)
    const ms = hasHold ? 8000 : 20000
    const poll = setInterval(() => {
      loadHospital().catch(() => {})
    }, ms)
    return () => clearInterval(poll)
  }, [loadHospital, id, hospital?.activeHold?._id])

  useEffect(() => {
    const ex = hospital?.activeHold?.expiresAt
    if (!ex) return undefined
    const delay = new Date(ex).getTime() - Date.now() + 500
    if (delay < 100 || delay > 25 * 60 * 1000) return undefined
    const t = setTimeout(() => {
      loadHospital().catch(() => {})
    }, delay)
    return () => clearTimeout(t)
  }, [hospital?.activeHold?.expiresAt, loadHospital])

  async function createHold(resourceType) {
    setHoldMsg('')
    setHoldSubmitting(true)
    try {
      await axios.post(`${backendURL}/api/hospitals/${id}/hold`, {
        sessionId: getOrCreateSessionId(),
        resourceType,
      })
      await loadHospital()
    } catch (e) {
      setHoldMsg(e.response?.data?.message || t('holdError'))
    } finally {
      setHoldSubmitting(false)
    }
  }

  async function confirmHold() {
    if (!hospital?.activeHold?._id) return
    setHoldMsg('')
    setHoldSubmitting(true)
    try {
      await axios.post(`${backendURL}/api/hospitals/hold/${hospital.activeHold._id}/confirm`, {
        sessionId: getOrCreateSessionId(),
      })
      await loadHospital()
    } catch (e) {
      setHoldMsg(e.response?.data?.message || t('holdError'))
    } finally {
      setHoldSubmitting(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 tech-grid">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">{t('loading')}</p>
        </div>
      </div>
    )

  if (error || !hospital)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 tech-grid">
        <div className="text-center">
          <div className="text-5xl mb-4">🏥</div>
          <h2 className="font-display font-bold text-xl text-slate-300">Hospital not found</h2>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            {t('back')}
          </button>
        </div>
      </div>
    )

  const mapsUrl = `https://www.google.com/maps?q=${hospital.lat},${hospital.lng}`

  const resourceMeta = {
    beds: { icon: '🛏️', label: t('beds') },
    icu: { icon: '💉', label: t('icu') },
    ventilators: { icon: '🫁', label: t('ventilators') },
    emergencySlots: { icon: '🚨', label: t('Ambulance') },
  }

  const bloodRows = (hospital.bloodInventory || []).filter((b) => b.units > 0)

  return (
    <div className="min-h-screen bg-slate-950 tech-grid">
      <Navbar />

      {/* Hero Image */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img
          src={hospital.image}
          alt={hospital.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm text-cyan-400 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-slate-800/80 transition-colors shadow-lg border border-cyan-500/30"
        >
          {t('back')}
        </button>
        {hospital.emergency && (
          <span className="absolute top-4 right-4 bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-red-500/30 border border-red-400/30">
            🚨 Emergency Services
          </span>
        )}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white drop-shadow-lg">
            {hospital.name}
          </h1>
          <p className="text-cyan-400/80 text-sm mt-1">📍 {hospital.address}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Availability */}
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                {t('availabilityStatus')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <BedProgress
                  icon="🛏️"
                  label={t('beds')}
                  available={hospital.beds?.available}
                  total={hospital.beds?.total}
                  status={getBedStatus(hospital.beds?.available, hospital.beds?.total)}
                />
                <BedProgress
                  icon="💉"
                  label={t('icu')}
                  available={hospital.icu?.available}
                  total={hospital.icu?.total}
                  status={getBedStatus(hospital.icu?.available, hospital.icu?.total)}
                />
                <BedProgress
                  icon="🫁"
                  label={t('ventilators')}
                  available={hospital.ventilators?.available}
                  total={hospital.ventilators?.total}
                  status={getBedStatus(hospital.ventilators?.available, hospital.ventilators?.total)}
                />
                <BedProgress
                  icon="🚨"
                  label={t('Ambulance')}
                  available={hospital.emergencySlots?.available}
                  total={hospital.emergencySlots?.total}
                  status={getBedStatus(hospital.emergencySlots?.available, hospital.emergencySlots?.total)}
                />
              </div>
            </div>

            {bloodRows.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg text-white mb-4">🩸 {t('bloodBank')}</h2>
                <div className="flex flex-wrap gap-2">
                  {bloodRows.map((b) => (
                    <span
                      key={b.group}
                      className="badge-tech bg-rose-500/10 text-rose-400 border-rose-500/30"
                    >
                      {b.group}: {b.units} units
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specialities */}
            {hospital.specialities?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display font-bold text-lg text-white mb-4">
                  🩺 {t('specialities')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {hospital.specialities.map((s) => (
                    <span
                      key={s}
                      className="badge-tech bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="card p-5 border-amber-500/30 bg-amber-500/10">
              <h3 className="font-display font-bold text-base text-white mb-2">⏱ {t('timeToReach')}</h3>
              {hospital.travelDurationSeconds != null ? (
                <>
                  <p className="text-2xl font-bold text-amber-400">
                    {formatTravelMinutes(hospital.travelDurationSeconds)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {travelSourceLabel(hospital.travelDurationSource, t)}
                  </p>
                </>
              ) : hospital.distance != null ? (
                <p className="text-sm text-slate-300">
                  📍 {hospital.distance.toFixed(1)} {t('distance')}
                </p>
              ) : (
                <p className="text-sm text-slate-400">—</p>
              )}
              {!getLastKnownLocation() && (
                <p className="text-xs text-amber-400 mt-2">{t('etaHintHome')}</p>
              )}
            </div>

            {/* Contact Card */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-base text-white mb-3">📋 {t('contact')}</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-start gap-2">
                  <span>📍</span>
                  <span className="leading-snug">{hospital.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📞</span>
                  <a href={`tel:${hospital.phone}`} className="text-cyan-400 font-semibold hover:underline">
                    {hospital.phone}
                  </a>
                </div>
                {hospital.email && (
                  <div className="flex items-center gap-2">
                    <span>✉️</span>
                    <a href={`mailto:${hospital.email}`} className="text-cyan-400 hover:underline truncate">
                      {hospital.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5 border-slate-700/50">
              <h3 className="font-display font-bold text-base text-white mb-2">{t('selectResource')}</h3>
              <p className="text-xs text-slate-400 mb-3">{t('holdMinutes')}</p>
              {holdMsg && <p className="text-sm text-red-400 mb-2">{holdMsg}</p>}
              {hospital.activeHold && (
                <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
                  <p className="font-semibold text-amber-400">{t('holdActive')}</p>
                  <p className="text-amber-300 mt-1">
                    {resourceMeta[hospital.activeHold.resourceType]?.icon}{' '}
                    {resourceMeta[hospital.activeHold.resourceType]?.label} — {t('holdExpiresIn')}:{' '}
                    <HoldCountdown expiresAt={hospital.activeHold.expiresAt} />
                  </p>
                  <button
                    type="button"
                    disabled={holdSubmitting}
                    onClick={confirmHold}
                    className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 rounded-xl disabled:opacity-50 border border-emerald-500/30"
                  >
                    {t('confirmArrival')}
                  </button>
                </div>
              )}
              {!hospital.activeHold &&
                RESOURCE_KEYS.map((key) => {
                  const avail = hospital[key]?.available ?? 0
                  if (avail <= 0) return null
                  const meta = resourceMeta[key]
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={holdSubmitting}
                      onClick={() => createHold(key)}
                      className="w-full mb-2 flex items-center justify-between gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold px-4 py-3 rounded-xl disabled:opacity-50 border border-cyan-400/30"
                    >
                      <span>
                        {meta.icon} {meta.label}
                      </span>
                      <span className="text-xs opacity-90">{t('holdBed')}</span>
                    </button>
                  )
                })}
              {!hospital.activeHold &&
                RESOURCE_KEYS.every((key) => (hospital[key]?.available ?? 0) <= 0) && (
                  <p className="text-sm text-slate-400">{t('noSlotsToHold')}</p>
                )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <a
                href={`tel:${hospital.phone}`}
                className="btn-primary w-full flex items-center justify-center gap-2 text-center"
              >
                📞 {t('callHospital')}
              </a>
              <button
                onClick={() => navigate('/', { state: { navigateTarget: { lat: hospital.lat, lng: hospital.lng } } })}
                className="flex items-center justify-center gap-2 w-full bg-slate-800/50 border-2 border-slate-700/50 hover:border-cyan-500/50 text-slate-300 font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-center hover:text-cyan-400 backdrop-blur-sm"
              >
                🗺️ Navigate on Map
              </button>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-center text-slate-500">
              Last updated: {new Date(hospital.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HospitalDetail() {
  return (
    <LangProvider>
      <DetailContent />
    </LangProvider>
  )
}
