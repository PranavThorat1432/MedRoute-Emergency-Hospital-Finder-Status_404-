const Hospital = require('../models/Hospital');
const BedHold = require('../models/BedHold');
const {
  enrichHospitalsWithTravelTimes,
  sortByTravelTimeThenDistance,
  estimateSecondsFromDistanceKm,
} = require('../services/routingETA');
const { releaseExpiredHolds } = require('../services/holdService');

// Haversine formula — distance in km
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// GET /api/hospitals — with optional lat/lng for distance + travel time sorting
exports.getAllHospitals = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { lat, lng, emergency, beds, icu, ventilators, blood, search } = req.query;

    let query = { isActive: true };

    if (emergency === 'true') {
      query.emergency = true;
      query['emergencySlots.available'] = { $gt: 0 };
    }
    if (beds === 'true') query['beds.available'] = { $gt: 0 };
    if (icu === 'true') query['icu.available'] = { $gt: 0 };
    if (ventilators === 'true') query['ventilators.available'] = { $gt: 0 };
    if (blood && typeof blood === 'string' && blood.trim()) {
      query.bloodInventory = { $elemMatch: { group: blood.trim(), units: { $gt: 0 } } };
    }
    if (search) query.name = { $regex: search, $options: 'i' };

    let hospitals = await Hospital.find(query).lean();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      hospitals = hospitals.map((h) => ({
        ...h,
        distance: getDistance(userLat, userLng, h.lat, h.lng),
      }));
      hospitals.sort((a, b) => a.distance - b.distance);
      try {
        hospitals = await enrichHospitalsWithTravelTimes(hospitals, userLat, userLng);
        hospitals = sortByTravelTimeThenDistance(hospitals);
      } catch (e) {
        console.warn('[hospitals] ETA enrichment failed:', e.message);
      }
    }

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hospitals/emergency — top 3 nearest with emergency availability
exports.getEmergencyHospitals = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { lat, lng } = req.query;

    let hospitals = await Hospital.find({
      isActive: true,
      emergency: true,
      $or: [
        { 'emergencySlots.available': { $gt: 0 } },
        { 'icu.available': { $gt: 0 } },
      ],
    }).lean();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      hospitals = hospitals
        .map((h) => ({
          ...h,
          distance: getDistance(userLat, userLng, h.lat, h.lng),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);
      try {
        hospitals = await enrichHospitalsWithTravelTimes(hospitals, userLat, userLng);
        hospitals = sortByTravelTimeThenDistance(hospitals);
      } catch (e) {
        console.warn('[emergency] ETA enrichment failed:', e.message);
      }
    } else {
      hospitals = hospitals.slice(0, 3);
    }

    res.json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/hospitals/:id — single hospital detail; optional lat,lng for one-leg ETA
exports.getHospitalById = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const hospital = await Hospital.findById(req.params.id).lean();
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });

    const { lat, lng } = req.query;
    let payload = { ...hospital };
    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const distance = getDistance(userLat, userLng, hospital.lat, hospital.lng);
      payload.distance = distance;
      try {
        const [enriched] = await enrichHospitalsWithTravelTimes(
          [{ ...hospital, distance }],
          userLat,
          userLng
        );
        payload.travelDurationSeconds = enriched.travelDurationSeconds;
        payload.travelDurationSource = enriched.travelDurationSource;
      } catch (e) {
        payload.travelDurationSeconds = estimateSecondsFromDistanceKm(distance);
        payload.travelDurationSource = payload.travelDurationSeconds != null ? 'estimate' : null;
      }
    }

    if (req.query.sessionId) {
      const hold = await BedHold.findOne({
        hospital: req.params.id,
        sessionId: String(req.query.sessionId),
        status: 'active',
      }).lean();
      payload.activeHold = hold || null;
    }

    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
