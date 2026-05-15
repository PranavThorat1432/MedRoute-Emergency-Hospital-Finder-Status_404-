export function getOrCreateSessionId() {
  let id = localStorage.getItem('medroute_session_id')
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('medroute_session_id', id)
  }
  return id
}

export function saveLastKnownLocation(lat, lng) {
  try {
    localStorage.setItem('medroute_last_lat', String(lat))
    localStorage.setItem('medroute_last_lng', String(lng))
  } catch {
    /* ignore */
  }
}

export function getLastKnownLocation() {
  // Hardcoded fallback: Godavari College of Engineering
  return { lat: 21.00399, lng: 75.59704 }
}
