const mongoose = require('mongoose');

const BLOOD_GROUPS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

const bloodEntrySchema = new mongoose.Schema(
  {
    group: { type: String, enum: BLOOD_GROUPS, required: true },
    units: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String, default: 'Jalgaon' },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    image: {
      type: String,
      default:
        'https://res.cloudinary.com/demo/image/upload/v1/medroute/hospitals/default_hospital.jpg',
    },
    imagePublicId: { type: String, default: '' },
    emergency: { type: Boolean, default: false },
    specialities: [{ type: String }],
    beds: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    icu: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    ventilators: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    emergencySlots: {
      total: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    bloodInventory: { type: [bloodEntrySchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);
Hospital.BLOOD_GROUPS = BLOOD_GROUPS;
module.exports = Hospital;
