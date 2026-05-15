const mongoose = require('mongoose');
const BedHold = require('../models/BedHold');
const Hospital = require('../models/Hospital');
const { HOLD_MS, releaseExpiredHolds, getActiveHoldForSession } = require('../services/holdService');

const RESOURCE_TYPES = BedHold.RESOURCE_TYPES;

// POST /api/hospitals/:id/hold  { sessionId, resourceType }
exports.createHold = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { sessionId, resourceType } = req.body;
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ success: false, message: 'sessionId required' });
    }
    if (!resourceType || !RESOURCE_TYPES.includes(resourceType)) {
      return res.status(400).json({
        success: false,
        message: `resourceType must be one of: ${RESOURCE_TYPES.join(', ')}`,
      });
    }

    const existing = await getActiveHoldForSession(sessionId);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active bed hold. Wait for it to expire or confirm arrival.',
        data: { holdId: existing._id, expiresAt: existing.expiresAt },
      });
    }

    const hospitalId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({ success: false, message: 'Invalid hospital id' });
    }

    const updated = await Hospital.findOneAndUpdate(
      {
        _id: hospitalId,
        isActive: true,
        [`${resourceType}.available`]: { $gt: 0 },
      },
      { $inc: { [`${resourceType}.available`]: -1 } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(409).json({
        success: false,
        message: 'No availability for that resource at this hospital',
      });
    }

    const expiresAt = new Date(Date.now() + HOLD_MS);
    const hold = await BedHold.create({
      hospital: hospitalId,
      resourceType,
      sessionId,
      expiresAt,
      status: 'active',
    });

    res.status(201).json({
      success: true,
      data: {
        holdId: hold._id,
        hospitalId,
        resourceType,
        expiresAt: hold.expiresAt,
        holdDurationMinutes: 20,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/hospitals/hold/:holdId/confirm  { sessionId }
exports.confirmHold = async (req, res) => {
  try {
    await releaseExpiredHolds();

    const { holdId } = req.params;
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId required' });
    }
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      return res.status(400).json({ success: false, message: 'Invalid hold id' });
    }

    const hold = await BedHold.findOne({
      _id: holdId,
      sessionId,
      status: 'active',
    });
    if (!hold) {
      return res.status(404).json({ success: false, message: 'Active hold not found' });
    }

    hold.status = 'confirmed';
    await hold.save();

    res.json({ success: true, message: 'Hold confirmed — please proceed to the hospital', data: { holdId } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
