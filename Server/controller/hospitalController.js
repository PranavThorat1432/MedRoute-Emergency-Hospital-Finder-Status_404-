const Hospital = require('../models/Hospital');

exports.getAllHospitals = async (req, res) => {
  try {
    const { lat, lng, emergency, beds, icu, search } = req.query;

    let query = { isActive: true };

    if (emergency === 'true') {
      query.emergency = true;
      query['emergencySlots.available'] = { $gt: 0 };
    }
    if (beds === 'true') query['beds.available'] = { $gt: 0 };
    if (icu === 'true') query['icu.available'] = { $gt: 0 };
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
    }

    res.json({ 
      success: true, 
      count: hospitals.length, 
      data: hospitals 
    });

  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

