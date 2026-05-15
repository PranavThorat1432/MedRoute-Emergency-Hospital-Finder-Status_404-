const mongoose = require('mongoose');

const RESOURCE_TYPES = ['beds', 'icu', 'ventilators', 'emergencySlots'];

const bedHoldSchema = new mongoose.Schema(
  {
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
    resourceType: { type: String, enum: RESOURCE_TYPES, required: true },
    sessionId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['active', 'released', 'confirmed'],
      default: 'active',
    },
    releaseReason: {
      type: String,
      enum: ['expired', 'admin_cancel', 'admin_bulk'],
      default: undefined,
    },
  },
  { timestamps: true }
);

const BedHold = mongoose.model('BedHold', bedHoldSchema);
BedHold.RESOURCE_TYPES = RESOURCE_TYPES;
module.exports = BedHold;
