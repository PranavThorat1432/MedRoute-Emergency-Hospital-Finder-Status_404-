import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../utils/api'

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-']

function normalizeBloodInventory(inv) {
  const map = {}
  ;(inv || []).forEach((x) => {
    if (x.group) map[x.group] = x.units ?? 0
  })
  return BLOOD_GROUPS.map((group) => ({ group, units: map[group] ?? 0 }))
}

const EMPTY = {
  name: '', city: 'Jalgaon', address: '', phone: '', email: '', website: '',
  lat: '', lng: '', emergency: false,
  specialities: '',
  beds: { total: 0, available: 0 },
  icu: { total: 0, available: 0 },
  ventilators: { total: 0, available: 0 },
  emergencySlots: { total: 0, available: 0 },
  bloodInventory: normalizeBloodInventory([]),
}

export default function HospitalForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!isEdit) return
    api.get(`/hospitals`).then((res) => {
      const h = res.data.data.find((x) => x._id === id)
      if (h) {
        setForm({
          ...h,
          specialities: h.specialities?.join(', ') || '',
          bloodInventory: normalizeBloodInventory(h.bloodInventory),
        })
        setImagePreview(h.image || '')
      }
      setLoading(false)
    })
  }, [id, isEdit])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setBloodUnits(group, val) {
    const n = parseInt(val, 10)
    setForm((prev) => ({
      ...prev,
      bloodInventory: prev.bloodInventory.map((row) =>
        row.group === group ? { ...row, units: isNaN(n) || n < 0 ? 0 : n } : row
      ),
    }))
  }

  function setNested(parent, sub, value) {
    const n = parseInt(value, 10)
    setForm((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [sub]: isNaN(n) ? 0 : n },
    }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (['beds', 'icu', 'ventilators', 'emergencySlots'].includes(k)) {
          data.append(k, JSON.stringify(v))
        } else if (k === 'bloodInventory') {
          const filtered = v.filter((b) => b.units > 0)
          data.append(k, JSON.stringify(filtered))
        } else if (k !== 'image' && k !== 'imagePublicId' && k !== '__v' && k !== '_id' && k !== 'createdAt' && k !== 'updatedAt') {
          data.append(k, v)
        }
      })
      if (imageFile) data.append('image', imageFile)

      if (isEdit) {
        await api.put(`/hospitals/${id}`, data)
      } else {
        await api.post('/hospitals', data)
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    )

  const AVAILABILITY_FIELDS = [
    { key: 'beds', label: 'General Beds', icon: '🛏️' },
    { key: 'icu', label: 'ICU', icon: '💉' },
    { key: 'ventilators', label: 'Ventilators', icon: '🫁' },
    { key: 'emergencySlots', label: 'Emergency Slots', icon: '🚨' },
  ]

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      {/* Nav */}
      <div className="max-w-3xl mx-auto px-4 mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="btn-ghost">← Back</button>
        <h1 className="font-display font-bold text-xl text-white">
          {isEdit ? 'Edit Hospital' : 'Add New Hospital'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 space-y-6">
        {/* Image Upload */}
        <div className="card-admin p-5">
          <h2 className="font-display font-semibold text-base text-white mb-4">Hospital Image</h2>
          <div className="flex items-start gap-5">
            <div className="w-32 h-24 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🏥</div>
              )}
            </div>
            <div className="flex-1">
              <label className="label">Upload Image (Cloudinary)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                className="input py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-sky-600 file:text-white file:cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">JPG, PNG, WEBP • Max 5MB • Auto-optimized via Cloudinary</p>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card-admin p-5">
          <h2 className="font-display font-semibold text-base text-white mb-4">Basic Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Hospital Name *</label>
              <input required className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Civil Hospital Jalgaon" />
            </div>
            <div>
              <label className="label">Phone *</label>
              <input required className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0257-2226077" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@hospital.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address *</label>
              <input required className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Full address..." />
            </div>
            <div>
              <label className="label">Latitude *</label>
              <input required type="number" step="any" className="input" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="21.0077" />
            </div>
            <div>
              <label className="label">Longitude *</label>
              <input required type="number" step="any" className="input" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="75.5626" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Specialities (comma-separated)</label>
              <input className="input" value={form.specialities} onChange={(e) => set('specialities', e.target.value)} placeholder="Cardiology, Surgery, ICU..." />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emergency"
                checked={form.emergency}
                onChange={(e) => set('emergency', e.target.checked)}
                className="w-5 h-5 rounded accent-red-500"
              />
              <label htmlFor="emergency" className="text-sm font-semibold text-slate-300 cursor-pointer">
                🚨 Emergency Services Available
              </label>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="card-admin p-5">
          <h2 className="font-display font-semibold text-base text-white mb-4">Bed Availability</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {AVAILABILITY_FIELDS.map(({ key, label, icon }) => (
              <div key={key} className="bg-slate-700/50 rounded-xl p-4">
                <div className="font-semibold text-slate-200 text-sm mb-3">{icon} {label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Total</label>
                    <input
                      type="number" min="0"
                      className="input text-center"
                      value={form[key]?.total ?? 0}
                      onChange={(e) => setNested(key, 'total', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Available</label>
                    <input
                      type="number" min="0"
                      className="input text-center"
                      value={form[key]?.available ?? 0}
                      onChange={(e) => setNested(key, 'available', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Blood bank (units available) */}
        <div className="card-admin p-5">
          <h2 className="font-display font-semibold text-base text-white mb-2">Blood bank (units)</h2>
          <p className="text-xs text-slate-500 mb-4">Report units in stock for each group (0 = not listed).</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {form.bloodInventory.map((row) => (
              <div key={row.group}>
                <label className="label">{row.group}</label>
                <input
                  type="number"
                  min="0"
                  className="input text-center"
                  value={row.units}
                  onChange={(e) => setBloodUnits(row.group, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <div className="flex gap-3 pb-8">
          <button type="button" onClick={() => navigate('/')} className="btn-ghost flex-1">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              `${isEdit ? 'Update' : 'Create'} Hospital`
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
