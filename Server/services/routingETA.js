/**
 * Travel time enrichment: Google Distance Matrix (traffic) when GOOGLE_MAPS_API_KEY is set,
 * else OSRM public router (drive time, no live traffic), else rough estimate from straight-line distance.
 */

const AVG_URBAN_KMH = 28;

function estimateSecondsFromDistanceKm(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return null;
  return Math.round((distanceKm / AVG_URBAN_KMH) * 3600);
}

async function fetchJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

/**
 * @returns {Promise<Array<{ seconds: number, source: string } | null>>}
 */
async function googleDistanceMatrix(originLat, originLng, hospitals) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  const origins = `${originLat},${originLng}`;
  const destinations = hospitals.map((h) => `${h.lat},${h.lng}`).join('|');
  const params = new URLSearchParams({
    origins,
    destinations,
    key,
    departure_time: 'now',
    traffic_model: 'best_guess',
    mode: 'driving',
    region: 'in',
  });
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`;
  const data = await fetchJson(url, 20000);
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    console.warn('[routingETA] Google Distance Matrix:', data.status, data.error_message || '');
    return null;
  }
  const elements = data.rows?.[0]?.elements || [];
  return elements.map((el) => {
    if (el.status === 'OK') {
      const seconds = el.duration_in_traffic?.value ?? el.duration?.value;
      if (typeof seconds === 'number' && seconds > 0) {
        return { seconds, source: el.duration_in_traffic ? 'google_traffic' : 'google' };
      }
    }
    return null;
  });
}

async function osrmDurationSeconds(originLng, originLat, destLng, destLat) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
  const data = await fetchJson(url, 8000);
  if (data.code !== 'Ok' || !data.routes?.[0]) return null;
  return Math.round(data.routes[0].duration);
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * @param {Array<object>} hospitals - plain objects with lat, lng, optional distance (km)
 * @param {number} originLat
 * @param {number} originLng
 * @returns {Promise<Array<object>>}
 */
async function enrichHospitalsWithTravelTimes(hospitals, originLat, originLng) {
  if (!hospitals.length) return hospitals;

  let googleRow = null;
  try {
    googleRow = await googleDistanceMatrix(originLat, originLng, hospitals);
  } catch (e) {
    console.warn('[routingETA] Google request failed:', e.message);
  }

  if (googleRow && googleRow.length === hospitals.length && googleRow.every((x) => x)) {
    return hospitals.map((h, i) => {
      const g = googleRow[i];
      if (g) {
        return {
          ...h,
          travelDurationSeconds: g.seconds,
          travelDurationSource: g.source,
        };
      }
      return { ...h, travelDurationSeconds: null, travelDurationSource: null };
    });
  }

  const osrmResults = await mapWithConcurrency(hospitals, 4, async (h) => {
    try {
      const sec = await osrmDurationSeconds(originLng, originLat, h.lng, h.lat);
      if (sec != null) return { seconds: sec, source: 'osrm' };
    } catch (e) {
      /* ignore */
    }
    return null;
  });

  return hospitals.map((h, i) => {
    const o = osrmResults[i];
    if (o) {
      return {
        ...h,
        travelDurationSeconds: o.seconds,
        travelDurationSource: o.source,
      };
    }
    const est = estimateSecondsFromDistanceKm(h.distance);
    return {
      ...h,
      travelDurationSeconds: est,
      travelDurationSource: est != null ? 'estimate' : null,
    };
  });
}

function sortByTravelTimeThenDistance(hospitals) {
  const hasAnyEta = hospitals.some((h) => typeof h.travelDurationSeconds === 'number');
  if (!hasAnyEta) return [...hospitals].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  return [...hospitals].sort((a, b) => {
    const ta = a.travelDurationSeconds ?? Infinity;
    const tb = b.travelDurationSeconds ?? Infinity;
    if (ta !== tb) return ta - tb;
    return (a.distance ?? 0) - (b.distance ?? 0);
  });
}

module.exports = {
  enrichHospitalsWithTravelTimes,
  sortByTravelTimeThenDistance,
  estimateSecondsFromDistanceKm,
};
