const mongoose = require('mongoose');

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
        'https://res.cloudinary.com/demo/image/upload/v1/public/default_hospital.jpg',
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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hospital', hospitalSchema);
