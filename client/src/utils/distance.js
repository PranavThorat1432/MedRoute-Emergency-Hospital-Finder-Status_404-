export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function getBedStatus(available, total) {
  if (!total || available === 0) return 'full'
  if (available / total <= 0.5) return 'limited'
  return 'available'
}

export function statusLabel(status, lang = 'en') {
  const map = {
    en: { available: 'Available', limited: 'Limited', full: 'Full' },
    hi: { available: 'उपलब्ध', limited: 'सीमित', full: 'भरा हुआ' },
    mr: { available: 'उपलब्ध', limited: 'मर्यादित', full: 'भरलेले' },
  }
  return map[lang]?.[status] || status
}

export function statusColor(status) {
  return {
    available: 'status-available',
    limited: 'status-limited',
    full: 'status-full',
  }[status] || 'status-full'
}

export function statusDot(status) {
  return {
    available: 'bg-emerald-500',
    limited: 'bg-amber-500',
    full: 'bg-red-500',
  }[status] || 'bg-red-500'
}
