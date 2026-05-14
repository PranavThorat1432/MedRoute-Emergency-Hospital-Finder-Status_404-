const Admin = require('../models/Admin');
const Hospital = require('../models/Hospital');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinary');

// POST /api/admin/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username });

    if (!admin) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, username: admin.username }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({ success: true, token, admin: { username: admin.username } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/hospitals — all hospitals (including inactive)
exports.getAllHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().sort({ createdAt: -1 });
    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/hospitals — create new hospital
exports.createHospital = async (req, res) => {
  try {
    const data = { ...req.body };

    // Parse nested objects if sent as strings
    ['beds', 'icu', 'ventilators', 'emergencySlots'].forEach((field) => {
      if (typeof data[field] === 'string') data[field] = JSON.parse(data[field]);
    });
    if (typeof data.specialities === 'string') {
      data.specialities = data.specialities.split(',').map((s) => s.trim());
    }

    if (req.file) {
      data.image = req.file.path;
      data.imagePublicId = req.file.filename;
    }

    const hospital = await Hospital.create(data);
    res.status(201).json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/hospitals/:id — update hospital
exports.updateHospital = async (req, res) => {
  try {
    const data = { ...req.body };

    ['beds', 'icu', 'ventilators', 'emergencySlots'].forEach((field) => {
      if (typeof data[field] === 'string') data[field] = JSON.parse(data[field]);
    });
    if (typeof data.specialities === 'string') {
      data.specialities = data.specialities.split(',').map((s) => s.trim());
    }

    if (req.file) {
      // Delete old image from Cloudinary if exists
      const existing = await Hospital.findById(req.params.id);
      if (existing?.imagePublicId) {
        await cloudinary.uploader.destroy(existing.imagePublicId).catch(() => {});
      }
      data.image = req.file.path;
      data.imagePublicId = req.file.filename;
    }

    const hospital = await Hospital.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/hospitals/:id
exports.deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    if (hospital.imagePublicId) {
      await cloudinary.uploader.destroy(hospital.imagePublicId).catch(() => {});
    }
    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hospital deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/hospitals/:id/availability — quick bed update
exports.updateAvailability = async (req, res) => {
  try {
    const { beds, icu, ventilators, emergencySlots } = req.body;
    const update = {};
    if (beds !== undefined) update.beds = beds;
    if (icu !== undefined) update.icu = icu;
    if (ventilators !== undefined) update.ventilators = ventilators;
    if (emergencySlots !== undefined) update.emergencySlots = emergencySlots;

    const hospital = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
