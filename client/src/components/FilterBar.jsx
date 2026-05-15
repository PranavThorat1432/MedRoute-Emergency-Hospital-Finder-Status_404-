import { useLang } from '../context/LangContext'

const BLOOD_OPTIONS = ['', 'O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

export default function FilterBar({ filters, setFilters, search, setSearch, bloodGroup, setBloodGroup }) {
  const { t } = useLang()

  function toggle(key) {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const chips = [
    { key: 'beds', label: t('filterBeds'), icon: '🛏️' },
    { key: 'icu', label: t('filterICU'), icon: '💉' },
    { key: 'ventilators', label: t('filterVentilator'), icon: '🫁' },
    { key: 'emergency', label: t('filterEmergency'), icon: '🚨' },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input-tech pl-11"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 flex-wrap">
          {chips.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                filters[key]
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:border-cyan-500/50 hover:text-cyan-400 backdrop-blur-sm'
              }`}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor="blood-filter" className="text-sm text-slate-300 font-medium whitespace-nowrap">
          🩸 {t('filterBlood')}
        </label>
        <select
          id="blood-filter"
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="input-tech min-w-[140px] cursor-pointer"
        >
          {BLOOD_OPTIONS.map((g) => (
            <option key={g || 'any'} value={g}>
              {g ? `${g} ${t('bloodUnitsAvailable')}` : t('bloodAny')}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
