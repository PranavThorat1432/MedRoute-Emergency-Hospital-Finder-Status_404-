const BedHold = require('../models/BedHold');
const Hospital = require('../models/Hospital');

const HOLD_MS = 20 * 60 * 1000;
const MAX_EXPIRY_BATCH = 500;


// Realising expire holds
async function releaseExpiredHolds() {
  const now = new Date();
  let count = 0;
  for (let i = 0; i < MAX_EXPIRY_BATCH; i += 1) {
    const prev = await BedHold.findOneAndUpdate(
      { status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'released', releaseReason: 'expired' } },
      { sort: { expiresAt: 1 }, new: false }
    ).lean();
    if (!prev) break;
    await Hospital.collection.updateOne(
      { _id: prev.hospital },
      { $inc: { [`${prev.resourceType}.available`]: 1 } }
    );
    count += 1;
  }
  return count;
}


// Admin can relese all holds
async function releaseAllActiveHoldsForHospital(hospitalId) {
  const active = await BedHold.find({ hospital: hospitalId, status: 'active' }).select('_id').lean();
  let n = 0;
  for (const { _id } of active) {
    const prev = await BedHold.findOneAndUpdate(
      { _id, hospital: hospitalId, status: 'active' },
      { $set: { status: 'released', releaseReason: 'admin_bulk' } },
      { new: false }
    ).lean();
    if (!prev) continue;
    await Hospital.collection.updateOne(
      { _id: prev.hospital },
      { $inc: { [`${prev.resourceType}.available`]: 1 } }
    );
    n += 1;
  }
  return n;
}


// Admin can cancels any hold or freeze
async function cancelHoldByAdmin(holdId) {
  const prev = await BedHold.findOneAndUpdate(
    { _id: holdId, status: 'active' },
    { $set: { status: 'released', releaseReason: 'admin_cancel' } },
    { new: false }
  ).lean();
  if (!prev) return { ok: false, reason: 'not_active' };
  await Hospital.collection.updateOne(
    { _id: prev.hospital },
    { $inc: { [`${prev.resourceType}.available`]: 1 } }
  );
  return { ok: true, hold: prev };
}


// Admin confirms the hold or freeze
async function confirmHoldByAdmin(holdId) {
  const prev = await BedHold.findOneAndUpdate(
    { _id: holdId, status: 'active' },
    { $set: { status: 'confirmed' }, $unset: { releaseReason: 1 } },
    { new: false }
  ).lean();
  if (!prev) return { ok: false, reason: 'not_active' };
  return { ok: true, hold: prev };
}

async function getActiveHoldForSession(sessionId) {
  await releaseExpiredHolds();
  return BedHold.findOne({ sessionId, status: 'active' }).lean();
}

module.exports = {
  HOLD_MS,
  releaseExpiredHolds,
  releaseAllActiveHoldsForHospital,
  cancelHoldByAdmin,
  confirmHoldByAdmin,
  getActiveHoldForSession,
};
