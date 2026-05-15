import { useLang } from '../context/LangContext'
import HospitalCard from './HospitalCard'

export default function EmergencyMode({ hospitals, onClose }) {
  const { t } = useLang()

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-4 py-4 sm:px-6 border-b border-red-400/30 shadow-2xl shadow-red-500/30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 bg-white rounded-full animate-pulse shadow-lg shadow-white/50" />
              <span className="text-xs font-bold uppercase tracking-widest opacity-90">LIVE EMERGENCY MODE</span>
            </div>
            <h2 className="font-display font-bold text-xl sm:text-2xl">{t('emergencyTitle')}</h2>
            <p className="text-white/80 text-sm mt-0.5">{t('emergencySubtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-white/30 backdrop-blur-sm"
          >
            {t('emergencyModeOff')}
          </button>
        </div>
      </div>

      {/* Hospital Cards */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="max-w-3xl mx-auto">
          {hospitals.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <div className="text-5xl mb-4">🏥</div>
              <p className="text-lg font-semibold text-slate-300">No emergency hospitals found nearby</p>
              <p className="text-sm opacity-70 mt-1">Allow location access for better results</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hospitals.map((h, i) => (
                <div key={h._id} className="relative">
                  <div className="absolute -top-3 -left-2 z-10 w-8 h-8 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg shadow-red-500/50 border-2 border-white">
                    #{i + 1}
                  </div>
                  <HospitalCard hospital={h} isEmergency />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
