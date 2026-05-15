import { useNavigate } from 'react-router-dom'
import { getBedStatus } from '../utils/distance'
import { useLang } from '../context/LangContext'
import { formatTravelMinutes, travelSourceLabel } from '../utils/formatTravel'

export default function HospitalCard({ hospital, isEmergency = false }) {
  const navigate = useNavigate()
  const { t } = useLang()

  const bedStatus = getBedStatus(hospital.beds?.available, hospital.beds?.total)
  const icuStatus = getBedStatus(hospital.icu?.available, hospital.icu?.total)

  return (
    <div
      className={`card cursor-pointer group overflow-hidden animate-slide-up ${
        isEmergency ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 glow-red' : ''
      }`}
      onClick={() => navigate(`/hospital/${hospital._id}`)}
    >
      {/* Hospital Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={hospital.image || 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop'}
          alt={hospital.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Badges on image */}
        <div className="absolute top-3 left-3 flex gap-2">
          {hospital.emergency && (
            <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-red-500/30 border border-red-400/30">
              🚨 {t('emergency').toUpperCase()}
            </span>
          )}
        </div>

        {/* Distance + travel time */}
        {(hospital.distance !== undefined || hospital.travelDurationSeconds != null) && (
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end max-w-[55%]">
            {hospital.distance !== undefined && (
              <div className="bg-slate-900/80 backdrop-blur-sm text-cyan-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-cyan-500/30">
                📍 {hospital.distance.toFixed(1)} {t('distance')}
              </div>
            )}
            {hospital.travelDurationSeconds != null && (
              <div
                className="bg-amber-500/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg shadow-amber-500/30 border border-amber-400/30"
                title={travelSourceLabel(hospital.travelDurationSource, t)}
              >
                ⏱ {t('timeToReach')}: {formatTravelMinutes(hospital.travelDurationSeconds)}
              </div>
            )}
          </div>
        )}

        {/* Hospital name on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-display font-bold text-lg leading-tight drop-shadow-lg line-clamp-2">
            {hospital.name}
          </h3>
          <p className="text-cyan-400/80 text-xs mt-1 line-clamp-1 font-medium">📍 {hospital.address}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm">
        {/* Bed Availability Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <BedStat
            icon="🛏️"
            label={t('beds')}
            available={hospital.beds?.available}
            total={hospital.beds?.total}
            status={bedStatus}
          />
          <BedStat
            icon="💉"
            label={t('icu')}
            available={hospital.icu?.available}
            total={hospital.icu?.total}
            status={icuStatus}
          />
        </div>

        {/* Specialities */}
        {hospital.specialities?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {hospital.specialities.slice(0, 3).map((s) => (
              <span key={s} className="badge-tech bg-slate-700/50 text-slate-300 border-slate-600/50">
                {s}
              </span>
            ))}
            {hospital.specialities.length > 3 && (
              <span className="badge-tech bg-slate-700/30 text-slate-400 border-slate-600/30">
                +{hospital.specialities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
          <a
            href={`tel:${hospital.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
          >
            <span>📞</span>
            <span className="hidden sm:inline">{t('callHospital')}</span>
            <span className="sm:hidden">Call</span>
          </a>
          <span className="text-cyan-400 font-semibold text-sm group-hover:translate-x-1 transition-transform duration-200 flex items-center gap-1">
            {t('viewDetails')} <span className="text-cyan-500">→</span>
          </span>
        </div>
      </div>
    </div>
  )
}

function BedStat({ icon, label, available, total, status }) {
  const colorMap = {
    available: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    limited: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    full: 'text-red-400 bg-red-500/10 border-red-500/30',
  }
  const dotMap = {
    available: 'bg-emerald-400 shadow-lg shadow-emerald-500/50',
    limited: 'bg-amber-400 shadow-lg shadow-amber-500/50',
    full: 'bg-red-400 shadow-lg shadow-red-500/50',
  }
  return (
    <div className={`rounded-xl border px-3 py-2.5 backdrop-blur-sm ${colorMap[status]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium truncate text-slate-300">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotMap[status]}`} />
        <span className="font-bold text-sm text-white">
          {available ?? 0}
          <span className="font-normal text-xs text-slate-400">/{total ?? 0}</span>
        </span>
      </div>
    </div>
  )
}
