export function formatTravelMinutes(seconds) {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null
  const m = Math.max(1, Math.round(seconds / 60))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

export function travelSourceLabel(source, t) {
  if (source === 'google_traffic') return t('etaSourceTraffic')
  if (source === 'google') return t('etaSourceGoogle')
  if (source === 'osrm') return t('etaSourceOsrm')
  if (source === 'estimate') return t('etaSourceEstimate')
  return ''
}
