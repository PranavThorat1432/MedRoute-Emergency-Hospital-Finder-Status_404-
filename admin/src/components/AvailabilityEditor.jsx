import { useState } from 'react'
import api from '../utils/api'

const FIELDS = [
  { key: 'beds', label: 'General Beds', icon: '🛏️' },
  { key: 'icu', label: 'ICU', icon: '💉' },
  { key: 'ventilators', label: 'Ventilators', icon: '🫁' },
  { key: 'emergencySlots', label: 'Emergency Slots', icon: '🚨' },
]

export default function AvailabilityEditor({ hospital, onSave, onCancel }) {
  const init = {}
  FIELDS.forEach(({ key }) => {
    init[key] = { total: hospital[key]?.total ?? 0, available: hospital[key]?.available ?? 0 }
  })

  const [values, setValues] = useState(init)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(field, sub, val) {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0) return
    setValues((prev) => ({ ...prev, [field]: { ...prev[field], [sub]: n } }))
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await api.patch(`/hospitals/${hospital._id}/availability`, values)
      onSave()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-600">
      <h3 className="font-display font-bold text-base text-white mb-4">
        📊 Update Availability — {hospital.name}
      </h3>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {FIELDS.map(({ key, label, icon }) => (
          <div key={key} className="bg-slate-800 rounded-xl p-3">
            <div className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
              <span>{icon}</span> {label}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Total</label>
                <input
                  type="number"
                  min="0"
                  value={values[key].total}
                  onChange={(e) => update(key, 'total', e.target.value)}
                  className="input py-1.5 text-center text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Available</label>
                <input
                  type="number"
                  min="0"
                  max={values[key].total}
                  value={values[key].available}
                  onChange={(e) => update(key, 'available', e.target.value)}
                  className={`input py-1.5 text-center text-sm ${
                    values[key].available === 0
                      ? 'border-red-600 text-red-400'
                      : values[key].available / (values[key].total || 1) <= 0.5
                      ? 'border-amber-600 text-amber-400'
                      : 'border-emerald-600 text-emerald-400'
                  }`}
                />
              </div>
            </div>
            {/* Mini progress */}
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  values[key].available === 0 ? 'bg-red-500' :
                  values[key].available / (values[key].total || 1) <= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${values[key].total ? (values[key].available / values[key].total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-3">⚠️ {error}</p>}

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-ghost">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-1.5">
          {saving ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            '✅ Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}
